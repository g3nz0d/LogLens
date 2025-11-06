// src/zendesk.ts
// Zendesk integration for ticket linking and organization management

/**
 * Generate a Zendesk URL with smart routing based on available information
 */
export function zendeskUrl(
  fields: Record<string, string>,
  channelMapping?: { 
    zendesk_organization_id?: string; 
    zendesk_organization_name?: string;
    client_name?: string;
  }
): string {
  const baseUrl = process.env.ZENDESK_BASE_URL || 'https://cyerahelp.zendesk.com';
  const orgPath = process.env.ZENDESK_ORG_PATH || '/agent/organizations';
  const ticketPath = process.env.ZENDESK_TICKET_PATH || '/agent/tickets';
  const searchPath = process.env.ZENDESK_SEARCH_PATH || '/agent/search/1';

  // 1. Direct ticket link (highest priority)
  if (fields.ticket_id) {
    console.log('[LogLens] Zendesk direct ticket:', fields.ticket_id);
    return `${baseUrl}${ticketPath}/${fields.ticket_id}`;
  }

  // 2. Organization tickets from channel mapping (most common use case)
  if (channelMapping?.zendesk_organization_id) {
    console.log('[LogLens] Zendesk org from channel mapping:', channelMapping.zendesk_organization_id);
    return `${baseUrl}${orgPath}/${channelMapping.zendesk_organization_id}/tickets`;
  }

  // 3. Search by requester email
  if (fields.requester_email) {
    const query = encodeURIComponent(`requester:${fields.requester_email}`);
    console.log('[LogLens] Zendesk email search:', fields.requester_email);
    return `${baseUrl}${searchPath}?q=${query}`;
  }

  // 4. Search by organization name
  const orgName = fields.organization || 
                  channelMapping?.zendesk_organization_name || 
                  channelMapping?.client_name;
  
  if (orgName) {
    const query = encodeURIComponent(`organization:"${orgName}"`);
    console.log('[LogLens] Zendesk org search:', orgName);
    return `${baseUrl}${searchPath}?q=${query}`;
  }

  // 5. Search by requester name
  if (fields.requester_name) {
    const query = encodeURIComponent(`requester:"${fields.requester_name}"`);
    console.log('[LogLens] Zendesk name search:', fields.requester_name);
    return `${baseUrl}${searchPath}?q=${query}`;
  }

  // 6. Fallback: Recent tickets search
  const fallbackQuery = channelMapping?.client_name ? 
    encodeURIComponent(`"${channelMapping.client_name}"`) : 
    'type:ticket status<solved';
  
  console.log('[LogLens] Zendesk fallback search');
  return `${baseUrl}${searchPath}?q=${fallbackQuery}`;
}

/**
 * Generate a Zendesk organization overview URL
 */
export function zendeskOrganizationUrl(channelMapping?: { zendesk_organization_id?: string }): string {
  const baseUrl = process.env.ZENDESK_BASE_URL || 'https://cyerahelp.zendesk.com';
  const orgPath = process.env.ZENDESK_ORG_PATH || '/agent/organizations';

  if (channelMapping?.zendesk_organization_id) {
    return `${baseUrl}${orgPath}/${channelMapping.zendesk_organization_id}`;
  }

  return `${baseUrl}${orgPath}`;
}

/**
 * Generate button text based on what type of Zendesk link we're creating
 */
export function zendeskButtonText(
  fields: Record<string, string>,
  channelMapping?: { zendesk_organization_id?: string; client_name?: string }
): string {
  // Direct ticket
  if (fields.ticket_id) {
    return `Ticket #${fields.ticket_id}`;
  }

  // Organization tickets
  if (channelMapping?.zendesk_organization_id) {
    return `${channelMapping.client_name || 'Org'} Tickets`;
  }

  // Email search
  if (fields.requester_email) {
    return `Tickets by Email`;
  }

  // Organization search
  if (fields.organization || channelMapping?.client_name) {
    return `${fields.organization || channelMapping?.client_name || 'Org'} Tickets`;
  }

  // Fallback
  return 'Zendesk Search';
}
