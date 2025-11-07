// src/redash.ts
// Redash integration for data queries and dashboard linking

interface RedashQuery {
  id: number;
  name: string;
  description?: string;
  query: string;
  data_source_id: number;
  latest_query_data_id?: number;
  visualizations?: RedashVisualization[];
}

interface RedashVisualization {
  id: number;
  type: string;
  name: string;
  options: any;
}

interface RedashQueryResult {
  query_result: {
    id: number;
    data: {
      columns: Array<{name: string; type: string}>;
      rows: any[][];
    };
    retrieved_at: string;
  };
}

/**
 * Execute a Redash query and return results
 */
export async function executeRedashQuery(
  queryId: number,
  parameters?: Record<string, any>
): Promise<RedashQueryResult | null> {
  const baseUrl = process.env.REDASH_BASE_URL || 'https://redash.internal.cyera.io';
  const apiKey = process.env.REDASH_API_KEY;

  if (!apiKey) {
    console.error('[LogLens] Redash API key not configured');
    return null;
  }

  try {
    // First, get the query to check if it needs parameters
    const queryResponse = await fetch(`${baseUrl}/api/queries/${queryId}`, {
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!queryResponse.ok) {
      console.error(`[LogLens] Failed to fetch Redash query ${queryId}: ${queryResponse.status}`);
      return null;
    }

    const query: RedashQuery = await queryResponse.json();
    console.log(`[LogLens] Executing Redash query: ${query.name}`);

    // Execute the query with parameters if provided
    const executeUrl = `${baseUrl}/api/queries/${queryId}/results`;
    const executeOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (parameters) {
      executeOptions.body = JSON.stringify({ parameters });
    }

    const resultResponse = await fetch(executeUrl, executeOptions);

    if (!resultResponse.ok) {
      console.error(`[LogLens] Failed to execute Redash query ${queryId}: ${resultResponse.status}`);
      return null;
    }

    const result: RedashQueryResult = await resultResponse.json();
    console.log(`[LogLens] Redash query executed successfully: ${result.query_result.data.rows.length} rows`);
    
    return result;

  } catch (error) {
    console.error(`[LogLens] Error executing Redash query ${queryId}:`, error);
    return null;
  }
}

/**
 * Get Redash dashboard URL with filters
 */
export function getRedashDashboardUrl(
  dashboardId: number,
  filters?: Record<string, string>
): string {
  const baseUrl = process.env.REDASH_BASE_URL || 'https://redash.internal.cyera.io';
  let url = `${baseUrl}/dashboard/${dashboardId}`;

  if (filters && Object.keys(filters).length > 0) {
    const filterParams = Object.entries(filters)
      .map(([key, value]) => `p_${key}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${filterParams}`;
  }

  return url;
}

/**
 * Get Redash query URL with parameters
 */
export function getRedashQueryUrl(
  queryId: number,
  parameters?: Record<string, string>
): string {
  const baseUrl = process.env.REDASH_BASE_URL || 'https://redash.internal.cyera.io';
  let url = `${baseUrl}/queries/${queryId}`;

  if (parameters && Object.keys(parameters).length > 0) {
    const paramString = Object.entries(parameters)
      .map(([key, value]) => `p_${key}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${paramString}`;
  }

  return url;
}

/**
 * Format Redash query results for LogLens display
 */
export function formatRedashResults(
  result: RedashQueryResult,
  maxRows: number = 5
): string {
  const { columns, rows } = result.query_result.data;
  
  if (rows.length === 0) {
    return '📊 **Redash Query**: No results found';
  }

  const displayRows = rows.slice(0, maxRows);
  const headers = columns.map(col => col.name);
  
  // Create a simple table format
  let output = `📊 **Redash Results** (${rows.length} total):\n`;
  
  displayRows.forEach((row, index) => {
    const rowData = headers.map((header, colIndex) => {
      const value = row[colIndex];
      return `**${header}**: ${value}`;
    }).join(' • ');
    
    output += `${index + 1}. ${rowData}\n`;
  });

  if (rows.length > maxRows) {
    output += `_...and ${rows.length - maxRows} more rows_`;
  }

  return output;
}

/**
 * Get tenant-specific Redash queries based on extracted fields
 */
export function getTenantRedashQueries(
  fields: Record<string, string>,
  channelMapping?: {
    redash_tenant_dashboard?: number;
    redash_license_query?: number;
    redash_usage_query?: number;
  }
): {
  dashboardUrl?: string;
  licenseQueryUrl?: string;
  usageQueryUrl?: string;
} {
  const tenantUid = fields.tenant_uid || fields.account_uid;
  const tenantName = fields.tenant_name || fields.account_name;
  
  const result: any = {};

  // Tenant dashboard with filters
  if (channelMapping?.redash_tenant_dashboard) {
    const filters: Record<string, string> = {};
    if (tenantUid) filters.tenant_uid = tenantUid;
    if (tenantName) filters.tenant_name = tenantName;
    
    result.dashboardUrl = getRedashDashboardUrl(
      channelMapping.redash_tenant_dashboard,
      filters
    );
  }

  // License utilization query
  if (channelMapping?.redash_license_query) {
    const params: Record<string, string> = {};
    if (tenantUid) params.tenant_uid = tenantUid;
    
    result.licenseQueryUrl = getRedashQueryUrl(
      channelMapping.redash_license_query,
      params
    );
  }

  // Usage analytics query
  if (channelMapping?.redash_usage_query) {
    const params: Record<string, string> = {};
    if (tenantUid) params.tenant_uid = tenantUid;
    if (fields.service_name) params.service = fields.service_name;
    
    result.usageQueryUrl = getRedashQueryUrl(
      channelMapping.redash_usage_query,
      params
    );
  }

  return result;
}

/**
 * Execute multiple Redash queries in parallel for enrichment
 */
export async function getRedashEnrichmentData(
  fields: Record<string, string>,
  channelMapping?: {
    redash_license_query?: number;
    redash_usage_query?: number;
    redash_alerts_query?: number;
  }
): Promise<{
  licenseData?: any[];
  usageData?: any[];
  alertsData?: any[];
}> {
  const promises: Promise<any>[] = [];
  const tenantUid = fields.tenant_uid || fields.account_uid;
  
  if (!tenantUid) {
    console.log('[LogLens] No tenant UID available for Redash enrichment');
    return {};
  }

  const parameters = { tenant_uid: tenantUid };

  // License query
  if (channelMapping?.redash_license_query) {
    promises.push(
      executeRedashQuery(channelMapping.redash_license_query, parameters)
        .then(result => ({ type: 'license', data: result?.query_result.data.rows }))
    );
  }

  // Usage query
  if (channelMapping?.redash_usage_query) {
    promises.push(
      executeRedashQuery(channelMapping.redash_usage_query, parameters)
        .then(result => ({ type: 'usage', data: result?.query_result.data.rows }))
    );
  }

  // Alerts query
  if (channelMapping?.redash_alerts_query) {
    promises.push(
      executeRedashQuery(channelMapping.redash_alerts_query, parameters)
        .then(result => ({ type: 'alerts', data: result?.query_result.data.rows }))
    );
  }

  try {
    const results = await Promise.allSettled(promises);
    const enrichmentData: any = {};

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { type, data } = result.value;
        enrichmentData[`${type}Data`] = data;
      }
    });

    console.log('[LogLens] Redash enrichment complete:', Object.keys(enrichmentData));
    return enrichmentData;

  } catch (error) {
    console.error('[LogLens] Error in Redash enrichment:', error);
    return {};
  }
}
