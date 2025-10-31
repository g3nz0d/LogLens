# LogLens 🔍📊

A powerful Slack app for analyzing alerts and logs with instant access to Coralogix, Salesforce, and BackOffice tenants.

## ✨ Features

- **🎯 Smart Alert Analysis**: Automatically extracts tenant info, UIDs, and metadata from alert messages
- **🔗 One-Click Navigation**: Direct links to Coralogix logs, Salesforce accounts, and BackOffice tenants  
- **📋 UID Extraction**: Finds and enriches ObjectIds and UUIDs with account information
- **👻 Ephemeral Responses**: No channel noise - results are private to you
- **⚡ Message Shortcuts**: Right-click any message to analyze instantly

## 🚀 Quick Start

### For Users

1. **Analyze Any Alert Message:**
   - Right-click on any alert message
   - Select **⚡ More actions** → **Analyze with LogLens**
   - Get instant access to extracted UIDs and action buttons

2. **Use Slash Commands:**
   ```
   /log ping                    # Test if LogLens is working
   /log tenant: Acme Corp       # Analyze custom text
   ```

3. **What You Get:**
   - **🔍 Extracted UIDs**: All ObjectIds and UUIDs with enriched account info
   - **📋 Copy-Ready List**: Easy to copy UID list for further investigation
   - **🔗 Action Buttons**:
     - **Open Logs (2h)**: Coralogix with 2-hour filtered timeframe
     - **Salesforce**: Direct account/tenant search
     - **BackOffice**: Smart routing to tenant details

### Example Output

```
LogLens – Alert Analysis

Alert Type: coralogix-alert  •  Fields Found: 4
tenant_uid=60f1b2c3d4e5f6a7b8c9d0e1  account_name=Acme Corp  region=us-east-1  severity=critical
Source: coralogix  •  Event Type: alert

🔍 Extracted 2 UIDs:
1. 60f1b2c3d4e5f6a7b8c9d0e1 • Acme Prod • (Acme Corp) • AWS • us-east-1
2. a1b2c3d4e5f6a7b8c9d0e123 • TechCorp Dev • GCP • us-central1

📋 Copy UIDs:
60f1b2c3d4e5f6a7b8c9d0e1
a1b2c3d4e5f6a7b8c9d0e123

[Open Logs (2h)] [Salesforce] [BackOffice]
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Slack workspace with admin access

### Installation

1. **Clone and install:**
   ```bash
   git clone <your-repo>
   cd LogLens
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your tokens and URLs
   ```

3. **Set up account enrichment (optional):**
   ```bash
   cp config/accounts.csv.example config/accounts.csv
   # Edit with your actual account data
   ```

4. **Build and run:**
   ```bash
   npm run build
   npm run dev
   ```

### Slack App Configuration

1. **Create a Slack App** at https://api.slack.com/apps
2. **Enable Socket Mode** and generate App-Level Token
3. **Add OAuth Scopes**: `chat:write`, `commands`, `chat:write.public`
4. **Create Slash Command**: `/log` (leave Request URL blank)
5. **Add Message Shortcuts**:
   - Name: "Analyze with LogLens", Callback ID: `loglens_analyze`
6. **Install to workspace**

## 📁 Project Structure

```
LogLens/
├── src/
│   ├── app.ts          # Main Slack app with handlers
│   ├── extract.ts      # Alert parsing and field extraction
│   └── coralogix.ts    # Coralogix URL generation
├── config/
│   └── accounts.csv    # Account/tenant enrichment data
├── dist/               # Compiled JavaScript (auto-generated)
├── DEPLOYMENT.md       # Team deployment guide
└── README.md          # This file
```

## 🎨 Customization

### Adding New Alert Formats

Edit `src/extract.ts` to add new parsing patterns:

```typescript
const patterns: Record<string, RegExp[]> = {
  tenant_name: [
    /your-custom-pattern/i,
    // ... existing patterns
  ]
};
```

### Custom Service Integration

Add new action buttons in `src/app.ts`:

```typescript
const customBtn = safeButton('Custom Service', customServiceUrl(fields));
const actions = [openLogsBtn, sfBtn, boBtn, customBtn].filter(Boolean);
```

### Account Data Enrichment

Update `config/accounts.csv` with your tenant/account data:
- Supports ObjectIds (24-char hex) and UUIDs
- Enriches UIDs with human-readable names and metadata
- Automatically reloaded when the app restarts

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Heroku deployment
- Docker deployment  
- Self-hosted options
- Team access setup

## 🛠️ Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token | `xoxb-...` |
| `SLACK_APP_TOKEN` | App-Level Token | `xapp-...` |
| `SLACK_SIGNING_SECRET` | Signing Secret | `abc123...` |
| `CORALOGIX_BASE_URL` | Coralogix instance URL | `https://app.coralogix.com` |
| `SALESFORCE_OPP_URL` | Salesforce opportunities URL | `https://cyera.lightning.force.com/...` |
| `BACKOFFICE_BASE_URL` | BackOffice base URL | `https://smithy.internal.cyera.io` |
| `ACCOUNT_INDEX_PATH` | Path to accounts CSV | `./config/accounts.csv` |

## 🐛 Troubleshooting

**App not responding to commands:**
- Check if the service is running (`ps aux | grep tsx`)
- Verify Slack tokens in `.env` are correct
- Look for error logs in the console

**UIDs not being enriched:**
- Ensure `config/accounts.csv` exists and has correct format
- Check console for CSV loading messages
- Verify UIDs in CSV match format (24-char ObjectId or UUID)

**Links not working:**
- Verify environment variables for service URLs
- Check if URLs are accessible from your network
- Review console logs for URL generation details

## 📊 Monitoring

The app logs important events:
- `[LogLens] booting at [timestamp]` - Startup
- `[UID-INDEX] loaded rows: N` - Account data loaded
- `✅ Socket Mode started` - Ready for Slack events
- `[LogLens] BO candidates: {...}` - URL generation debug info

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your Slack workspace
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for faster incident response and log analysis.**
