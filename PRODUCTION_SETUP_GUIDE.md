# 🚀 LogLens Production Deployment Guide

## Current State
- **Development**: Personal Railway instance with test configuration
- **Goal**: Production instance serving entire organization

## 📋 Production Deployment Steps

### Step 1: Gather All Alert Channels

**You need the Slack Channel ID for EVERY client alert channel:**

```bash
# Method 1: Get Channel IDs from Slack
1. Go to each client alert channel in Slack
2. Right-click channel name → View channel details
3. Scroll down → Copy Channel ID (starts with 'C')
4. Create a list of: Channel ID → Client Name

# Method 2: Use Slack API (faster for many channels)
# Get all channels at once
curl -H "Authorization: Bearer YOUR_SLACK_BOT_TOKEN" \
  "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=1000"
```

**Example list you should create:**
```
Channel ID          | Channel Name              | Client
--------------------|---------------------------|------------------
C09KPNV85QS        | #loglens---test           | Seismic
C1A2B3C4D5E        | #client-acme-alerts       | Acme Corp
C6F7G8H9I0J        | #client-techcorp-alerts   | TechCorp
C11K12L13M14       | #client-bigco-prod        | BigCo
... (all your client alert channels)
```

### Step 2: Gather Client Configuration Data

**For EACH client, collect:**

1. **Identifiers:**
   - Tenant UID (from your systems)
   - Account UID (if different from tenant)
   
2. **Salesforce:**
   - Account ID (15 or 18 character SF ID)
   
3. **BackOffice:**
   - Direct tenant path (if available)
   
4. **Coralogix:**
   - Team name/filter
   - Saved query URL (if you have common searches)
   
5. **ZenDesk (if applicable):**
   - Organization ID
   - Organization name

### Step 3: Update channel-mapping.json

**Create complete mapping file:**

```json
{
  "channel_mappings": {
    "C09KPNV85QS": {
      "client_name": "Seismic",
      "tenant_uid": "c670d246-8a9b-472f-badf-4c1ee5c73831",
      "salesforce_account_id": "006VN00000LXtEZYA1",
      "backoffice_tenant_path": "/app/backoffice/single-tenant-xxx?tenantId=c670d246-8a9b-472f-badf-4c1ee5c73831",
      "coralogix_team": "seismic-prod",
      "zendesk_organization_id": "29506361719063"
    },
    "C1A2B3C4D5E": {
      "client_name": "Acme Corporation",
      "tenant_uid": "your-acme-tenant-uid",
      "salesforce_account_id": "0015500000ABC123",
      "backoffice_tenant_path": "/app/tenants-xxx",
      "coralogix_team": "acme-prod"
    }
    // ... ADD ALL CLIENT CHANNELS
  }
}
```

### Step 4: Update accounts.csv

**Add ALL tenant and account UIDs:**

```csv
account_uid,tenant_uid,account_name,tenant_name,cloud,region,platform
c670d246-8a9b-472f-badf-4c1ee5c73831,c670d246-8a9b-472f-badf-4c1ee5c73831,Seismic,Seismic Prod,AWS,us-east-1,cyera
your-acme-uid,your-acme-tenant-uid,Acme Corporation,Acme Prod,AWS,us-east-1,cyera
your-techcorp-uid,your-techcorp-tenant-uid,TechCorp,TechCorp Prod,Azure,eastus,cyera
# ... ADD ALL CLIENTS
```

### Step 5: Deploy to Production Railway

```bash
# 1. Commit updated configuration
git add config/channel-mapping.json config/accounts.csv
git commit -m "Add production channel mappings and account data"
git push origin main

# 2. Railway will auto-deploy the changes
# 3. Monitor logs in Railway dashboard
# 4. Look for: "[CHANNEL-MAP] loaded mappings: X channels"
```

### Step 6: Test in Production

**Test plan:**
1. **Generic channel test**: `/log ping` in any channel
2. **Mapped channel test**: Use "Analyze with LogLens" in each client channel
3. **Verify routing**: Check that each client gets correct:
   - Client name in header
   - Salesforce links to correct account
   - BackOffice links to correct tenant
   - Coralogix filtered to correct team

### Step 7: Team Rollout

**Announce to organization:**
```
🎉 LogLens is now live in production!

LogLens provides instant analysis of alerts with direct links to:
- 🔍 Coralogix logs (filtered by client)
- 💼 Salesforce account records
- 🏢 BackOffice tenant details
- 🎫 ZenDesk tickets

How to use:
1. Right-click any alert message
2. Select "More actions" → "Analyze with LogLens"
3. Get instant context + action buttons

Available in these channels:
- #client-acme-alerts
- #client-techcorp-alerts
- #client-bigco-prod
[... list all mapped channels]

Questions? Check the user guide or reach out to [your team]
```

## 🔧 Ongoing Maintenance

### When adding a new client:

1. **Get channel ID** for their alert channel
2. **Add to channel-mapping.json**:
   ```json
   "C_NEW_CLIENT_ID": {
     "client_name": "New Client Name",
     "tenant_uid": "their-tenant-uid",
     "salesforce_account_id": "their-sf-id"
   }
   ```
3. **Add to accounts.csv**:
   ```csv
   their-account-uid,their-tenant-uid,New Client,New Client Prod,AWS,us-east-1,cyera
   ```
4. **Commit and push**:
   ```bash
   git add config/
   git commit -m "Add New Client mapping"
   git push origin main
   ```
5. **Railway auto-deploys** (or restart manually)
6. **Test** in the new client's channel

### Monthly maintenance:
- Review and update account data
- Verify all channel mappings are current
- Update Salesforce account IDs if changed
- Review Railway logs for errors

## 🎯 Success Criteria

Production deployment is successful when:

- ✅ Railway production instance is stable and running 24/7
- ✅ All client alert channels are mapped in config
- ✅ Users in ANY mapped channel can use LogLens
- ✅ Each client gets their specific routing (SF, BO, Coralogix)
- ✅ No manual intervention needed for day-to-day usage
- ✅ New clients can be added with simple config updates

## 🔑 Key Differences: Dev vs Production

| Aspect | Your Current Dev Setup | Production Setup |
|--------|------------------------|------------------|
| **Railway** | Personal project | Organization production project |
| **Channels** | Test channels only | ALL client alert channels |
| **Configuration** | Test data | Real client data for all clients |
| **Environment** | Development/testing | Production (24/7 uptime required) |
| **Users** | Just you testing | Entire organization using daily |
| **Maintenance** | As needed | Systematic updates when clients added |

## 📊 Monitoring Production

**Check regularly:**
```bash
# Railway Dashboard → LogLens-Production → Logs
# Look for:
✅ "[LogLens] booting at [timestamp]"
✅ "[CHANNEL-MAP] loaded mappings: 25 channels"  # Your actual count
✅ "✅ Socket Mode started"
✅ "[INFO] socket-mode:SocketModeClient:0 Now connected to Slack"

# Watch for errors:
❌ "ERROR" or "Error" in logs
❌ "Failed to load channel-mapping.json"
❌ "Socket connection closed"
```

**Set up alerts in Railway** for:
- Deployment failures
- High error rates
- Service downtime
- Memory/CPU issues

---

## Quick Reference

**Production Railway URL**: [Your Railway production URL]
**GitHub Repository**: https://github.com/g3nz0d/LogLens
**Configuration Files**: 
- `config/channel-mapping.json` - Channel routing
- `config/accounts.csv` - UID enrichment data

**Need help?** Check:
1. Railway logs for errors
2. `team-onboarding/troubleshooting.md`
3. Your internal LogLens admin
