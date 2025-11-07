# 👥 LogLens User Guide

**How to use LogLens in Slack for faster incident response and log analysis**

## 🎯 What is LogLens?

LogLens is your intelligent assistant for analyzing alerts and quickly accessing related systems. It automatically:

- **Extracts important information** from alert messages (tenant IDs, account names, error details)
- **Provides instant access** to logs, Salesforce records, BackOffice tenants, and support tickets
- **Enriches data** with business context like account tiers, licensing status, and contact info
- **Works privately** - all responses are ephemeral (only you see them)

## 🚀 Quick Start

### Method 1: Message Shortcuts (Recommended)

**For any alert message:**

1. **Right-click on the message** you want to analyze
2. **Select "⚡ More actions"** from the menu
3. **Click "Analyze with LogLens"**
4. **Get instant results** with extracted UIDs and action buttons

### Method 2: Slash Commands

**For custom analysis:**

```
/log ping                    # Test if LogLens is working
/log tenant: Acme Corp       # Analyze custom text
/log [paste alert text here] # Analyze any alert content
```

## 📊 What You Get

### Smart Analysis Card

When you analyze a message, LogLens shows you:

```
LogLens – Acme Corporation (🥇 Strategic)

Alert Type: coralogix-alert  •  Fields Found: 6
tenant_uid=60f1b2c3d4e5f6a7b8c9d0e1  account_name=Acme Corp  
region=us-east-1  severity=critical  service_name=api-gateway
Context: 🎯 Acme Corporation • Source: coralogix

💰 Salesforce Account: $2.1M ARR • 🏢 Technology • 🌎 United States
👤 Account Owner: Sarah Johnson • 📊 Strategic Tier (Top 10%)

📊 Licenses: ✅ SaaS: 1,250/1,500 (83%) • ⚠️ IaaS: 920/1,000 (92%) 

🔍 Extracted 2 UIDs:
1. 60f1b2c3d4e5f6a7b8c9d0e1 • Acme Prod • (Acme Corp) • AWS • us-east-1
2. a1b2c3d4e5f6a7b8c9d0e123 • Acme Staging • GCP • us-central1

📋 Copy UIDs:
60f1b2c3d4e5f6a7b8c9d0e1
a1b2c3d4e5f6a7b8c9d0e123

[Logs] [Redash] [SalesForce] [BackOffice] [ZenDesk]
```

### Action Buttons

**🔍 Logs Button**
- Opens Coralogix with filtered logs for the last 2-4 hours
- Pre-filtered by tenant, service, and error type
- Extended time range for critical alerts

**📊 Redash Button**  
- Opens analytics dashboard with tenant-specific data
- Shows usage patterns, performance metrics, and trends
- Includes licensing and alert history

**💼 SalesForce Button**
- Direct link to account or opportunity record
- Shows account details, ARR, and contact information  
- Routes to specific cases if case ID found

**🏢 BackOffice Button**
- Deep links to tenant configuration
- Shows tenant settings, environment details, and status
- Falls back to search if deep link not available

**🎫 ZenDesk Button**
- Links to organization's tickets and history
- Shows open tickets and recent activity
- Routes to specific ticket if ticket ID found

## 🎨 Understanding the Results

### Alert Information

**Alert Type**: Identifies the source system (coralogix-alert, datadog-alert, etc.)
**Fields Found**: Number of structured fields extracted from the message
**Field Display**: Key identifiers are **bolded**, others are shown normally

### Business Intelligence

**Salesforce Account Info**:
- Annual Recurring Revenue (ARR)
- Account tier (Strategic, Enterprise, Standard)
- Industry and location
- Account owner contact

**License Status**:
- ✅ Healthy (under 85% utilization)
- ⚠️ Warning (85-100% utilization) 
- 🚨 Critical (over 100% utilization)

### UID Enrichment

**What are UIDs?**
UIDs are unique identifiers for accounts and tenants:
- **ObjectIds**: 24-character hex (e.g., `60f1b2c3d4e5f6a7b8c9d0e1`)
- **UUIDs**: 8-4-4-4-12 format (e.g., `c670d246-8a9b-472f-badf-4c1ee5c73831`)

**Enriched Information**:
- Human-readable account and tenant names
- Cloud provider (AWS, Azure, GCP)
- Region information
- Environment type (prod, staging, dev)

## 🎯 Use Cases & Workflows

### Incident Response

1. **Alert arrives** in your Slack channel
2. **Right-click → Analyze with LogLens**
3. **Review business context** (account tier, ARR, contact info)
4. **Click "Logs"** to investigate technical details
5. **Click "SalesForce"** to check for related cases
6. **Click "BackOffice"** to review tenant configuration

