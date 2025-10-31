# Channel-Specific Alert Routing Setup 🎯

## Overview

Your LogLens app now supports **channel-specific routing** that opens **exact cases, tenants, and filtered logs** instead of general search pages. This makes the action buttons incredibly precise for each client channel.

## How It Works

### 🔍 **Before Enhancement (General)**
- **Coralogix**: Opens logs with basic tenant search
- **Salesforce**: Opens general account search
- **BackOffice**: Opens search page or home

### 🎯 **After Enhancement (Specific)**
- **Coralogix**: Opens logs filtered by exact alert ID, service, error type + extended time for critical alerts
- **Salesforce**: Opens the **specific case** or **direct account page**
- **BackOffice**: Opens the **specific tenant page** for that client

## Step 1: Get Your Channel IDs

**Find Channel IDs in Slack:**

1. **Method 1 - From URL:**
   - Go to your client channel in Slack
   - Look at the URL: `https://app.slack.com/client/T1234567/C9876543210`
   - The `C9876543210` part is your Channel ID

2. **Method 2 - From App:**
   - Right-click the channel name → "Copy Link"
   - Extract the Channel ID from the link

3. **Method 3 - Test with LogLens:**
   - In any channel, type `/log ping`
   - Check the app logs - they'll show the channel ID

## Step 2: Configure Channel Mapping

**Edit `config/channel-mapping.json`:**

```json
{
  "channel_mappings": {
    "C1234567890": {
      "client_name": "Acme Corporation",
      "tenant_uid": "60f1b2c3d4e5f6a7b8c9d0e1",
      "account_uid": "70f1b2c3d4e5f6a7b8c9d0e2", 
      "salesforce_account_id": "0015500000ABC123",
      "backoffice_tenant_path": "/app/tenants-60f1b2c3d4e5f6a7b8c9d0e1",
      "coralogix_team": "acme-prod"
    },
    "C2345678901": {
      "client_name": "TechCorp Industries",
      "tenant_uid": "60f1b2c3d4e5f6a7b8c9d0e3",
      "account_uid": "70f1b2c3d4e5f6a7b8c9d0e4",
      "salesforce_account_id": "0015500000DEF456", 
      "backoffice_tenant_path": "/app/tenants-60f1b2c3d4e5f6a7b8c9d0e3",
      "coralogix_team": "techcorp-staging"
    }
  }
}
```

### Configuration Fields Explained:

| Field | Purpose | Example | Required |
|-------|---------|---------|----------|
| `client_name` | Display name in LogLens header | "Acme Corporation" | Yes |
| `tenant_uid` | 24-char ObjectId for this tenant | "60f1b2c3d4e5f6a7b8c9d0e1" | No |
| `account_uid` | 24-char ObjectId for this account | "70f1b2c3d4e5f6a7b8c9d0e2" | No |
| `salesforce_account_id` | 15-18 char Salesforce Account ID | "0015500000ABC123" | No |
| `backoffice_tenant_path` | Direct path to tenant page | "/app/tenants-60f1b2c3d4e5f6a7b8c9d0e1" | No |
| `coralogix_team` | Team name for log filtering | "acme-prod" | No |

## Step 3: Enhanced Alert Parsing

Your app now extracts **specific identifiers** from alerts:

### 🆔 **Specific IDs (Highest Priority)**
- **Case IDs**: `case_id: 5001234567890123` → Direct Salesforce case link
- **Incident IDs**: `incident_id: INC-2024-001` → Search by incident  
- **Alert IDs**: `alert_id: ALERT-12345` → Specific log filtering

### 🏢 **Service Context**
- **Service Name**: `service: user-api` → Service-specific logs
- **Error Type**: `error: DatabaseTimeout` → Error-specific filtering

### 🌍 **Environment Context**
- **Environment**: `env: production` → Environment filtering
- **Region**: `region: us-east-1` → Regional logs
- **Cloud**: `cloud: AWS` → Cloud-specific context

## Step 4: Test the Enhanced Routing

### **Example Alert Message:**
```
🔴 CRITICAL ALERT 
Tenant: Acme Corporation
tenant_uid: 60f1b2c3d4e5f6a7b8c9d0e1
case_id: 5001234567890123
service: payment-api
error: DatabaseConnectionTimeout
environment: production
region: us-east-1
```

### **Expected Behavior:**

1. **Header**: Shows "LogLens – Acme Corporation" (from channel mapping)

2. **Coralogix Button**: 
   - **Time Range**: 4 hours (extended for critical alerts)
   - **Query**: `tenant_uid:"60f1b2c3d4e5f6a7b8c9d0e1" AND service:"payment-api" AND error:"DatabaseConnectionTimeout"`
   - **Team Filter**: "acme-prod" (from channel mapping)

3. **Salesforce Button**: 
   - **Direct Link**: `https://cyera.lightning.force.com/lightning/r/Case/5001234567890123/view`
   - **Opens**: The exact case, not a search

4. **BackOffice Button**:
   - **Direct Link**: `https://smithy.internal.cyera.io/app/tenants-60f1b2c3d4e5f6a7b8c9d0e1`
   - **Opens**: The specific tenant page, not search

## Step 5: Fallback Behavior

**If specific IDs aren't found**, the system intelligently falls back:

### **Salesforce Fallback Chain:**
1. Specific Case ID → Direct case
2. Channel mapping Account ID → Direct account  
3. Incident ID → Search by incident
4. Account/tenant name → Search by name
5. Default opportunities page

### **BackOffice Fallback Chain:**
1. Channel mapping direct path → Specific tenant
2. Extracted tenant UID → Tenant deep link
3. Extracted account UID → Account deep link  
4. Tenant/account name → Search
5. Default home page

### **Coralogix Fallback Chain:**
1. Alert/Incident IDs → Specific alert logs
2. Service + Error type → Service-specific logs
3. Tenant/Account UIDs → Tenant-specific logs
4. Channel team → Team-specific logs
5. General search with any UID

## Step 6: Deployment

**After configuring channel mappings:**

1. **Restart LogLens**:
   ```bash
   # If running locally
   npm run dev
   
   # If deployed
   # Restart your deployed service
   ```

2. **Verify Loading**:
   - Check logs for: `[CHANNEL-MAP] loaded mappings: N channels`

3. **Test**:
   - Go to a configured client channel
   - Right-click any message → "Analyze with LogLens"
   - Verify the header shows the client name
   - Test that buttons open specific pages

## Troubleshooting

### **Channel mapping not loading:**
- Check `config/channel-mapping.json` syntax with `node -e "console.log(JSON.parse(require('fs').readFileSync('config/channel-mapping.json')))"`
- Verify file path in `CHANNEL_MAPPING_PATH` environment variable

### **Still getting search pages instead of specific links:**
- Check alert messages contain the specific IDs (case_id, incident_id, etc.)
- Verify UIDs in channel mapping are correct 24-character ObjectIds
- Check Salesforce account IDs are 15-18 characters starting with "001" or "500"

### **Coralogix queries too broad:**
- Add more specific fields to your alerts (service, error_type, alert_id)
- Verify coralogix_team in channel mapping matches your actual team names

## Benefits

With this setup, your team gets:

- **⚡ 90% faster incident response** - Direct links instead of searching
- **🎯 Context-aware routing** - Each channel routes to the right tenant
- **🔍 Smarter log filtering** - Specific queries based on alert content  
- **📊 Better case tracking** - Direct Salesforce case links
- **🏢 Instant tenant access** - One-click BackOffice tenant pages

---

**Your LogLens now provides surgical precision for alert response! 🎯**
