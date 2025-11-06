// src/trace.ts
// Distributed tracing and alert origin tracking

/**
 * Generate trace URLs based on available tracing systems and extracted fields
 */
export function traceUrl(
  fields: Record<string, string>,
  channelMapping?: { 
    client_name?: string;
    trace_system?: string;
    datadog_org?: string;
    grafana_org?: string;
  }
): string {
  // Primary tracing systems (in priority order)
  
  // 1. Coralogix trace correlation (if correlation ID exists)
  if (fields.correlation_id || fields.transaction_id) {
    return coralogixTraceUrl(fields);
  }

  // 2. Datadog APM traces (if configured)
  if (channelMapping?.datadog_org || process.env.DATADOG_BASE_URL) {
    return datadogTraceUrl(fields, channelMapping);
  }

  // 3. Grafana/Prometheus timeline view
  if (process.env.GRAFANA_BASE_URL) {
    return grafanaTimelineUrl(fields);
  }

  // 4. Custom trace system (if alert_source detected)
  if (fields.alert_source) {
    return customTraceUrl(fields);
  }

  // 5. Multi-system correlation search
  return correlationSearchUrl(fields, channelMapping);
}

/**
 * Coralogix trace correlation - find related logs by correlation ID
 */
function coralogixTraceUrl(fields: Record<string, string>): string {
  const baseUrl = process.env.CORALOGIX_BASE_URL || 'https://app.coralogix.com';
  
  const traceId = fields.correlation_id || fields.transaction_id || fields.job_id;
  if (!traceId) return `${baseUrl}/#/logs`;

  // Extended time window for trace correlation (6h vs 2h for regular logs)
  const now = new Date();
  const startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  
  const query = `correlation_id:"${traceId}" OR transaction_id:"${traceId}" OR trace_id:"${traceId}"`;
  
  const params = new URLSearchParams({
    query: query,
    from: startTime.toISOString(),
    to: now.toISOString(),
    view: 'logs'
  });

  console.log('[LogLens] Coralogix trace query:', { traceId, query });
  return `${baseUrl}/#/logs?${params.toString()}`;
}

/**
 * Datadog APM trace lookup
 */
function datadogTraceUrl(
  fields: Record<string, string>, 
  channelMapping?: { datadog_org?: string }
): string {
  const baseUrl = process.env.DATADOG_BASE_URL || 'https://app.datadoghq.com';
  const org = channelMapping?.datadog_org || process.env.DATADOG_ORG || '';
  
  const traceId = fields.correlation_id || fields.transaction_id;
  if (traceId && org) {
    return `${baseUrl}/apm/trace/${traceId}?env=production&org=${org}`;
  }

  // Fallback to APM service map or logs correlation
  const service = fields.service_name || fields.alert_source || 'unknown';
  return `${baseUrl}/apm/services/${service}?env=production`;
}

/**
 * Grafana timeline view for infrastructure correlation
 */
function grafanaTimelineUrl(fields: Record<string, string>): string {
  const baseUrl = process.env.GRAFANA_BASE_URL || 'https://grafana.internal.cyera.io';
  
  // 2-hour window around the alert time
  const now = Date.now();
  const from = now - (2 * 60 * 60 * 1000);
  const to = now + (30 * 60 * 1000); // Include 30min future for correlation
  
  // Build query for relevant infrastructure
  const service = fields.service_name || fields.tenant_name || 'all';
  
  const params = new URLSearchParams({
    'var-service': service,
    from: from.toString(),
    to: to.toString(),
    refresh: '30s'
  });

  console.log('[LogLens] Grafana timeline for service:', service);
  return `${baseUrl}/d/alert-correlation?${params.toString()}`;
}

/**
 * Custom trace system routing based on alert source
 */
function customTraceUrl(fields: Record<string, string>): string {
  const source = fields.alert_source?.toLowerCase();
  
  switch (source) {
    case 'backoffice':
    case 'bo':
      return backOfficeTraceUrl(fields);
      
    case 'apoyo':
      return apoyoTraceUrl(fields);
      
    case 'tines':
      return tinesTraceUrl(fields);
      
    case 'coralogix':
      return coralogixTraceUrl(fields);
      
    default:
      return genericSystemTrace(fields);
  }
}

/**
 * BackOffice system trace
 */
function backOfficeTraceUrl(fields: Record<string, string>): string {
  const baseUrl = process.env.BACKOFFICE_BASE_URL || 'https://smithy.internal.cyera.io';
  
  const tenantUid = fields.tenant_uid || fields.account_uid;
  if (tenantUid) {
    return `${baseUrl}/app/audit-log?tenant=${tenantUid}&hours=6`;
  }
  
  return `${baseUrl}/app/system-events?source=alerts`;
}

/**
 * ApoYo system trace (customize based on your ApoYo setup)
 */
function apoyoTraceUrl(fields: Record<string, string>): string {
  const baseUrl = process.env.APOYO_BASE_URL || 'https://apoyo.internal.cyera.io';
  
  const jobId = fields.job_id || fields.correlation_id;
  if (jobId) {
    return `${baseUrl}/jobs/${jobId}/timeline`;
  }
  
  return `${baseUrl}/system/events?type=alert`;
}

/**
 * Tines workflow trace
 */
