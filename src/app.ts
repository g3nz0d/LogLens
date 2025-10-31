// src/app.ts
console.log('[LogLens] booting at', new Date().toISOString());

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import Bolt from '@slack/bolt';
import { extractFields, extractUIDs } from './extract.js';
import {
  linkOpenLogs,
  // You asked to keep only Open Logs / Salesforce / BackOffice
  // linkBlastRadius,
  // linkSimilarIncidents,
  // linkRecentChanges,
} from './coralogix.js';

const { App, LogLevel } = Bolt;

/* ------------------------------------------------------------------ *
 * tiny helpers
 * ------------------------------------------------------------------ */
const val = (s?: string | null) => (s || '').trim();
const trimRightSlash = (s: string) => s.replace(/\/+$/, '');
const trimLeftSlash  = (s: string) => s.replace(/^\/+/, '');
function isUrl(u?: string | null): boolean {
  try { if (!u) return false; const url = new URL(u); return url.protocol === 'http:' || url.protocol === 'https:'; }
  catch { return false; }
}
const isHex24 = (s = '') => /^[0-9a-f]{24}$/i.test(s);
const isUuid  = (s = '') => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

function blocksToText(msg: any): string {
  const out: string[] = [];
  const push = (v: any) => {
    if (!v) return;
    if (typeof v === 'string') out.push(v);
    else if (typeof v.text === 'string') out.push(v.text);
    else if (typeof v.text?.text === 'string') out.push(v.text.text);
  };
  const walk = (n: any) => {
    if (!n) return;
    push(n);
    if (Array.isArray(n.elements)) n.elements.forEach(walk);
    if (Array.isArray(n.fields))   n.fields.forEach(walk);
    if (n.accessory)               walk(n.accessory);
  };
  (msg?.blocks || []).forEach(walk);
  const base = (msg?.text || '').trim();
  return [base, out.join('\n')].filter(Boolean).join('\n');
}

function safeButton(text: string, url?: string | null) {
  if (!isUrl(url || '')) return null;
  return { type: 'button' as const, text: { type: 'plain_text' as const, text }, url: url! };
}

/* ------------------------------------------------------------------ *
 * BackOffice URLs
 *  - Deep link only for 24-char ObjectId (UUIDs 404 in Smithy)
 *  - Search supports /app/search or /search automatically
 *  - Home defaults to /applications (working landing)
 * ------------------------------------------------------------------ */
function boSearchUrl(q: string) {
  const base = trimRightSlash(val(process.env.BACKOFFICE_BASE_URL) || 'https://smithy.internal.cyera.io');
  const rawSearchPath = val(process.env.BACKOFFICE_SEARCH_PATH) || '/app/search';
  const p1 = trimLeftSlash(rawSearchPath);
  return `${base}/${p1}?q=${encodeURIComponent(q)}`;
}

function resolveBackOfficeUrls(fields: Record<string, string>, channelMapping?: ChannelMapping) {
  const base = trimRightSlash(val(process.env.BACKOFFICE_BASE_URL) || 'https://smithy.internal.cyera.io');

  // Home (Smithy working home)
  const homePath = trimLeftSlash(val(process.env.BACKOFFICE_HOME_PATH) || '/applications');

  // Search path (primary + automatic fallback)
  const rawSearchPath = val(process.env.BACKOFFICE_SEARCH_PATH) || '/app/search';
  const searchPath1   = trimLeftSlash(rawSearchPath);
  const searchPath2   = searchPath1 === 'app/search' ? 'search' : 'app/search';

  const tenantPrefix  = trimLeftSlash(val(process.env.BACKOFFICE_TENANT_PREFIX)  || '/app/tenants-');
  const accountPrefix = trimLeftSlash(val(process.env.BACKOFFICE_ACCOUNT_PREFIX) || '/app/accounts-');
  const querySuffix   = val(process.env.BACKOFFICE_QUERY_SUFFIX) || '';

  // Priority order: explicit mapping > extracted fields
  const tenantUid  = val(fields.tenant_uid) || channelMapping?.tenant_uid;
  const accountUid = val(fields.account_uid) || channelMapping?.account_uid;
  const tenantName = val(fields.tenant_name) || val(fields.account_name) || channelMapping?.client_name;

  // 1. Use channel mapping direct path (highest priority)
  if (channelMapping?.backoffice_tenant_path) {
    const directPath = `${base}${channelMapping.backoffice_tenant_path}${querySuffix}`;
    console.log('[LogLens] BO direct path from channel mapping:', directPath);
    return { deepTenant: directPath, deepAccount: '', search1: '', search2: '', home: `${base}/${homePath}` };
  }

  // 2. Build URLs from extracted/mapped UIDs
  const deepTenant  = (tenantUid && isHex24(tenantUid))  ? `${base}/${tenantPrefix}${tenantUid}${querySuffix}`   : '';
  const deepAccount = (accountUid && isHex24(accountUid)) ? `${base}/${accountPrefix}${accountUid}${querySuffix}` : '';

  const searchQ = tenantUid || accountUid || tenantName || '';
  const search1 = searchQ ? `${base}/${searchPath1}?q=${encodeURIComponent(searchQ)}` : '';
  const search2 = searchQ ? `${base}/${searchPath2}?q=${encodeURIComponent(searchQ)}` : '';

  const home = `${base}/${homePath}`;

  console.log('[LogLens] BO candidates:', { deepTenant, deepAccount, search1, search2, home, tenantUid, accountUid, tenantName });
  return { deepTenant, deepAccount, search1, search2, home };
}

