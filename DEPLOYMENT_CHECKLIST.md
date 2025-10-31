# LogLens Deployment Checklist ✅

## Pre-Deployment Checklist

### ✅ Local Development Complete
- [x] App builds successfully (`npm run build`)
- [x] App starts and connects to Slack (`npm run dev`)
- [x] Environment variables configured in `.env`
- [x] Account enrichment CSV created (`config/accounts.csv`)

### ✅ Slack App Configuration
- [ ] Slack app created at https://api.slack.com/apps
- [ ] Socket Mode enabled with App-Level Token
- [ ] OAuth scopes added: `chat:write`, `commands`, `chat:write.public`
- [ ] Slash command `/log` created (Request URL: blank)
- [ ] Message shortcuts configured:
  - [ ] "Analyze with LogLens" → `loglens_analyze`
- [ ] App installed to workspace
- [ ] Bot token, app token, and signing secret copied to `.env`

## Deployment Options

### Option A: Heroku (Recommended for Teams)
- [ ] Heroku app created: `heroku create your-loglens-app`
- [ ] Environment variables set on Heroku (all variables from `.env`)
- [ ] Code pushed to Heroku: `git push heroku main`
- [ ] App is running: Check Heroku logs
- [ ] Test with `/log ping` in Slack

### Option B: Cloud Provider (AWS/Azure/GCP)
- [ ] Cloud service configured for Node.js
- [ ] Environment variables set in cloud config
- [ ] Code deployed and service is running
- [ ] Test with `/log ping` in Slack

### Option C: Self-Hosted Server
- [ ] Server has Node.js 18+ installed
- [ ] Code deployed to server (e.g., `/opt/loglens`)
- [ ] Dependencies installed: `npm install`
- [ ] App built: `npm run build`
- [ ] Systemd service created (optional, for auto-restart)
- [ ] Service is running and accessible
- [ ] Test with `/log ping` in Slack

## Post-Deployment Testing

### ✅ Basic Functionality
- [ ] `/log ping` responds with "LogLens is alive here"
- [ ] Right-click message → "Analyze with LogLens" works
- [ ] Enhanced card shows:
  - [ ] Alert analysis with extracted fields
  - [ ] UID extraction and enrichment
  - [ ] Copy-ready UID list
  - [ ] Three action buttons (Coralogix, Salesforce, BackOffice)

### ✅ Integration Testing
- [ ] **Coralogix button** opens correct filtered logs with 2h timeframe
- [ ] **Salesforce button** opens account/tenant search
- [ ] **BackOffice button** routes to correct tenant/account or search
- [ ] UID enrichment shows account names, regions, cloud providers

### ✅ Team Access
- [ ] All team members can see and use `/log` command
- [ ] Message shortcuts appear for all users
- [ ] Ephemeral responses work (only user sees the card)
- [ ] No channel spam from app responses

## Monitoring & Maintenance

### ✅ Health Monitoring
- [ ] App logs show successful startup messages:
  - `[LogLens] booting at [timestamp]`
  - `[UID-INDEX] loaded rows: N from ./config/accounts.csv`
  - `✅ Socket Mode started. Waiting for Slack events…`
  - `[INFO] socket-mode:SocketModeClient:0 Now connected to Slack`

### ✅ Account Data Management
- [ ] `config/accounts.csv` contains current tenant/account data
- [ ] CSV format is correct (see example file)
- [ ] Process for updating account data is documented for team

## Team Onboarding

### ✅ User Documentation
- [ ] README.md shared with team
- [ ] Quick usage guide distributed:
  ```
  LogLens Usage:
  1. Right-click any alert → "Analyze with LogLens"
  2. Or type: /log [your query]
  3. Get instant UIDs + action buttons for Coralogix/Salesforce/BackOffice
  ```

### ✅ Support Information
- [ ] Team knows how to report issues
- [ ] Deployment maintainer identified
- [ ] Process for updates documented

## Success Metrics

After 1 week of deployment, verify:
- [ ] Multiple team members are using the app
- [ ] Average time to access logs/systems reduced
- [ ] Fewer manual UID lookups in separate systems
- [ ] Positive team feedback on efficiency gains

## Emergency Procedures

### ✅ App Down Scenarios
- [ ] How to check if app is running
- [ ] How to restart the service
- [ ] Backup deployment process documented
- [ ] Team knows who to contact for issues

### ✅ Rollback Plan
- [ ] Previous version available if needed
- [ ] Quick rollback process documented
- [ ] Team communication plan for outages

---

## Final Verification

**Test this exact scenario:**

1. **Find an alert with tenant/account info and UIDs**
2. **Right-click → "Analyze with LogLens"**
3. **Verify you see:**
   - ✅ Alert type and extracted fields
   - ✅ List of UIDs with enriched account info
   - ✅ Copy-ready UID block
   - ✅ Three working action buttons

4. **Click each button and verify:**
   - ✅ Coralogix opens with proper filters and 2h timeframe
   - ✅ Salesforce opens with account/tenant search
   - ✅ BackOffice opens with correct tenant deep-link or search

**If all ✅ are checked, your LogLens deployment is successful! 🎉**
