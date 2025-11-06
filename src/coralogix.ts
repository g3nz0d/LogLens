// src/coralogix.ts
// Coralogix integration for log linking and analysis

/**
 * Generate a Coralogix logs URL with enhanced, specific filters
 */
export function linkOpenLogs(
  fields: Record<string, string>, 
  timeRangeMinutes = 120,
  channelMapping?: { coralogix_team?: string; client_name?: string }
): string {
  // Use Cyera-specific Coralogix instance
  const baseUrl = process.env.CORALOGIX_BASE_URL || 'https://cyeraio.coralogix.com';
  
  // Build query filters with priority order
  const filters: string[] = [];
  
  // 1. Specific alert/incident IDs (highest priority)
  if (fields.alert_id) {
    filters.push(`alert_id:"${fields.alert_id}"`);
  }
  if (fields.incident_id) {
    filters.push(`incident_id:"${fields.incident_id}"`);
  }
  
  // 2. Service-specific filters
  if (fields.service_name) {
    filters.push(`service:"${fields.service_name}"`);
  }
  if (fields.error_type) {
    filters.push(`error:"${fields.error_type}"`);
  }
  
  // 3. Tenant/account filters
  if (fields.tenant_uid) {
    filters.push(`tenant_uid:"${fields.tenant_uid}"`);
  } else if (fields.account_uid) {
    filters.push(`account_uid:"${fields.account_uid}"`);
  }
  
  // 4. Use channel mapping for team-specific filtering
  if (channelMapping?.coralogix_team) {
    filters.push(`team:"${channelMapping.coralogix_team}"`);
  }
  
  // 5. Name-based filters
  if (fields.tenant_name) {
    filters.push(`tenant_name:"${fields.tenant_name}"`);
  } else if (fields.account_name) {
    filters.push(`account_name:"${fields.account_name}"`);
  } else if (channelMapping?.client_name) {
    filters.push(`client:"${channelMapping.client_name}"`);
  }
  
  // 6. Environment and region context
  if (fields.environment) {
    filters.push(`environment:"${fields.environment}"`);
  }
  if (fields.region) {
    filters.push(`region:"${fields.region}"`);
  }
  if (fields.cloud) {
    filters.push(`cloud:"${fields.cloud}"`);
  }
  
  // 7. Specific log query if extracted from alert
  if (fields.log_query) {
    filters.push(`message:"${fields.log_query}"`);
  }
  
  // 8. Fallback to any UID
  if (filters.length === 0 && fields.any_uid) {
    filters.push(`"${fields.any_uid}"`);
  }
  
  // 9. Severity-based filtering  
  if (fields.severity) {
    filters.push(`severity:"${fields.severity}"`);
  }
  
  // Construct the query (limit to most specific filters for performance)
  const query = filters.length > 0 ? filters.slice(0, 5).join(' AND ') : '*';
  
  // Calculate time range - extend for critical alerts
  const isCritical = fields.severity?.toLowerCase().includes('critical') || 
                     fields.severity?.toLowerCase().includes('fatal');
  const actualTimeRange = isCritical ? timeRangeMinutes * 2 : timeRangeMinutes;
  
  const now = new Date();
  const startTime = new Date(now.getTime() - actualTimeRange * 60 * 1000);
  
  // Format timestamps for Coralogix (ISO format)
  const from = startTime.toISOString();
  const to = now.toISOString();
  
  // Build the Coralogix URL with enhanced parameters
  const params = new URLSearchParams({
    query: query,
    from: from,
    to: to,
    view: 'logs',
    // Add severity filter in UI if available
    ...(fields.severity && { severityFilter: fields.severity })
  });
  
  console.log('[LogLens] Coralogix query:', { query, timeRange: actualTimeRange, filters: filters.length });
  
  return `${baseUrl}/#/logs?${params.toString()}`;
}

/**
 * Generate a Coralogix dashboard URL for metrics related to the fields
 */
export function linkMetricsDashboard(fields: Record<string, string>): string {
  const baseUrl = process.env.CORALOGIX_BASE_URL || 'https://app.coralogix.com';
  
  // For now, just link to the main dashboards page
  // This could be enhanced to link to specific dashboards based on tenant/account
  return `${baseUrl}/#/dashboards`;
}

/**
 * Generate a Coralogix alerts URL
 */
export function linkAlerts(fields: Record<string, string>): string {
  const baseUrl = process.env.CORALOGIX_BASE_URL || 'https://app.coralogix.com';
  
  return `${baseUrl}/#/alerts`;
}

/**
 * Parse log severity from Coralogix format
 */
export function parseSeverity(severity?: string): { level: string; emoji: string } {
  if (!severity) return { level: 'Unknown', emoji: '❓' };
  
  const severityLower = severity.toLowerCase();
  
  if (severityLower.includes('critical') || severityLower.includes('fatal')) {
    return { level: 'Critical', emoji: '🔴' };
  } else if (severityLower.includes('error')) {
    return { level: 'Error', emoji: '🟠' };
  } else if (severityLower.includes('warn')) {
    return { level: 'Warning', emoji: '🟡' };
  } else if (severityLower.includes('info')) {
    return { level: 'Info', emoji: '🔵' };
  } else if (severityLower.includes('debug')) {
    return { level: 'Debug', emoji: '⚪' };
  }
  
  return { level: severity, emoji: '❓' };
}

/**
 * Format log timestamp for display
 */
export function formatLogTimestamp(timestamp?: string): string {
  if (!timestamp) return 'Unknown time';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    return timestamp;
  }
}