/* ------------------------------------------------------------------ *
 * Enhanced Salesforce URL Generation
 *  - Prefer specific case ID if found
 *  - Use channel mapping for account ID if available
 *  - Fall back to account/tenant name search
 * ------------------------------------------------------------------ */
function salesforceUrl(fields: Record<string, string>, channelMapping?: ChannelMapping) {
  const baseUrl = val(process.env.SALESFORCE_OPP_URL) ||
    'https://cyera.lightning.force.com/lightning/o/Opportunity/list?filterName=__Recent';

  let origin: string;
  try { origin = new URL(baseUrl).origin; } catch { origin = 'https://cyera.lightning.force.com'; }

  // 1. Specific Case ID (highest priority)
  const caseId = val(fields.case_id);
  if (caseId) {
    return `${origin}/lightning/r/Case/${caseId}/view`;
  }

  // 2. Channel mapping Account ID 
  if (channelMapping?.salesforce_account_id) {
    return `${origin}/lightning/r/Account/${channelMapping.salesforce_account_id}/view`;
  }

  // 3. Incident ID (might be linked to cases)
  const incidentId = val(fields.incident_id);
  if (incidentId) {
    return `${origin}/lightning/_classic/%2F_ui/search/ui/UnifiedSearchResults?searchType=2&str=${encodeURIComponent(incidentId)}`;
  }

  // 4. Account/tenant name search
  const term =
    val(fields.account_name) ||
    val(fields.tenant_name)  ||
    channelMapping?.client_name ||
    val(fields.any_uid) ||
    '';

  if (term) {
    return `${origin}/lightning/_classic/%2F_ui/search/ui/UnifiedSearchResults?searchType=2&str=${encodeURIComponent(term)}`;
  }

  return baseUrl;
}

/* ------------------------------------------------------------------ *
 * Optional: local CSV enrichment for UID extraction
 * ------------------------------------------------------------------ */
type Meta = {
  uid: string;
  account_name?: string;
  tenant_name?: string;
  cloud?: string;
  region?: string;
  platform?: string;
  kind: 'account'|'tenant';
};

const INDEX_PATH = val(process.env.ACCOUNT_INDEX_PATH) || path.join(process.cwd(), 'config', 'accounts.csv');
let INDEX = new Map<string, Meta>();

// Channel mapping for client-specific routing
const CHANNEL_MAPPING_PATH = val(process.env.CHANNEL_MAPPING_PATH) || path.join(process.cwd(), 'config', 'channel-mapping.json');
let CHANNEL_MAPPINGS = new Map<string, any>();

type ChannelMapping = {
  client_name: string;
  tenant_uid?: string;
  account_uid?: string;
  salesforce_account_id?: string;
  backoffice_tenant_path?: string;
  coralogix_team?: string;
};

const splitCSV = (line: string) => line.split(',').map(s => s.trim());

