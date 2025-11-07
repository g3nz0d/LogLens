# 🔧 LogLens Troubleshooting Guide

Complete troubleshooting guide for LogLens deployment, configuration, and usage issues.

## 🚨 Quick Diagnostics

### Health Check Commands

**Test LogLens connectivity:**
```bash
/log ping
# Expected response: "LogLens is alive here. You typed: ping"
```

**Test message analysis:**
1. Right-click any message
2. Look for "⚡ More actions" → "Analyze with LogLens"
3. Should show analysis card with extracted information

**Check deployment logs:**
```bash
# Heroku
heroku logs --tail --app your-loglens-app

# Docker  
docker logs your-loglens-container

# Self-hosted
journalctl -u loglens -f
```

## 🔍 Common Issues & Solutions

### Slack App Issues

#### `/log ping` Command Not Working

**Symptoms:**
- No response when typing `/log ping`
- "Command not found" error
- Slash command doesn't appear in autocomplete

**Solutions:**

1. **Check Slack app installation:**
   ```bash
   # Verify app is installed in workspace
   # Go to Slack Admin → Apps → Manage Apps
   # Look for LogLens in installed apps
   ```

2. **Verify slash command configuration:**
   - Go to https://api.slack.com/apps
   - Select your LogLens app
   - Check "Slash Commands" → `/log` exists
   - Ensure Socket Mode is enabled

3. **Check environment variables:**
   ```bash
   heroku config --app your-loglens-app | grep SLACK
   # Should show SLACK_BOT_TOKEN, SLACK_APP_TOKEN, SLACK_SIGNING_SECRET
   ```

4. **Review deployment logs:**
   ```bash
   heroku logs --tail --app your-loglens-app | grep -E "(socket-mode|Socket Mode)"
   # Look for: "✅ Socket Mode started. Waiting for Slack events…"
   ```

#### Message Shortcuts Not Appearing

**Symptoms:**
- "Analyze with LogLens" doesn't appear in "More actions" menu
- Right-click menu shows but shortcut is missing

**Solutions:**

1. **Check message shortcut configuration:**
   - Slack API → Your App → Interactivity & Shortcuts
   - Verify "Analyze with LogLens" shortcut exists
   - Callback ID should be `loglens_analyze`

2. **Verify app permissions:**
   - OAuth & Permissions → Bot Token Scopes
   - Ensure `chat:write` and `commands` scopes are present

3. **Test in different channel:**
   - Try in a public channel where the bot is a member
   - Some private channels may have restrictions

#### Ephemeral Responses Not Showing

**Symptoms:**
- `/log ping` responds but analysis cards don't appear
- No error messages, just silence

**Solutions:**

1. **Check bot token permissions:**
   ```bash
   # Verify bot token starts with xoxb-
   heroku config:get SLACK_BOT_TOKEN --app your-loglens-app
   ```

2. **Review error logs:**
   ```bash
   heroku logs --app your-loglens-app | grep -E "(error|Error|ERROR)"
   # Look for Slack API errors or permission issues
   ```

3. **Test bot token:**
   ```bash
   curl -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
        "https://slack.com/api/auth.test"
   # Should return bot info, not error
   ```

### Deployment Issues

#### App Won't Start

**Symptoms:**
- Deployment succeeds but app crashes immediately
- "Application error" in Heroku dashboard
- No response to Slack commands

**Solutions:**

1. **Check build logs:**
   ```bash
   heroku logs --source heroku --app your-loglens-app
   # Look for build failures or missing dependencies
   ```

2. **Verify package.json:**
   ```json
   {
     "scripts": {
       "start": "node dist/app.js",
       "build": "tsc"
     },
     "engines": {
       "node": "18"
     }
   }
   ```

3. **Check TypeScript compilation:**
   ```bash
   heroku run npm run build --app your-loglens-app
   # Should compile without errors
   ```

4. **Review environment variables:**
   ```bash
   heroku config --app your-loglens-app
   # Ensure all required variables are set
   ```

#### Environment Variables Issues

**Symptoms:**
- App starts but features don't work
- "undefined" errors in logs
- Service integrations failing

**Solutions:**

1. **Validate required variables:**
   ```bash
   # Check all required vars are present
   heroku config --app your-loglens-app | grep -E "(SLACK_|CORALOGIX|SALESFORCE|BACKOFFICE)"
   ```

2. **Check for typos in variable names:**
   ```bash
   # Common typos:
   # SLACK_BOT_TOKNE → SLACK_BOT_TOKEN
   # CORALOGIX_BASE_ULR → CORALOGIX_BASE_URL
   ```