function tinesTraceUrl(fields: Record<string, string>): string {
  const baseUrl = process.env.TINES_BASE_URL || 'https://tines.internal.cyera.io';
  
  const workflowId = fields.job_id || fields.workflow_id;
  if (workflowId) {
    return `${baseUrl}/stories/${workflowId}/runs`;
  }
  
  return `${baseUrl}/stories?q=alert`;
}

/**
 * Generic multi-system correlation search
 */
function correlationSearchUrl(
  fields: Record<string, string>,
  channelMapping?: { client_name?: string }
): string {
  // If you have a central correlation system, route there
  const correlationBase = process.env.CORRELATION_BASE_URL;
  if (correlationBase) {
    const tenantUid = fields.tenant_uid || fields.account_uid;
    const client = channelMapping?.client_name || 'unknown';
    
    return `${correlationBase}/search?tenant=${tenantUid}&client=${encodeURIComponent(client)}&hours=6`;
  }
  
  // Fallback: Enhanced Coralogix search with broader correlation
  return enhancedCoralogixTrace(fields, channelMapping);
}

/**
 * Enhanced Coralogix correlation search
 */
function enhancedCoralogixTrace(
  fields: Record<string, string>,
  channelMapping?: { client_name?: string }
): string {
  const baseUrl = process.env.CORALOGIX_BASE_URL || 'https://app.coralogix.com';
  
  // Build comprehensive trace query
  const filters: string[] = [];
  
  if (fields.tenant_uid) filters.push(`tenant_uid:"${fields.tenant_uid}"`);
  if (fields.service_name) filters.push(`service:"${fields.service_name}"`);
  if (fields.error_type) filters.push(`error:"${fields.error_type}"`);
  if (channelMapping?.client_name) filters.push(`client:"${channelMapping.client_name}"`);
  
  // Add timeline context
  filters.push('(level:ERROR OR level:WARN OR level:FATAL)');
  
  const query = filters.length > 0 ? filters.join(' AND ') : '*';
  
  // Extended 6-hour window for correlation
  const now = new Date();
  const startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  
  const params = new URLSearchParams({
    query: query,
    from: startTime.toISOString(),
    to: now.toISOString(),
    view: 'logs'
  });

  console.log('[LogLens] Enhanced correlation trace:', { query, filters: filters.length });
  return `${baseUrl}/#/logs?${params.toString()}`;
}

/**
 * Generic system trace fallback
 */
function genericSystemTrace(fields: Record<string, string>): string {
  // Route to the most comprehensive system available
  if (process.env.CORALOGIX_BASE_URL) {
    return enhancedCoralogixTrace(fields);
  }
  
  if (process.env.GRAFANA_BASE_URL) {
    return grafanaTimelineUrl(fields);
  }
  
  // Ultimate fallback - enhanced log search
  return coralogixTraceUrl(fields);
}

/**
 * Get trace button text based on what we can trace
 */
export function traceButtonText(fields: Record<string, string>): string {
  if (fields.correlation_id || fields.transaction_id) {
    return 'Trace Flow';
  }
  
  if (fields.alert_source) {
    return `Trace ${fields.alert_source}`;
  }
  
  if (fields.job_id) {
    return 'Trace Job';
  }
  
  return 'Trace Origin';
}

/**
 * Get detailed trace analysis for debugging and transparency
 */
export function getTraceAnalysis(
  fields: Record<string, string>,
  channelMapping?: { trace_system?: string; client_name?: string }
): {
  detection: string;
  routing: string;
  confidence: 'high' | 'medium' | 'low';
  available_fields: string[];
  recommended_action: string;
} {
  const availableFields = Object.keys(fields).filter(k => fields[k]);

  // High confidence - direct correlation
  if (fields.correlation_id || fields.transaction_id) {
    return {
      detection: `Found correlation ID: ${fields.correlation_id || fields.transaction_id}`,
      routing: 'Coralogix 6-hour correlation timeline',
      confidence: 'high',
      available_fields: availableFields,
      recommended_action: 'Opens detailed trace correlation in Coralogix with extended timeline'
    };
  }

  // High confidence - specific system
  if (fields.alert_source) {
    const source = fields.alert_source.toLowerCase();
    let routingSystem = source.charAt(0).toUpperCase() + source.slice(1);
    let action = `Opens ${source} specific tracing interface`;

    if (source === 'apoyo' || source === 'apo-yo') {
      routingSystem = fields.service_name === 'inventory' ? 'ApoYo Inventory Scan' : 'ApoYo System';
      action = fields.service_name === 'inventory' ? 'Opens ApoYo inventory scan status dashboard' : 'Opens ApoYo job execution timeline';
    } else if (source === 'licensing center' || source === 'licensing-center') {
      routingSystem = 'Licensing Center';
      action = 'Opens license utilization dashboard';
    }

    return {
      detection: `Detected alert source: ${fields.alert_source}`,
      routing: routingSystem,
      confidence: 'high',
      available_fields: availableFields,
      recommended_action: action
    };
  }

  // Medium confidence - job/workflow tracking
  if (fields.job_id) {
    return {
      detection: `Found job ID: ${fields.job_id}`,
      routing: 'Multi-system job tracking',
      confidence: 'medium',
      available_fields: availableFields,
      recommended_action: 'Searches across systems for job execution timeline'
    };
  }

  // Low confidence - general correlation
  return {
    detection: `No specific trace identifiers found`,
    routing: 'Enhanced Coralogix correlation search',
    confidence: 'low',
    available_fields: availableFields,
    recommended_action: 'Opens broad correlation search based on tenant/service context'
  };
}