function loadAccountIndex() {
  try {
    if (!fs.existsSync(INDEX_PATH)) {
      console.log('[UID-INDEX] CSV not found, continuing without enrichment:', INDEX_PATH);
      INDEX = new Map();
      return;
    }
    const raw = fs.readFileSync(INDEX_PATH, 'utf8').trim();
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { console.log('[UID-INDEX] CSV empty'); INDEX = new Map(); return; }

    const header = splitCSV(lines[0]).map(h => h.toLowerCase());
    const col = (name: string) => header.indexOf(name);

    const iAccount = col('account_uid');
    const iTenant  = col('tenant_uid');
    const iAccName = col('account_name');
    const iTenName = col('tenant_name');
    const iCloud   = col('cloud');
    const iRegion  = col('region');
    const iPlat    = col('platform');

    const map = new Map<string, Meta>();
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCSV(lines[i]);

      const account_uid = (iAccount >= 0 ? cells[iAccount] : '').trim();
      const tenant_uid  = (iTenant  >= 0 ? cells[iTenant]  : '').trim();
      const accName     = (iAccName >= 0 ? cells[iAccName] : '').trim();
      const tenName     = (iTenName >= 0 ? cells[iTenName] : '').trim();
      const cloud       = (iCloud   >= 0 ? cells[iCloud]    : '').trim();
      const region      = (iRegion  >= 0 ? cells[iRegion]   : '').trim();
      const platform    = (iPlat    >= 0 ? cells[iPlat]     : '').trim();

      if (account_uid) map.set(account_uid, { uid: account_uid, account_name: accName, tenant_name: tenName, cloud, region, platform, kind: 'account' });
      if (tenant_uid)  map.set(tenant_uid,  { uid: tenant_uid,  account_name: accName, tenant_name: tenName, cloud, region, platform, kind: 'tenant' });
    }
    INDEX = map;
    console.log('[UID-INDEX] loaded rows:', INDEX.size, 'from', INDEX_PATH);
  } catch (e) {
    console.error('[UID-INDEX] failed to load:', e);
    INDEX = new Map();
  }
}
const lookup = (uid: string) => INDEX.get(uid);
loadAccountIndex();

function loadChannelMappings() {
  try {
    if (!fs.existsSync(CHANNEL_MAPPING_PATH)) {
      console.log('[CHANNEL-MAP] JSON not found, using defaults:', CHANNEL_MAPPING_PATH);
      CHANNEL_MAPPINGS = new Map();
      return;
    }
    const raw = fs.readFileSync(CHANNEL_MAPPING_PATH, 'utf8');
    const data = JSON.parse(raw);
    const map = new Map<string, ChannelMapping>();
    
    for (const [channelId, mapping] of Object.entries(data.channel_mappings || {})) {
      map.set(channelId, mapping as ChannelMapping);
    }
    
    CHANNEL_MAPPINGS = map;
    console.log('[CHANNEL-MAP] loaded mappings:', CHANNEL_MAPPINGS.size, 'channels');
  } catch (e) {
    console.error('[CHANNEL-MAP] failed to load:', e);
    CHANNEL_MAPPINGS = new Map();
  }
}

const getChannelMapping = (channelId: string): ChannelMapping => {
  return CHANNEL_MAPPINGS.get(channelId) || {
    client_name: 'Unknown Client',
    tenant_uid: undefined,
    account_uid: undefined,
    salesforce_account_id: undefined,
    backoffice_tenant_path: undefined,
    coralogix_team: undefined
  };
};

loadChannelMappings();

/* ------------------------------------------------------------------ *
 * Cleaned up: UID extraction now handled in extract.ts and integrated
 * into the main LogLens analysis card for a unified experience
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Enhanced LogLens card with UID extraction included
 * ------------------------------------------------------------------ */
