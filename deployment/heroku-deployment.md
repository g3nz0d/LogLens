# 🚀 Heroku Deployment Guide (Recommended)

Deploy LogLens to Heroku for easy, scalable hosting with minimal setup.

## 🎯 Why Heroku?

- **Easy Setup**: Deploy with just a few commands
- **Automatic Scaling**: Handles traffic spikes automatically  
- **Built-in Monitoring**: Logs, metrics, and alerting included
- **Environment Management**: Easy config var management
- **Free Tier Available**: Start free, scale as needed
- **Git Integration**: Deploy directly from your repository

## 📋 Prerequisites

1. **Heroku Account**: Sign up at https://heroku.com
2. **Heroku CLI**: Download from https://devcenter.heroku.com/articles/heroku-cli
3. **Git**: Ensure git is installed and LogLens is in a git repository
4. **Slack App**: Complete slack-app-setup first to get your tokens

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

```bash
# Clone LogLens (if not already done)
git clone https://github.com/your-org/loglens.git
cd loglens

# Ensure you have package.json with proper start script
# This should already be configured in LogLens
```

### Step 2: Login to Heroku

```bash
# Login to Heroku CLI
heroku login
# Opens browser for authentication

# Verify login
heroku apps
```

### Step 3: Create Heroku App

```bash
# Create new Heroku app
heroku create your-loglens-app-name

# Or create with specific region
heroku create your-loglens-app-name --region us

# Verify app was created
heroku apps:info your-loglens-app-name
```

### Step 4: Configure Environment Variables

Set all required environment variables using the Heroku CLI:

```bash
# Required Slack tokens (get these from your Slack app)
heroku config:set SLACK_BOT_TOKEN="xoxb-your-bot-token" --app your-loglens-app-name
heroku config:set SLACK_APP_TOKEN="xapp-your-app-token" --app your-loglens-app-name  
heroku config:set SLACK_SIGNING_SECRET="your-signing-secret" --app your-loglens-app-name

# Required service integrations
heroku config:set CORALOGIX_BASE_URL="https://yourorg.coralogix.com" --app your-loglens-app-name
heroku config:set SALESFORCE_OPP_URL="https://yourorg.lightning.force.com/lightning/o/Opportunity/list?filterName=__Recent" --app your-loglens-app-name
heroku config:set BACKOFFICE_BASE_URL="https://backoffice.yourorg.com" --app your-loglens-app-name

# Optional integrations (add as needed)
heroku config:set ZENDESK_BASE_URL="https://yourorg.zendesk.com" --app your-loglens-app-name
heroku config:set LICENSING_API_BASE_URL="https://licensing-api.internal.yourorg.io" --app your-loglens-app-name

# Configuration file paths (use defaults)
heroku config:set ACCOUNT_INDEX_PATH="./config/accounts.csv" --app your-loglens-app-name
heroku config:set CHANNEL_MAPPING_PATH="./config/channel-mapping.json" --app your-loglens-app-name

# Production settings
heroku config:set NODE_ENV="production" --app your-loglens-app-name
```

### Step 5: Configure Your Data Files

Before deploying, ensure your configuration files are ready:

```bash
# Set up accounts data
cp config/templates/accounts.csv.template config/accounts.csv
# Edit config/accounts.csv with your actual account data

# Set up channel mappings  
cp config/templates/channel-mapping.json.template config/channel-mapping.json
# Edit config/channel-mapping.json with your actual channel mappings

# Commit these files
git add config/accounts.csv config/channel-mapping.json
git commit -m "Add configuration files for deployment"
```

### Step 6: Deploy to Heroku

```bash
# Add Heroku remote (if not already added)
heroku git:remote -a your-loglens-app-name

# Deploy to Heroku
git push heroku main

# Or deploy from a different branch
git push heroku your-branch:main
```

### Step 7: Verify Deployment

```bash
# Check build logs
heroku logs --tail --app your-loglens-app-name

# Look for these success messages:
# [LogLens] booting at [timestamp] - v1.2.0 ENHANCED
# [UID-INDEX] loaded rows: X from ./config/accounts.csv
# [CHANNEL-MAP] loaded mappings: Y channels  
# ✅ Socket Mode started. Waiting for Slack events…

# Check app status
heroku ps --app your-loglens-app-name
```

### Step 8: Test Your Deployment

In Slack:

1. **Test ping**: `/log ping` - Should respond "LogLens is alive here"
2. **Test analysis**: Right-click any message → "Analyze with LogLens"
3. **Verify buttons**: Check that all action buttons work (Logs, Salesforce, etc.)

## 🔧 Heroku-Specific Configuration

### Procfile

LogLens includes a `Procfile` for Heroku. If missing, create:

```
web: npm start
```

### Environment Management

**View all config vars:**
```bash
heroku config --app your-loglens-app-name
```

