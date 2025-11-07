# 🚀 LogLens Deployment Package

**Complete Guide for Organizations to Deploy Their Own LogLens Instance**

## 📋 Overview

This deployment package contains everything needed to set up LogLens in your organization's Slack workspace. LogLens is a powerful Slack app that analyzes alerts, extracts UIDs, and provides direct links to logs, Salesforce, BackOffice, and other business systems.

### What You'll Get
- **Smart Alert Analysis**: Automatically extracts tenant IDs, UIDs, and metadata
- **One-Click Navigation**: Direct links to Coralogix, Salesforce, BackOffice, ZenDesk
- **UID Extraction & Enrichment**: Finds ObjectIds/UUIDs with account information
- **Business Intelligence**: Licensing status, Salesforce AAR, account tiers
- **Channel-Specific Routing**: Different clients get their specific system links

## 🎯 Prerequisites

Before starting, ensure you have:

- **Slack Workspace Admin Access** - To create and configure the Slack app
- **Development Environment** - Node.js 18+, npm/yarn, git
- **Deployment Platform Access** - Heroku, Railway, AWS, or internal server access
- **Service Credentials** - Access to your organization's:
  - Coralogix instance
  - Salesforce org
  - BackOffice/internal systems
  - ZenDesk (optional)
  - Redash/analytics (optional)

## 📁 Package Contents

```
LogLens-Deployment-Package/
├── DEPLOYMENT_PACKAGE.md         # This file - main instructions
├── slack-app-setup/
│   ├── app-manifest.json         # Complete Slack app configuration
│   ├── permissions-guide.md      # Required scopes and permissions
│   └── testing-guide.md          # How to test your Slack app
├── config/templates/
│   ├── .env.template            # Environment variables template
│   ├── accounts.csv.template    # Account enrichment template
│   └── channel-mapping.json.template # Channel configuration template
├── deployment/
│   ├── heroku-deployment.md     # Heroku setup (recommended)
│   ├── railway-deployment.md    # Railway setup
│   ├── docker-deployment.md     # Docker/container setup
│   └── self-hosted-deployment.md # Internal server setup
├── service-integration/
│   ├── coralogix-setup.md       # Coralogix configuration
│   ├── salesforce-setup.md      # Salesforce integration
│   ├── backoffice-setup.md      # BackOffice integration
│   ├── zendesk-setup.md         # ZenDesk integration
│   └── redash-setup.md          # Redash/analytics setup
├── team-onboarding/
│   ├── user-guide.md            # End user instructions
│   ├── admin-guide.md           # Admin configuration guide
│   └── troubleshooting.md       # Common issues and solutions
└── examples/
    ├── sample-alerts/           # Example alert messages for testing
    └── configuration-examples/  # Real-world config examples
```

## 🚀 Quick Start Guide

### Step 1: Create Your Slack App

1. **Go to Slack API**: https://api.slack.com/apps
2. **Create New App**: "From an app manifest"
3. **Select Workspace**: Choose your organization's workspace
4. **Import Manifest**: Use `slack-app-setup/app-manifest.json`
5. **Install to Workspace**: Complete OAuth flow

### Step 2: Get Your LogLens Codebase

```bash
# Clone the LogLens repository
git clone https://github.com/your-org/loglens.git
cd loglens

# Install dependencies
npm install
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp config/templates/.env.template .env

# Edit with your specific values
# See service-integration/ guides for each service
nano .env
```

### Step 4: Configure Your Organization

```bash
# Set up account enrichment data
cp config/templates/accounts.csv.template config/accounts.csv
# Add your tenant/account UIDs and names

# Set up channel mappings
cp config/templates/channel-mapping.json.template config/channel-mapping.json  
# Map your Slack channels to specific clients/tenants
```

### Step 5: Deploy

Choose your preferred deployment method:

```bash
# Option 1: Heroku (Recommended)
# Follow deployment/heroku-deployment.md

# Option 2: Railway
# Follow deployment/railway-deployment.md

# Option 3: Docker
# Follow deployment/docker-deployment.md

# Option 4: Self-hosted
# Follow deployment/self-hosted-deployment.md
```

### Step 6: Test Your Setup

```bash
# In Slack, test the deployment:
/log ping
# Should respond with "LogLens is alive here"

# Test message analysis:
# Right-click any message → More actions → Analyze with LogLens
```

## 🔧 Configuration Deep Dive

### Environment Variables (Required)