### Account Research

1. **Use slash command**: `/log tenant: CustomerName`
2. **Review account details** and licensing status
3. **Click "SalesForce"** for business relationship details
4. **Click "Redash"** for usage analytics

### Support Ticket Investigation

1. **Analyze ticket notification** with message shortcut
2. **Extract customer UIDs** and context
3. **Click "ZenDesk"** to see full ticket history
4. **Click "Logs"** to investigate technical issues
5. **Click "BackOffice"** to check configuration

### License Monitoring

1. **Analyze alerts** about license usage
2. **Review license status** in LogLens response
3. **Click "Redash"** for detailed usage trends
4. **Click "SalesForce"** to check renewal status

## 💡 Pro Tips

### Getting Better Results

**Include key identifiers** in your messages:
- Tenant names, UIDs, or account names
- Service names and error types
- Timestamps and regions
- Case or ticket numbers

**Use descriptive channel names** for automatic routing:
- Channels mapped to specific clients get enhanced results
- Better business context and targeted system links

### Copying Information

**UIDs for investigation**:
- Use the "📋 Copy UIDs" section
- Perfect for pasting into log searches or tickets

**Sharing with team**:
- LogLens responses are ephemeral (private to you)
- Copy important info to share in channel if needed

### Troubleshooting

**If buttons don't work**:
- Check if your network can access the target systems
- Verify you have appropriate permissions
- Contact your LogLens admin if persistent issues

**If no UIDs are found**:
- The message might not contain ObjectIds or UUIDs
- Try using `/log` command with more specific text
- Check if account data is configured for your UIDs

## 🔐 Privacy & Security

### What LogLens Sees

**LogLens processes**:
- Message content you analyze
- Extracted UIDs and structured data
- Channel context for routing

**LogLens does NOT store**:
- Your messages permanently
- Personal information
- Conversation history

### Ephemeral Responses

- All LogLens responses are **ephemeral**
- Only you can see the analysis results
- No "channel noise" or public responses
- Safe to analyze sensitive alerts

### Data Access

LogLens accesses:
- **Your organization's systems** (with proper authentication)
- **Account enrichment data** (configured by admins)
- **Channel mapping configuration** (for routing)

All access is read-only and follows your organization's security policies.

## 🆘 Getting Help

### Common Issues

**"LogLens not responding"**
- Try `/log ping` to test connectivity
- Check if the app is installed in your workspace
- Contact your Slack admin

**"No action buttons appearing"**  
- Verify service integrations are configured
- Check your network access to target systems
- Review with LogLens admin

**"UIDs not enriched"**
- Account data might not be configured yet
- UIDs might not be in the enrichment database
- Contact admin to add missing accounts

### Support Resources

1. **Test connectivity**: `/log ping`
2. **Check troubleshooting guide**: Ask admin for troubleshooting doc
3. **Contact admin**: Your organization's LogLens administrator
4. **Slack support**: For Slack app installation issues

### Reporting Issues

When reporting problems, include:
- The exact error message or unexpected behavior
- Steps to reproduce the issue
- The channel where it occurred
- Screenshots if helpful

## 📚 Advanced Usage

### Custom Analysis

Use `/log` for analyzing text that's not in a Slack message:

```bash
# Analyze error logs
/log Error in tenant c670d246-8a9b-472f-badf-4c1ee5c73831 service api-gateway

# Analyze support requests  
/log Customer: Acme Corp reporting login issues in production

# Test specific UIDs
/log Testing UID: 60f1b2c3d4e5f6a7b8c9d0e1
```

### Channel-Specific Features

Some channels have enhanced features:
- **Direct system routing** for specific clients
- **Pre-configured searches** in Coralogix
- **Saved queries** for common investigations
- **Custom dashboards** in analytics tools

### Integration Workflows

**With ticketing systems**:
1. Analyze alert → Get account context
2. Create ticket with enriched information
3. Include relevant UIDs and system links

**With monitoring tools**:
1. Alert → LogLens analysis → System investigation
2. Use extracted context for targeted searches
3. Cross-reference business impact

---

## 🎉 You're Ready!

Start using LogLens today:
1. Find any alert message in Slack
2. Right-click → "Analyze with LogLens"  
3. Explore the results and action buttons
4. Try `/log ping` to test the slash command

**Questions?** Contact your LogLens admin or check the troubleshooting guide.

**Happy investigating! 🔍**