function buildCard(r: ReturnType<typeof extractFields>, originalText: string = '', channelId?: string) {
  const f: Record<string, string> = r.fields as any;
  const channelMapping = channelId ? getChannelMapping(channelId) : undefined;

  // Extract UIDs from the original text
  const uids = extractUIDs(originalText);
  
  // 1) Open Logs (Coralogix) - Enhanced with channel mapping
  const timeRange = f.severity?.toLowerCase().includes('critical') ? 240 : 120; // 4h for critical, 2h for others
  const openLogsBtn = safeButton(
    `Open Logs (${timeRange/60}h)`, 
    linkOpenLogs(f, timeRange, channelMapping)
  );

  // 2) Salesforce - Direct to case/account or search
  const sfBtn = safeButton('Salesforce', salesforceUrl(f, channelMapping));

  // 3) BackOffice - Direct tenant link or smart fallback  
  const bo = resolveBackOfficeUrls(f, channelMapping);
  const boUrl = bo.deepTenant || bo.deepAccount || bo.search1 || bo.search2 || bo.home;
  const boBtn = safeButton('BackOffice', boUrl);

  const actions = [openLogsBtn, sfBtn, boBtn].filter(Boolean) as any[];

  const blocks: any[] = [
    { type: 'header', text: { type: 'plain_text', text: `LogLens – ${channelMapping?.client_name || 'Alert Analysis'}` } },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `*Alert Type:* ${r.family}  •  *Fields Found:* ${Object.keys(f).length}\n` +
          `${Object.entries(f).map(([k, v]) => {
            // Highlight specific IDs that enable direct linking
            const isSpecialId = ['case_id', 'incident_id', 'alert_id', 'tenant_uid', 'account_uid'].includes(k);
            return isSpecialId ? `*\`${k}=${v}\`*` : `\`${k}=${v}\``;
          }).join('  ') || '_none_'}\n` +
          `*Context:* ${channelMapping ? `🎯 ${channelMapping.client_name}` : '🔍 General'} • *Source:* \`${r.defaults.source}\``,
      },
    },
  ];

  // Add UID section if UIDs were found
  if (uids.length > 0) {
    const uidLines: string[] = [];
    uids.slice(0, 5).forEach((u, i) => {
      const meta = lookup(u);
      const kind = isHex24(u) ? 'ObjectId' : (isUuid(u) ? 'UUID' : 'id');
      const parts = [`\`${u}\``];
      if (meta?.tenant_name)  parts.push(`*${meta.tenant_name}*`);
      if (meta?.account_name && meta.account_name !== meta.tenant_name) parts.push(`(${meta.account_name})`);
      if (meta?.cloud)        parts.push(`${meta.cloud}`);
      if (meta?.region)       parts.push(`${meta.region}`);
      uidLines.push(`${i + 1}. ${parts.join(' • ')}`);
    });

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🔍 Extracted ${uids.length} UID${uids.length > 1 ? 's' : ''}:*\n${uidLines.join('\n')}${uids.length > 5 ? `\n_...and ${uids.length - 5} more_` : ''}`
      }
    });

    // Add UID copy section for easy copying
    if (uids.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Copy UIDs:*\n\`\`\`${uids.slice(0, 10).join('\n')}\`\`\``
        }
      });
    }
  }

  if (actions.length > 0) blocks.push({ type: 'actions', elements: actions });
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: 'Ephemeral • Enriched with local account data • No channel noise' }] });
  return blocks;
}

/* ------------------------------------------------------------------ *
 * Bolt app
 * ------------------------------------------------------------------ */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  logLevel: LogLevel.INFO,
});

console.log(
  '[LogLens] env ok ',
  'bot=',  (process.env.SLACK_BOT_TOKEN      || '').slice(0, 10) + '…',
  ' app=', (process.env.SLACK_APP_TOKEN      || '').slice(0, 10) + '…',
  ' sign=',(process.env.SLACK_SIGNING_SECRET || '').slice(0, 6)  + '…'
);

/* -------------------- Removed: Extract UIDs shortcut -------------------- *
 * UID extraction is now built into the main "Analyze with LogLens" shortcut
 * This provides a cleaner, unified experience
 */

/* -------------------- Slash: /log <query|ping> -------------------- */
app.command('/log', async ({ command, ack, client }) => {
  await ack();
  const q = (command.text || '').trim();

  if (q.toLowerCase() === 'ping') {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `LogLens is alive here. You typed: ${q}`,
    });
    return;
  }

  const fake = `Tenant Name\n${q}`;
  const r = extractFields(fake);
  const blocks = buildCard(r, fake, command.channel_id);

  try {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'LogLens results',
      blocks,
    });
  } catch (e: any) {
    console.error('[LogLens] postEphemeral failed:', e.data || e);
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'LogLens could not render the card.',
    });
  }
});

/* -------------------- Message shortcut: Analyze -------------------- */
app.shortcut('loglens_analyze', async ({ shortcut, ack, client }) => {
  await ack();
  // @ts-ignore
  const text: string = blocksToText(shortcut.message || {});
  const r = extractFields(text);
  const channelId = (shortcut as any).channel?.id || (shortcut as any).channel?.name;
  const blocks = buildCard(r, text, channelId);

  try {
    await client.chat.postEphemeral({
      channel: (shortcut as any).channel.id || (shortcut as any).channel.name,
      user: (shortcut as any).user.id,
      text: 'LogLens results',
      blocks,
    });
  } catch (e: any) {
    console.error('[LogLens] postEphemeral failed:', e.data || e);
    await client.chat.postEphemeral({
      channel: (shortcut as any).channel.id || (shortcut as any).channel.name,
      user: (shortcut as any).user.id,
      text: 'LogLens could not render the card.',
    });
  }
});

(async () => {
  await app.start();
  console.log('✅ Socket Mode started. Waiting for Slack events…');
})();
