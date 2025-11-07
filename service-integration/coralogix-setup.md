# 🔍 Coralogix Integration Setup

Complete guide to configuring Coralogix integration for LogLens log analysis.

## 🎯 Overview

The Coralogix integration enables LogLens to generate intelligent, filtered log queries with:

- **Smart time windows** (2-4 hours based on alert severity)
- **Multi-field filtering** (tenant, service, error type, region)
- **Pre-built saved queries** for common investigations
- **Team-specific routing** for better log organization

## 📋 Prerequisites

- **Coralogix Access**: Admin or viewer access to your organization's Coralogix instance
- **Instance URL**: Your organization's Coralogix domain
- **Team Information**: Knowledge of how your teams/tenants are organized in Coralogix
- **Query Patterns**: Understanding of common log search patterns

## 🔧 Basic Configuration

### Step 1: Get Your Coralogix Instance URL

**Find your Coralogix URL:**
1. Log into your Coralogix instance
2. Copy the base URL (e.g., `https://yourorg.coralogix.com`)
3. Note: Don't include paths like `/#/logs` - just the base domain

**Common formats:**
- `https://app.coralogix.com` (US region, default)
- `https://yourorg.coralogix.com` (Custom domain)  
- `https://ng-api-http.coralogix.com` (EU region)
- `https://coralogix.ap-south1.coralogix.com` (Asia region)

### Step 2: Configure Environment Variable

```bash
# Set in your deployment
heroku config:set CORALOGIX_BASE_URL="https://yourorg.coralogix.com" --app your-loglens-app

# Or in .env for local development
CORALOGIX_BASE_URL=https://yourorg.coralogix.com
```

### Step 3: Test Basic Integration

1. **Deploy LogLens** with the Coralogix URL configured
2. **Test in Slack**: `/log tenant: TestCorp severity: critical`
3. **Click "Logs" button** - should open Coralogix with filters
4. **Verify URL structure** - should include query parameters

## 🎨 Advanced Configuration

### Channel-Specific Routing

Map Slack channels to specific Coralogix teams for targeted log searches:

```json
{
  "channel_mappings": {
    "C1234567890": {
      "client_name": "Acme Corporation",
      "coralogix_team": "acme-prod",
      "tenant_uid": "60f1b2c3d4e5f6a7b8c9d0e1"
    },
    "C2345678901": {
      "client_name": "TechCorp Staging",
      "coralogix_team": "techcorp-staging", 
      "tenant_uid": "60f1b2c3d4e5f6a7b8c9d0e3"
    }
  }
}
```

**Benefits:**
- Automatically filters logs by team
- Reduces noise in search results
- Faster query performance
- Better organized investigations

### Saved Query Integration

For frequently accessed log searches, configure pre-built Coralogix queries:

```json
{
  "channel_mappings": {
    "C1234567890": {
      "client_name": "Acme Corporation",
      "coralogix_saved_query_url": "https://yourorg.coralogix.com/#/query-new/logs?id=a8Ecktts9924siXZsKKER&page=0"
    }
  }
}
```

**How to create saved queries:**

1. **Build your query in Coralogix:**
   ```
   tenant_uid:"60f1b2c3d4e5f6a7b8c9d0e1" AND severity:("ERROR" OR "FATAL")
   ```

2. **Save the query** with a descriptive name

3. **Copy the saved query URL** from the browser address bar

4. **Add to channel mapping** as `coralogix_saved_query_url`

**When to use saved queries:**
- Complex multi-field filters
- Client-specific log patterns  
- Performance-optimized queries
- Standardized investigation procedures

## 🔍 Query Generation Logic

### Default Filter Priority

LogLens builds Coralogix queries using this priority order:

1. **Alert/Incident IDs** (highest priority)
   - `alert_id:"ABC123"`
   - `incident_id:"INC-456"`

2. **Service-specific filters**
   - `service:"api-gateway"`
   - `error:"TimeoutError"`

3. **Tenant/Account filters**
   - `tenant_uid:"60f1b2c3d4e5f6a7b8c9d0e1"`
   - `account_uid:"70f1b2c3d4e5f6a7b8c9d0e2"`

4. **Team routing** (from channel mapping)
   - `team:"acme-prod"`

5. **Name-based filters**
   - `tenant_name:"Acme Corp"`
   - `account_name:"Acme Corporation"`

6. **Environment context**
   - `environment:"production"`
   - `region:"us-east-1"`
   - `cloud:"AWS"`

### Time Range Logic

**Standard alerts**: 2-hour window (120 minutes)
**Critical alerts**: 4-hour window (240 minutes)

**Time range detection:**
- Looks for `severity` field containing "critical" or "fatal"
- Extends time window for better investigation coverage
- Calculates relative to current time

### Query Optimization

- **Maximum 5 filters** to prevent overly complex queries
- **AND logic** between filters for precision
- **Quoted values** to handle special characters
- **Fallback to any UID** if no labeled fields found

## 🎛️ Customization Options

### Custom Field Mapping

If your Coralogix logs use different field names, you can modify the query generation:

**Common customizations:**
```javascript
// In coralogix.ts, modify field mappings:
if (fields.tenant_uid) {
  filters.push(`customer_id:"${fields.tenant_uid}"`); // Your field name
}
if (fields.service_name) {
  filters.push(`app_name:"${fields.service_name}"`); // Your field name
}
```

