// src/licensing.ts
// Always-on licensing status integration

interface LicenseStatus {
  tenant_name: string;
  saas: {
    licenses_used: number;
    licenses_total: number;
    utilization_percent: number;
    status: 'healthy' | 'warning' | 'critical';
    days_to_renewal?: number;
  };
  iaas: {
    licenses_used: number;
    licenses_total: number;
    utilization_percent: number;
    status: 'healthy' | 'warning' | 'critical';
    days_to_renewal?: number;
  };
  overall_status: 'healthy' | 'warning' | 'critical';
}

/**
 * Fetch license status for any tenant/account UID
 */
export async function getLicenseStatus(
  tenantUid?: string,
  accountUid?: string,
  tenantName?: string
): Promise<LicenseStatus | null> {
  const baseUrl = process.env.LICENSING_API_BASE_URL || 'https://licensing-api.internal.cyera.io';
  
  // Try different lookup methods in priority order
  const lookupId = tenantUid || accountUid || tenantName;
  if (!lookupId) return null;

  try {
    let endpoint: string;
    
    // Primary lookup by tenant UID (most accurate)
    if (tenantUid) {
      endpoint = `${baseUrl}/api/v1/license-status/tenant/${tenantUid}/all-types`;
    }
    // Secondary lookup by account UID  
    else if (accountUid) {
      endpoint = `${baseUrl}/api/v1/license-status/account/${accountUid}/all-types`;
    }
    // Fallback lookup by name
    else {
      endpoint = `${baseUrl}/api/v1/license-status/search?name=${encodeURIComponent(tenantName!)}&include_all_types=true`;
    }

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${process.env.LICENSING_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`[LogLens] License API returned ${response.status} for ${lookupId}`);
      return null;
    }

    const data = await response.json();
    
    // Calculate status for each license type
    const saasStatus = calculateLicenseStatus(data.saas?.utilization_percent || 0);
    const iaasStatus = calculateLicenseStatus(data.iaas?.utilization_percent || 0);
    
    // Overall status is worst of the two
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (saasStatus === 'critical' || iaasStatus === 'critical') {
      overallStatus = 'critical';
    } else if (saasStatus === 'warning' || iaasStatus === 'warning') {
      overallStatus = 'warning';
    }

    console.log(`[LogLens] License status fetched for ${lookupId}: SaaS ${data.saas?.utilization_percent || 0}%, IaaS ${data.iaas?.utilization_percent || 0}%`);
    
    return {
      tenant_name: data.tenant_name || tenantName || 'Unknown',
      saas: {
        licenses_used: data.saas?.licenses_used || 0,
        licenses_total: data.saas?.licenses_total || 0,
        utilization_percent: data.saas?.utilization_percent || 0,
        status: saasStatus,
        days_to_renewal: data.saas?.days_to_renewal
      },
      iaas: {
        licenses_used: data.iaas?.licenses_used || 0,
        licenses_total: data.iaas?.licenses_total || 0,
        utilization_percent: data.iaas?.utilization_percent || 0,
        status: iaasStatus,
        days_to_renewal: data.iaas?.days_to_renewal
      },
      overall_status: overallStatus
    };

  } catch (error) {
    console.error(`[LogLens] License API error for ${lookupId}:`, error);
    return null;
  }
}

/**
 * Calculate license status based on utilization percentage
 */
function calculateLicenseStatus(utilization: number): 'healthy' | 'warning' | 'critical' {
  if (utilization >= 100) return 'critical';
  if (utilization >= 85) return 'warning';
  return 'healthy';
}

/**
 * Format license status for inline display in LogLens card
 */
export function formatLicenseStatus(licenseStatus: LicenseStatus): string {
  const getStatusEmoji = (status: 'healthy' | 'warning' | 'critical') => {
    return status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '🚨';
  };
  
  const formatLicenseType = (type: 'SaaS' | 'IaaS', licenseData: any) => {
    if (licenseData.licenses_total === 0) return null;
    
    const emoji = getStatusEmoji(licenseData.status);
    const used = licenseData.licenses_used.toLocaleString();
    const total = licenseData.licenses_total.toLocaleString(); 
    const percent = licenseData.utilization_percent;
    
    let typeDisplay = `${emoji} **${type}**: ${used}/${total} (${percent}%)`;
    
    // Add renewal warning if close
    if (licenseData.days_to_renewal && licenseData.days_to_renewal < 60) {
      typeDisplay += ` • Renews ${licenseData.days_to_renewal}d`;
    }
    
    return typeDisplay;
  };
  
  const saasDisplay = formatLicenseType('SaaS', licenseStatus.saas);
  const iaasDisplay = formatLicenseType('IaaS', licenseStatus.iaas);
  
  // Build combined display
  const displays = [saasDisplay, iaasDisplay].filter(Boolean);
  
  if (displays.length === 0) {
    return '📄 **Licenses**: No license data available';
  }
  
  // Show both on same line if both exist and are short, otherwise stack them
  if (displays.length === 2) {
    const combined = displays.join(' • ');
    // If combined string is too long (>80 chars), stack them
    if (combined.length > 80) {
      return `📊 **Licenses**:\n${displays.join('\n')}`;
    } else {
      return `📊 **Licenses**: ${combined}`;
    }
  } else {
    return `📊 **Licenses**: ${displays[0]}`;
  }
}

/**
 * Get license dashboard URL for tenant
 */
export function getLicenseDashboardUrl(
  tenantUid?: string,
  accountUid?: string,
  tenantName?: string
): string {
  const baseUrl = process.env.LICENSING_BASE_URL || 'https://licensing.internal.cyera.io';
  const lookupId = tenantUid || accountUid || tenantName;
  if (lookupId) {
    return `${baseUrl}/dashboard/tenant/${encodeURIComponent(lookupId)}`;
  }
  return `${baseUrl}/dashboard`;
}