3. **Verify token formats:**
   - `SLACK_BOT_TOKEN` should start with `xoxb-`
   - `SLACK_APP_TOKEN` should start with `xapp-`
   - `SLACK_SIGNING_SECRET` should be hex string

#### Configuration File Issues

**Symptoms:**
- UIDs not being enriched
- Channel mappings not working
- "CSV not found" or "JSON not found" in logs

**Solutions:**

1. **Verify files are committed:**
   ```bash
   git ls-files config/
   # Should show accounts.csv and channel-mapping.json
   ```

2. **Check file formats:**
   ```bash
   # Validate CSV format
   head -3 config/accounts.csv
   # Should show header + data rows

   # Validate JSON format  
   cat config/channel-mapping.json | python -m json.tool
   # Should parse without errors
   ```

3. **Review file paths:**
   ```bash
   heroku config:get ACCOUNT_INDEX_PATH --app your-loglens-app
   heroku config:get CHANNEL_MAPPING_PATH --app your-loglens-app
   ```

### Service Integration Issues

#### Coralogix Links Not Working

**Symptoms:**
- "Logs" button leads to generic Coralogix page
- No filtered results
- "Access denied" errors

**Solutions:**

1. **Check Coralogix URL:**
   ```bash
   heroku config:get CORALOGIX_BASE_URL --app your-loglens-app
   # Should match your organization's instance
   ```

2. **Test URL accessibility:**
   ```bash
   heroku run bash --app your-loglens-app
   curl -I $CORALOGIX_BASE_URL
   # Should return 200 or redirect, not error
   ```

3. **Verify query generation:**
   - Look for log lines like: `[LogLens] Coralogix query: {...}`
   - Check if tenant UIDs and filters are being extracted properly

#### Salesforce Links Not Working

**Symptoms:**
- "SalesForce" button leads to login page
- "Record not found" errors
- Generic search instead of specific records

**Solutions:**

1. **Check Salesforce URLs:**
   ```bash
   heroku config --app your-loglens-app | grep SALESFORCE
   # URLs should match your org's domain
   ```

2. **Verify account ID format:**
   - Salesforce IDs should be 15 or 18 characters
   - Check channel-mapping.json for correct account IDs

3. **Test URL construction:**
   - Look for logs: `[LogLens] Salesforce URL generated: ...`
   - Verify the constructed URLs are valid

#### BackOffice Links Not Working

**Symptoms:**
- "BackOffice" button returns 404
- Links to wrong tenant/account
- Generic search instead of deep links

**Solutions:**

1. **Check BackOffice URL configuration:**
   ```bash
   heroku config --app your-loglens-app | grep BACKOFFICE
   # Verify base URL and paths are correct
   ```

2. **Review path construction:**
   ```bash
   # Check logs for URL generation:
   heroku logs --app your-loglens-app | grep "BO candidates"
   ```

3. **Verify tenant UIDs:**
   - Ensure UIDs in channel-mapping.json match BackOffice expectations
   - ObjectIds vs UUIDs may matter for your system

### Data & Configuration Issues

#### UIDs Not Being Enriched

**Symptoms:**
- UIDs extracted but no account names shown
- "Unknown" entries in UID list
- Missing cloud/region information

**Solutions:**

1. **Check accounts.csv data:**
   ```bash
   # Verify UIDs exist in CSV
   grep "your-uid-here" config/accounts.csv
   ```

2. **Review CSV loading logs:**
   ```bash
   heroku logs --app your-loglens-app | grep "UID-INDEX"
   # Should show: "[UID-INDEX] loaded rows: N from ./config/accounts.csv"
   ```

3. **Validate CSV format:**
   ```csv
   # Correct format:
   account_uid,tenant_uid,account_name,tenant_name,cloud,region,platform
   60f1b2c3d4e5f6a7b8c9d0e1,70f1b2c3d4e5f6a7b8c9d0e2,Acme Corp,Acme Prod,AWS,us-east-1,cyera
   ```

#### Channel Mappings Not Working

**Symptoms:**
- All channels show "Unknown Client"
- Client-specific routing not working
- Generic system links instead of tenant-specific ones

**Solutions:**

1. **Get correct channel ID:**
   ```bash
   # In Slack: Right-click channel → View channel details → Copy ID
   # Should start with 'C' and be 10+ characters
   ```

2. **Check JSON format:**
   ```json
   {
     "channel_mappings": {
       "C1234567890": {
         "client_name": "Your Client Name"
       }
     }
   }
   ```

3. **Review mapping logs:**
   ```bash
   heroku logs --app your-loglens-app | grep "CHANNEL-MAP"
   # Should show: "[CHANNEL-MAP] loaded mappings: N channels"
   ```

