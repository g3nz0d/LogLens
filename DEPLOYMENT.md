# LogLens Deployment Guide

## Making LogLens Available to Your Team

### Option 1: Cloud Deployment (Recommended for Teams)

**Deploy to Heroku (Simple):**

1. **Prepare for deployment:**
   ```bash
   # Add Heroku-compatible start script
   npm install --save-dev heroku
   ```

2. **Create Heroku app:**
   ```bash
   heroku create your-loglens-app
   ```

3. **Set environment variables on Heroku:**
   ```bash
   heroku config:set SLACK_BOT_TOKEN="your-bot-token"
   heroku config:set SLACK_APP_TOKEN="your-app-token"
   heroku config:set SLACK_SIGNING_SECRET="your-signing-secret"
   heroku config:set CORALOGIX_BASE_URL="https://app.coralogix.com"
   heroku config:set SALESFORCE_OPP_URL="your-salesforce-url"
   heroku config:set BACKOFFICE_BASE_URL="https://smithy.internal.cyera.io"
   # ... add all other env vars
   ```

4. **Deploy:**
   ```bash
   git add -A
   git commit -m "Ready for deployment"
   git push heroku main
   ```

**Deploy to AWS/Azure/GCP:**
- Use their respective Node.js hosting services
- Set environment variables in their config panels
- Ensure the service runs `npm start` command

### Option 2: Shared Server Deployment

**If you have a team server:**

1. **Clone the repository:**
   ```bash
   git clone <your-repo> /opt/loglens
   cd /opt/loglens
   npm install
   npm run build
   ```

2. **Create a systemd service:**
   ```bash
   sudo nano /etc/systemd/system/loglens.service
   ```
   
   ```ini
   [Unit]
   Description=LogLens Slack App
   After=network.target

   [Service]
   Type=simple
   User=node
   WorkingDirectory=/opt/loglens
   ExecStart=/usr/bin/npm start
   Restart=always
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start the service:**
   ```bash
   sudo systemctl enable loglens
   sudo systemctl start loglens
   ```

### Option 3: Docker Deployment

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**Deploy with Docker:**
```bash
docker build -t loglens .
docker run -d --name loglens --env-file .env -p 3000:3000 loglens
```

## Team Access Setup

### Slack App Distribution

Once deployed, your Slack app will be automatically available to all users in your workspace. Users can:

1. **Use Slash Commands:**
   - Type `/log ping` to test
   - Type `/log tenant_name: Acme Corp` to analyze

2. **Use Message Shortcuts:**
   - Right-click any message → **⚡ More actions** → **Analyze with LogLens**
   - This shows the enhanced card with UIDs extracted + action buttons

3. **No Installation Needed:**
   - Once you've deployed the app and it's running, all workspace members can use it
   - They don't need to install anything locally

### User Instructions for Your Team

Create a quick guide for your team:

```markdown
# How to Use LogLens

## Quick Analysis
1. Right-click any alert message
2. Select **⚡ More actions** → **Analyze with LogLens**
3. Get instant access to:
   - 🔍 Extracted UIDs with account info
   - 📋 Copy-friendly UID list
   - 🔗 Direct links to Coralogix, Salesforce, BackOffice

## Slash Command
- Type `/log ping` to test if LogLens is working
- Type `/log [your alert text]` to analyze custom text

## What You Get
- **Coralogix**: 2-hour time window with filtered logs
- **Salesforce**: Direct search for the account/tenant
- **BackOffice**: Smart routing to tenant details or search
```

## Environment Variables Reference

Make sure these are set in your deployment environment:

```bash
# Required Slack tokens
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token  
SLACK_SIGNING_SECRET=your-signing-secret

# Service URLs
CORALOGIX_BASE_URL=https://app.coralogix.com
SALESFORCE_OPP_URL=https://cyera.lightning.force.com/lightning/o/Opportunity/list?filterName=__Recent
BACKOFFICE_BASE_URL=https://smithy.internal.cyera.io

# BackOffice paths
BACKOFFICE_HOME_PATH=/applications
BACKOFFICE_SEARCH_PATH=/search
BACKOFFICE_TENANT_PREFIX=/app/tenants-
BACKOFFICE_ACCOUNT_PREFIX=/app/accounts-
BACKOFFICE_QUERY_SUFFIX=

# Optional: Account enrichment
ACCOUNT_INDEX_PATH=./config/accounts.csv
```

## Monitoring & Maintenance

### Health Check
Your deployed app will log:
- `[LogLens] booting at [timestamp]`
- `✅ Socket Mode started. Waiting for Slack events…`
- `[INFO] socket-mode:SocketModeClient:0 Now connected to Slack`

### Updating Account Data
To update the `accounts.csv` file:
1. Update the file in your repository
2. Redeploy or restart the service
3. The app will automatically reload the account index

### Troubleshooting
- Check logs for connection issues
- Verify environment variables are set correctly
- Test with `/log ping` command
- Ensure your Slack app has the right permissions and scopes