### Environment-Specific Configuration

**Multiple Coralogix instances:**
```bash
# Different instances per environment
CORALOGIX_BASE_URL_PROD=https://prod.coralogix.com
CORALOGIX_BASE_URL_STAGING=https://staging.coralogix.com
```

**Team-based routing:**
```json
{
  "coralogix_teams": {
    "production": "prod-team",
    "staging": "staging-team", 
    "development": "dev-team"
  }
}
```

### Query Templates

**Create reusable query patterns:**
```javascript
const queryTemplates = {
  errorInvestigation: 'service:"{service}" AND severity:("ERROR" OR "FATAL") AND tenant_uid:"{tenant_uid}"',
  performanceIssue: 'service:"{service}" AND (response_time:>5000 OR timeout:true) AND tenant_uid:"{tenant_uid}"',
  securityAlert: 'category:"security" AND tenant_uid:"{tenant_uid}" AND severity:"CRITICAL"'
};
```

## 📊 Testing & Validation

### Test Query Generation

1. **Use debug logging:**
   ```bash
   heroku config:set DEBUG_LOGGING=true --app your-loglens-app
   ```

2. **Test various alert formats:**
   ```bash
   /log tenant_uid: 60f1b2c3d4e5f6a7b8c9d0e1 severity: critical service_name: api-gateway
   ```

3. **Check logs for query construction:**
   ```bash
   heroku logs --app your-loglens-app | grep "Coralogix query"
   # Should show: [LogLens] Coralogix query: {query, timeRange, filters}
   ```

### Validate URLs

**Test generated URLs:**
1. Click "Logs" button in LogLens response
2. Verify Coralogix opens with correct filters applied
3. Check time range matches alert severity
4. Confirm results are relevant

**URL structure should include:**
```
https://yourorg.coralogix.com/#/logs?query=...&from=...&to=...&view=logs
```

### Performance Testing

**Measure query performance:**
- Simple queries: < 2 seconds
- Complex queries: < 5 seconds  
- Saved queries: < 1 second
- Large result sets: May take longer but should not timeout

## 🚨 Troubleshooting

### Common Issues

**"Logs" button opens generic Coralogix page:**
- Check `CORALOGIX_BASE_URL` is correct
- Verify URL encoding in generated queries
- Test URL accessibility from deployment environment

**No results in Coralogix:**
- Verify field names match your log structure
- Check if tenant UIDs exist in your logs
- Test queries manually in Coralogix interface

**Slow query performance:**
- Reduce number of filters
- Use team routing for better index performance
- Consider saved queries for complex searches

**403/401 errors:**
- Check Coralogix authentication requirements
- Verify IP whitelisting if applicable
- Ensure proper user permissions

### Debug Steps

1. **Test Coralogix accessibility:**
   ```bash
   heroku run bash --app your-loglens-app
   curl -I $CORALOGIX_BASE_URL
   ```

2. **Examine generated queries:**
   ```bash
   heroku logs --app your-loglens-app | grep "Coralogix query"
   ```

3. **Test queries manually:**
   - Copy generated query from logs
   - Paste into Coralogix search interface
   - Verify results and performance

## 🔒 Security Considerations

### Access Control

**API tokens** (if using Coralogix APIs):
```bash
# Store API keys securely
heroku config:set CORALOGIX_API_KEY="your-api-key" --app your-loglens-app
```

**IP whitelisting:**
- Add your deployment IP addresses to Coralogix whitelist
- Use static IP services if required (Heroku add-ons available)

**User permissions:**
- Ensure LogLens users have appropriate Coralogix access
- Consider read-only access for most users
- Limit admin access to necessary personnel

### Data Privacy

**Query logging:**
- LogLens logs query construction for debugging
- Ensure log retention policies comply with data protection requirements
- Consider disabling debug logging in production

**URL sharing:**
- Generated URLs may contain sensitive tenant information
- Educate users on appropriate URL sharing practices
- Consider implementing URL shortening/proxying if needed

## 📈 Optimization Tips

### Performance

1. **Use team routing** to reduce search scope
2. **Implement saved queries** for common patterns
3. **Optimize time ranges** based on alert types
4. **Cache frequently accessed queries**

### User Experience

1. **Consistent field naming** across systems
2. **Descriptive team names** in routing configuration
3. **Relevant time windows** for different alert types
4. **Quick access to common searches**

### Maintenance

1. **Regular testing** of query generation
2. **Monitor query performance** and optimize slow queries
3. **Update team routing** as organization changes
4. **Review and update saved queries** periodically

---

## ✅ Configuration Checklist

- [ ] Coralogix base URL configured correctly
- [ ] Basic query generation tested and working
- [ ] Channel-specific team routing configured
- [ ] Saved queries created for frequent searches
- [ ] Time range logic validated for different alert types
- [ ] Query performance tested and optimized
- [ ] Access control and security measures implemented
- [ ] Documentation updated for team usage
- [ ] Monitoring and alerting configured for integration health

**Next Steps:** After completing Coralogix setup, proceed to `salesforce-setup.md` to configure Salesforce integration.