### Performance Issues

#### Slow Response Times

**Symptoms:**
- LogLens takes >10 seconds to respond
- Timeout errors
- Partial results

**Solutions:**

1. **Check external service response times:**
   ```bash
   # Test each service individually
   heroku run bash --app your-loglens-app
   time curl -I $CORALOGIX_BASE_URL
   time curl -I $SALESFORCE_OPP_URL
   ```

2. **Review timeout configurations:**
   - LogLens has 3-second timeout for enrichment APIs
   - Increase timeout if needed for slow internal services

3. **Monitor resource usage:**
   ```bash
   heroku ps --app your-loglens-app
   # Check memory and CPU usage
   ```

#### Memory Issues

**Symptoms:**
- "Out of memory" errors
- App restarting frequently
- Slow performance over time

**Solutions:**

1. **Check memory usage:**
   ```bash
   heroku ps --app your-loglens-app
   heroku logs --app your-loglens-app | grep memory
   ```

2. **Reduce CSV file size:**
   - Large accounts.csv files can consume memory
   - Consider splitting or optimizing data

3. **Upgrade dyno size:**
   ```bash
   heroku ps:resize web=standard-1x --app your-loglens-app
   ```

## 🛠️ Debug Mode

### Enable Debug Logging

1. **Set debug environment variable:**
   ```bash
   heroku config:set DEBUG_LOGGING=true --app your-loglens-app
   ```

2. **Review detailed logs:**
   ```bash
   heroku logs --tail --app your-loglens-app
   # Will show detailed extraction and URL generation info
   ```

3. **Disable when done:**
   ```bash
   heroku config:unset DEBUG_LOGGING --app your-loglens-app
   ```

### Test Individual Components

**Test UID extraction:**
```bash
/log Testing UID extraction: 60f1b2c3d4e5f6a7b8c9d0e1
```

**Test field extraction:**
```bash
/log tenant_name: TestCorp severity: critical service_name: api-gateway
```

**Test channel mapping:**
```bash
# Use slash command in specific channel to test routing
/log tenant: MappedClient
```

## 📊 Monitoring & Alerts

### Health Monitoring

**Set up log monitoring:**
```bash
# Monitor for errors
heroku logs --tail --app your-loglens-app | grep -E "(error|Error|ERROR)"

# Monitor Socket Mode connection
heroku logs --tail --app your-loglens-app | grep "socket-mode"

# Monitor successful operations
heroku logs --tail --app your-loglens-app | grep "LogLens"
```

**Key health indicators:**
- Socket Mode connection status
- CSV/JSON loading success  
- Service integration response times
- Memory and CPU usage

### Performance Baselines

**Normal performance:**
- Slash command response: < 2 seconds
- Message analysis: < 3 seconds  
- Button URL generation: < 1 second
- Memory usage: 100-200MB
- CPU usage: < 50%

**Warning thresholds:**
- Response time > 5 seconds
- Memory usage > 400MB
- Error rate > 5%
- Service timeouts > 10%

## 🆘 Escalation Path

### Level 1: Self-Service

1. Check this troubleshooting guide
2. Test basic connectivity (`/log ping`)
3. Review recent logs for obvious errors
4. Verify configuration files

### Level 2: Admin Support

1. Contact your LogLens administrator
2. Provide specific error messages and reproduction steps
3. Include relevant logs and configuration details
4. Test in different channels/environments

### Level 3: Technical Support

1. Check GitHub issues for known problems
2. Review Slack API documentation for changes
3. Test individual service integrations
4. Consider upgrading LogLens version

## 📞 Support Resources

**LogLens Documentation:**
- Deployment guides in `deployment/`
- Service integration guides in `service-integration/`
- User guide in `team-onboarding/user-guide.md`

**External Resources:**
- Slack API Documentation: https://api.slack.com/docs
- Heroku Dev Center: https://devcenter.heroku.com
- Node.js Troubleshooting: https://nodejs.org/en/docs/guides

**Community Support:**
- Slack API Community: https://api.slack.com/community
- Stack Overflow: Tag questions with `slack-api` and `loglens`

---

## ✅ Issue Resolution Checklist

When resolving issues:

- [ ] Identify specific error messages and symptoms
- [ ] Test basic connectivity and permissions
- [ ] Review relevant configuration files
- [ ] Check deployment logs for errors
- [ ] Verify environment variables are correct
- [ ] Test individual service integrations
- [ ] Document solution for future reference
- [ ] Update configuration if needed
- [ ] Notify team of resolution and any changes

**Remember**: Most issues are configuration-related. Start with the basics (tokens, URLs, file formats) before investigating complex scenarios.