**Update a config var:**
```bash
heroku config:set VARIABLE_NAME="new-value" --app your-loglens-app-name
```

**Remove a config var:**
```bash
heroku config:unset VARIABLE_NAME --app your-loglens-app-name
```

### Scaling

**Check current dynos:**
```bash
heroku ps --app your-loglens-app-name
```

**Scale up (if needed):**
```bash
heroku ps:scale web=1 --app your-loglens-app-name
```

## 📊 Monitoring & Maintenance

### View Logs

```bash
# Real-time logs
heroku logs --tail --app your-loglens-app-name

# Recent logs
heroku logs --num 500 --app your-loglens-app-name

# Filter logs
heroku logs --source app --app your-loglens-app-name
```

### Health Monitoring

LogLens logs important health indicators:

- `[LogLens] booting at [timestamp]` - App starting
- `[UID-INDEX] loaded rows: N` - Account data loaded
- `[CHANNEL-MAP] loaded mappings: N channels` - Channel config loaded
- `✅ Socket Mode started` - Connected to Slack
- `[INFO] socket-mode:SocketModeClient:0 Now connected to Slack` - Slack connection established

### Performance Monitoring

Enable Heroku metrics dashboard:

```bash
# Open metrics dashboard
heroku open --app your-loglens-app-name
# Navigate to Metrics tab
```

Monitor:
- **Response times**: Should be < 3 seconds for most operations
- **Memory usage**: Node.js typically uses 100-200MB
- **Error rate**: Should be < 1%
- **Dyno load**: Should be < 1.0

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# Pull latest changes
git pull origin main

# Update configuration if needed
# Edit config/accounts.csv or config/channel-mapping.json

# Commit and deploy
git add .
git commit -m "Update LogLens configuration"
git push heroku main
```

### Configuration Updates

**Update account data:**
```bash
# Edit accounts.csv
vim config/accounts.csv

# Commit and redeploy
git add config/accounts.csv
git commit -m "Update account data"
git push heroku main
```

**Update channel mappings:**
```bash
# Edit channel mappings
vim config/channel-mapping.json

# Commit and redeploy  
git add config/channel-mapping.json
git commit -m "Update channel mappings"
git push heroku main
```

### Rolling Back

```bash
# View releases
heroku releases --app your-loglens-app-name

# Rollback to previous release
heroku rollback v123 --app your-loglens-app-name
```

## 💰 Cost Optimization

### Free Tier Usage

Heroku's free tier includes:
- 550-1000 dyno hours per month (verified accounts)
- Sleeps after 30 minutes of inactivity
- Wakes up automatically on first request

**For production use, upgrade to Hobby tier ($7/month) for:**
- No sleeping
- Custom domains
- Better performance

### Upgrade to Paid Tier

```bash
# Upgrade to Hobby tier
heroku ps:resize web=hobby --app your-loglens-app-name

# View pricing
heroku addons:plans
```

## 🚨 Troubleshooting

### Common Issues

**App not starting:**
```bash
# Check build logs
heroku logs --tail --app your-loglens-app-name

# Common fixes:
# - Ensure package.json has correct start script
# - Verify all required env vars are set
# - Check for syntax errors in config files
```

**Slack commands not working:**
```bash
# Verify environment variables
heroku config --app your-loglens-app-name | grep SLACK

# Check Socket Mode connection in logs
heroku logs --tail --app your-loglens-app-name | grep socket-mode
```

**Service integrations failing:**
```bash
# Test individual URLs
heroku run bash --app your-loglens-app-name
# Inside dyno: curl $CORALOGIX_BASE_URL

# Check network connectivity and firewall rules
```

### Debug Commands

```bash
# Open Heroku dashboard
heroku open --app your-loglens-app-name

# Run commands in production environment
heroku run bash --app your-loglens-app-name

# Restart app
heroku restart --app your-loglens-app-name

# View app info
heroku apps:info --app your-loglens-app-name
```

## 🎯 Success Checklist

- [ ] Heroku app created and configured
- [ ] All environment variables set correctly
- [ ] Configuration files committed and deployed
- [ ] App successfully built and started
- [ ] Slack Socket Mode connection established
- [ ] `/log ping` command responds correctly  
- [ ] Message shortcuts appear in Slack
- [ ] Action buttons work for all integrated services
- [ ] Account enrichment data loading correctly
- [ ] Channel mappings working for specific channels
- [ ] Monitoring and logging configured
- [ ] Team notified and testing completed

## 📞 Support

**Heroku Issues:**
- Heroku Dev Center: https://devcenter.heroku.com
- Heroku Support: https://help.heroku.com

**LogLens Issues:**
- Check `team-onboarding/troubleshooting.md`
- Review application logs for specific errors
- Verify service integrations individually

---

**Next Steps**: After successful deployment, proceed to `team-onboarding/user-guide.md` to train your team on using LogLens.
