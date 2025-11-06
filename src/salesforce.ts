// src/salesforce.ts
// Salesforce API integration for account details and AAR

interface SalesforceAccount {
  Id: string;
  Name: string;
  AnnualRevenue: number;
  Industry?: string;
  Type?: string;
  NumberOfEmployees?: number;
  BillingCountry?: string;
  Owner?: { Name: string };
}

let salesforceAccessToken: string | null = null;
let salesforceTokenExpiry: number = 0;

/**
 * Get Salesforce OAuth access token
 */
async function getSalesforceAccessToken(): Promise<string | null> {
  if (salesforceAccessToken && salesforceTokenExpiry > Date.now()) {
    return salesforceAccessToken;
  }

  const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const username = process.env.SALESFORCE_USERNAME;
  const password = process.env.SALESFORCE_PASSWORD;
  const securityToken = process.env.SALESFORCE_SECURITY_TOKEN;

  if (!clientId || !clientSecret || !username || !password || !securityToken) {
    console.error('[LogLens] Salesforce API credentials missing in environment variables.');
    return null;
  }

  try {
    const response = await fetch(`${loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: `${password}${securityToken}`,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[LogLens] Salesforce OAuth error:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    salesforceAccessToken = data.access_token;
    salesforceTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute before expiry
    console.log('[LogLens] Salesforce access token refreshed.');
    return salesforceAccessToken;

  } catch (error) {
    console.error('[LogLens] Error fetching Salesforce access token:', error);
    return null;
  }
}

/**
 * Fetch Salesforce account details by ID
 */
export async function getSalesforceAccountDetails(salesforceAccountId: string): Promise<SalesforceAccount | null> {
  const salesforceUrl = process.env.SALESFORCE_API_BASE_URL || 'https://cyera.my.salesforce.com';
  
  try {
    const accessToken = await getSalesforceAccessToken();
    if (!accessToken) return null;

    const endpoint = `${salesforceUrl}/services/data/v58.0/sobjects/Account/${salesforceAccountId}`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`[LogLens] Salesforce API returned ${response.status} for account ${salesforceAccountId}`);
      return null;
    }

    const data: SalesforceAccount = await response.json();
    console.log(`[LogLens] Salesforce account fetched: ${data.Name} ($${data.AnnualRevenue?.toLocaleString()})`);
    return data;

  } catch (error) {
    console.error(`[LogLens] Error fetching Salesforce account ${salesforceAccountId}:`, error);
    return null;
  }
}

/**
 * Format Salesforce account details for display in LogLens card
 */
export function formatSalesforceAccount(account: SalesforceAccount): string {
  const aar = account.AnnualRevenue ? `$${(account.AnnualRevenue / 1_000_000).toFixed(1)}M` : 'N/A';
  const industry = account.Industry || 'N/A';
  const employees = account.NumberOfEmployees ? account.NumberOfEmployees.toLocaleString() : 'N/A';
  const country = account.BillingCountry || 'N/A';
  const owner = account.Owner?.Name || 'N/A';

  return `💼 **${account.Name}** • AAR: ${aar} • ${industry} • ${employees} employees • ${country}\n` +
         `👤 Owner: ${owner} • Customer Success Lead: Zodi Tagedini`;
}

/**
 * Determine account tier based on AAR
 */
export function getAccountTier(annualRevenue?: number): string {
  if (!annualRevenue) return 'Standard';
  if (annualRevenue >= 5_000_000) return '👑 Strategic';
  if (annualRevenue >= 1_000_000) return '🏆 Enterprise';
  if (annualRevenue >= 500_000) return '🥇 Strategic';
  return 'Standard';
}
