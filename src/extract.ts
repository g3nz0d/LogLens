// src/extract.ts
// Field extraction from alert messages

interface ExtractedResult {
  family: string;
  fields: Record<string, string>;
  defaults: {
    source: string;
    event_type: string;
  };
}

/**
 * Extract structured fields from alert text
 * This function parses common alert formats and extracts key identifiers
 */
export function extractFields(text: string): ExtractedResult {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const fields: Record<string, string> = {};
  let family = 'unknown';
  
  // Enhanced patterns to extract from various alert formats
  const patterns: Record<string, RegExp[]> = {
    tenant_uid: [
      /(?:tenant[_\s]*uid|tenant[_\s]*id)[:\s]*([a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      /tenant[_\s]*=\s*([a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      /"tenant"[:\s]*"([a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"/i
    ],
    account_uid: [
      /(?:account[_\s]*uid|account[_\s]*id)[:\s]*([a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      /account[_\s]*=\s*([a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      /"account"[:\s]*"([a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"/i
    ],
    tenant_name: [
      /(?:tenant[_\s]*name|client)[:\s]*([^\n\r,;"\}]+)/i,
      /tenant[_\s]*=\s*"?([^"\n\r,;]+)"?/i,
      /"tenant_name"[:\s]*"([^"]+)"/i,
      /\btenant:\s*([^\n\r,;]+)/i
    ],
    account_name: [
      /(?:account[_\s]*name|customer)[:\s]*([^\n\r,;"\}]+)/i,
      /account[_\s]*=\s*"?([^"\n\r,;]+)"?/i,
      /"account_name"[:\s]*"([^"]+)"/i,
      /\baccount:\s*([^\n\r,;]+)/i
    ],
    source: [
      /(?:source|from)[:\s]*([^\n\r,;]+)/i,
      /"source"[:\s]*"([^"]+)"/i
    ],
    event_type: [
      /(?:event[_\s]*type|type)[:\s]*([^\n\r,;]+)/i,
      /"event_type"[:\s]*"([^"]+)"/i,
      /alert[_\s]*type[:\s]*([^\n\r,;]+)/i
    ],
    severity: [
      /(?:severity|level|priority)[:\s]*([^\n\r,;]+)/i,
      /"severity"[:\s]*"([^"]+)"/i
    ],
    timestamp: [
      /(?:timestamp|time|occurred)[:\s]*([^\n\r,;]+)/i,
      /"timestamp"[:\s]*"([^"]+)"/i
    ],
    region: [
      /(?:region|location)[:\s]*([^\n\r,;]+)/i,
      /"region"[:\s]*"([^"]+)"/i,
      /(?:aws|azure|gcp)[_\s]*region[:\s]*([^\n\r,;]+)/i
    ],
    environment: [
      /(?:environment|env)[:\s]*([^\n\r,;]+)/i,
      /"environment"[:\s]*"([^"]+)"/i,
      /\benv[:\s]*([^\n\r,;]+)/i
    ],
    cloud: [
      /(?:cloud|provider)[:\s]*([^\n\r,;]+)/i,  
      /"cloud"[:\s]*"([^"]+)"/i,
      /\b(aws|azure|gcp|google cloud)\b/i
    ],
    platform: [
      /platform[:\s]*([^\n\r,;]+)/i,
      /"platform"[:\s]*"([^"]+)"/i
    ],
    // Specific service identifiers
    case_id: [
      /(?:case[_\s]*id|salesforce[_\s]*case)[:\s]*([0-9]{15,18}|500[0-9A-Za-z]{15})/i,
      /"case_id"[:\s]*"([^"]+)"/i,
      /\bcase[:\s]*([0-9]{15,18})/i
    ],
    incident_id: [
      /(?:incident[_\s]*id|incident)[:\s]*([A-Z0-9\-]+)/i,
      /"incident_id"[:\s]*"([^"]+)"/i,
      /incident[_\s]*=\s*([A-Z0-9\-]+)/i
    ],
    alert_id: [
      /(?:alert[_\s]*id|alert_uid)[:\s]*([A-Za-z0-9\-_]+)/i,
      /"alert_id"[:\s]*"([^"]+)"/i,
      /alert[_\s]*=\s*([A-Za-z0-9\-_]+)/i
    ],
    log_query: [
      /(?:query|search)[:\s]*"([^"]+)"/i,
      /(?:filter|where)[:\s]*([^\n\r,;]+)/i,
      /message[:\s]*"([^"]+)"/i
    ],
    service_name: [
      /(?:service|application)[:\s]*([^\n\r,;"\}]+)/i,
      /"service"[:\s]*"([^"]+)"/i,
      /app[_\s]*name[:\s]*([^\n\r,;]+)/i
    ],
    error_type: [
      /(?:error[_\s]*type|exception)[:\s]*([^\n\r,;]+)/i,
      /"error"[:\s]*"([^"]+)"/i,
      /exception[:\s]*([^\n\r,;]+)/i
    ],
    // Zendesk-specific fields
    ticket_id: [
      /(?:ticket[_\s]*id|zendesk[_\s]*ticket)[:\s]*([0-9]+)/i,
      /"ticket_id"[:\s]*"([^"]+)"/i,
      /ticket[_\s]*#([0-9]+)/i,
      /\#([0-9]{6,})/i
    ],
    requester_email: [
      /(?:requester|from|email)[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /"email"[:\s]*"([^"]+)"/i,
      /reported[_\s]*by[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
    ],
    requester_name: [
      /(?:requester[_\s]*name|reported[_\s]*by|from)[:\s]*([^\n\r,;@]+)(?:\s*<|$)/i,
      /"requester"[:\s]*"([^"]+)"/i,
      /user[:\s]*([^\n\r,;@]+)/i
    ],
    organization: [
      /(?:organization|org|company)[:\s]*([^\n\r,;]+)/i,
      /"organization"[:\s]*"([^"]+)"/i,
      /\bcompany[:\s]*([^\n\r,;]+)/i
    ]
  };

  // Extract fields using patterns (try multiple patterns per field)
  for (const [key, patternArray] of Object.entries(patterns)) {
    for (const pattern of patternArray) {
      const match = text.match(pattern);
      if (match && match[1]) {
        fields[key] = match[1].trim();
        break; // Stop after first match for this field
      }
    }
  }

  // Try to extract any UIDs that might not have labels
  const uidMatches = text.match(/\b[a-f0-9]{24}\b/gi) || [];
  const uuidMatches = text.match(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi) || [];
  
  // If we found UIDs but no labeled ones, assign the first ones
  if (uidMatches.length > 0 && !fields.tenant_uid && !fields.account_uid && uidMatches[0]) {
    fields.any_uid = uidMatches[0];
  }
  if (uuidMatches.length > 0 && !fields.tenant_uid && !fields.account_uid && !fields.any_uid && uuidMatches[0]) {
    fields.any_uid = uuidMatches[0];
  }

  // Determine alert family based on content
  const textLower = text.toLowerCase();
  if (textLower.includes('coralogix') || textLower.includes('log')) {
    family = 'coralogix-alert';
  } else if (textLower.includes('datadog') || textLower.includes('monitor')) {
    family = 'datadog-alert';
  } else if (textLower.includes('pagerduty') || textLower.includes('incident')) {
    family = 'pagerduty-alert';
  } else if (textLower.includes('prometheus') || textLower.includes('grafana')) {
    family = 'prometheus-alert';
  } else if (Object.keys(fields).length > 0) {
    family = 'structured-alert';
  } else {
    family = 'generic-message';
  }

  // Set defaults
  const defaults = {
    source: (fields.source as string) || 'unknown',
    event_type: (fields.event_type as string) || 'alert'
  };

  return {
    family,
    fields,
    defaults
  };
}

/**
 * Extract all UIDs from text (both ObjectIds and UUIDs)
 */
export function extractUIDs(text: string): string[] {
  const found = new Set<string>();
  
  // Extract 24-character hex ObjectIds
  const objectIds = text.match(/\b[a-f0-9]{24}\b/gi) || [];
  objectIds.forEach(id => found.add(id));
  
  // Extract UUIDs
  const uuids = text.match(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi) || [];
  uuids.forEach(uuid => found.add(uuid));
  
  return Array.from(found);
}