| Variable | Purpose | Example |
|----------|---------|---------|
| `SLACK_BOT_TOKEN` | Bot authentication | `xoxb-9214793939475-...` |
| `SLACK_APP_TOKEN` | Socket mode token | `xapp-1-A09KHDA8APM-...` |
| `SLACK_SIGNING_SECRET` | Message verification | `358c83b58333046c...` |
| `CORALOGIX_BASE_URL` | Your Coralogix instance | `https://yourorg.coralogix.com` |
| `SALESFORCE_OPP_URL` | Salesforce opportunities | `https://yourorg.lightning.force.com/...` |
| `BACKOFFICE_BASE_URL` | Internal systems | `https://backoffice.yourorg.com` |

*See `config/templates/.env.template` for complete list*

### Channel Mapping

Map Slack channels to specific clients for targeted routing:

```json
{
  "channel_mappings": {
    "C1234567890": {
      "client_name": "Acme Corporation",
      "tenant_uid": "60f1b2c3d4e5f6a7b8c9d0e1",
      "salesforce_account_id": "0015500000ABC123",
      "backoffice_tenant_path": "/app/tenants-60f1b2c3d4e5f6a7b8c9d0e1"
    }
  }
}
```

### Account Enrichment

Enrich extracted UIDs with human-readable information:

```csv
account_uid,tenant_uid,account_name,tenant_name,cloud,region,platform
60f1b2c3d4e5f6a7b8c9d0e1,70f1b2c3d4e5f6a7b8c9d0e2,Acme Corp,Acme Prod,AWS,us-east-1,cyera
```

## 🎛️ Service Integrations

### Coralogix Setup
- Configure your Coralogix instance URL
- Set up team-specific routing
- Create saved queries for frequent searches
- **Guide**: `service-integration/coralogix-setup.md`

### Salesforce Integration  
- Connect to your Salesforce org
- Set up opportunity and case routing
- Configure account mapping
- **Guide**: `service-integration/salesforce-setup.md`

### BackOffice Systems
- Configure internal system URLs
- Set up tenant/account deep linking
- Configure search paths
- **Guide**: `service-integration/backoffice-setup.md`

### ZenDesk Integration
- Connect to ZenDesk instance
- Set up organization routing
- Configure ticket linking
- **Guide**: `service-integration/zendesk-setup.md`

## 👥 Team Rollout

### Phase 1: Admin Setup
1. Deploy LogLens with basic configuration
2. Test with internal team
3. Configure channel mappings for key clients
4. Verify all service integrations work

### Phase 2: Pilot Rollout
1. Enable for specific channels/teams
2. Train power users
3. Collect feedback and iterate
4. Document common use cases

### Phase 3: Organization-Wide
1. Enable for all channels
2. Conduct user training sessions
3. Share user guide with all teams
4. Set up monitoring and alerts

**Detailed guide**: `team-onboarding/admin-guide.md`

## 📊 Monitoring & Maintenance

### Health Checks
- Monitor deployment logs for errors
- Set up alerts for service downtime  
- Track usage metrics and performance
- Regular testing of integrations

### Updates
- Keep dependencies updated
- Monitor for Slack API changes
- Update account enrichment data regularly
- Review and update channel mappings

### Troubleshooting
Common issues and solutions:
- **Guide**: `team-onboarding/troubleshooting.md`

## 🔒 Security Considerations

### Access Control
- Use least-privilege principle for service accounts
- Regularly rotate API keys and tokens
- Monitor for unusual access patterns
- Audit user permissions quarterly

### Data Privacy
- LogLens uses ephemeral messages (no data persistence)
- No sensitive data is logged or stored
- All API calls use encrypted connections
- Consider your data residency requirements

### Network Security
- Whitelist deployment IP addresses in service configs
- Use VPN/private networks where available
- Enable proper firewall rules
- Monitor for suspicious network activity

## 🆘 Support

### Getting Help
1. **Check Documentation**: Start with the specific guides in this package
2. **Review Troubleshooting**: `team-onboarding/troubleshooting.md`
3. **Test Configuration**: Use the testing guides to validate setup
4. **Contact Admin**: Reach out to your LogLens deployment admin

### Common Issues
- Slack app permissions not configured correctly
- Environment variables missing or incorrect
- Service integrations not responding
- Channel mappings not working

### Reporting Issues
When reporting issues, include:
- Exact error messages
- Steps to reproduce
- Your environment configuration (without secrets)
- Relevant logs from deployment platform

---

## 📝 License & Attribution

MIT License - LogLens is open source and free to use.

**Built with ❤️ for faster incident response and log analysis.**

---

*Ready to get started? Continue to the next section based on your deployment choice:*
- **New to deployment?** → `deployment/heroku-deployment.md`
- **Already have infrastructure?** → `deployment/docker-deployment.md`  
- **Need Slack app help?** → `slack-app-setup/permissions-guide.md`
- **Configuring services?** → `service-integration/`
