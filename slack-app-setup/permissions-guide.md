# 🔐 Slack App Permissions & Setup Guide

Complete guide to setting up your LogLens Slack app with proper permissions and configuration.

## 📋 Step-by-Step Setup

### Step 1: Create Your Slack App

1. **Visit Slack API Console**
   - Go to https://api.slack.com/apps
   - Click "Create New App"
   - Select "From an app manifest"

2. **Choose Your Workspace**
   - Select the workspace where you want to install LogLens
   - You need admin permissions in this workspace

3. **Import App Manifest**
   - Copy the contents of `app-manifest.json`
   - Paste into the manifest editor
   - Click "Create App"

### Step 2: Configure OAuth & Permissions

The manifest sets up most permissions automatically, but verify these are enabled:

#### Bot Token Scopes (Required)
- `commands` - For `/log` slash command
- `chat:write` - To send ephemeral responses 
- `chat:write.public` - To respond in any channel (no need to be invited)

#### User Token Scopes (None Required)
LogLens doesn't need user token scopes - it only uses bot functionality.

### Step 3: Enable Socket Mode

1. **Go to Socket Mode page** in your app settings
2. **Enable Socket Mode** - Toggle this on
3. **Generate App-Level Token**:
   - Token Name: `LogLens Socket Token`
   - Scopes: `connections:write`
   - Copy the `xapp-...` token (you'll need this for `SLACK_APP_TOKEN`)

### Step 4: Configure Slash Commands

Verify the `/log` command is configured:
- **Command**: `/log`
- **Request URL**: Leave blank (using Socket Mode)
- **Short Description**: "Analyze text for tenant/account information"
- **Usage Hint**: `[alert text or 'ping' to test]`
- **Escape channels**: Unchecked

### Step 5: Configure Message Shortcuts

Verify the message shortcut is configured:
- **Name**: "Analyze with LogLens"
- **Callback ID**: `loglens_analyze`
- **Description**: "Extract UIDs and get direct links to logs, Salesforce, and BackOffice"

### Step 6: Install to Workspace

1. **Go to Install App page**
2. **Click "Install to Workspace"**
3. **Authorize the app** - Review permissions and approve
4. **Copy Bot Token** - Save the `xoxb-...` token (you'll need this for `SLACK_BOT_TOKEN`)

### Step 7: Get Signing Secret

1. **Go to Basic Information page**
2. **Find App Credentials section**
3. **Copy Signing Secret** - Save this (you'll need this for `SLACK_SIGNING_SECRET`)

## 🔑 Required Tokens Summary

After setup, you'll have three tokens for your `.env` file:

| Token | Starts With | Used For | Where to Find |
|-------|-------------|----------|---------------|
| **Bot Token** | `xoxb-` | App authentication | Install App → OAuth Tokens |
| **App Token** | `xapp-` | Socket Mode connection | Socket Mode → App-Level Tokens |
| **Signing Secret** | (hex string) | Request verification | Basic Information → App Credentials |

## 🔧 Advanced Configuration

### Custom App Icon

1. **Upload App Icon** (optional):
   - Go to Display Information
   - Upload a 512x512 PNG icon
   - Use LogLens logo or your organization's icon

### App Distribution

For organization-wide deployment:
- **Public Distribution**: Enable if you want to list in Slack App Directory
- **Org-Level Deployment**: Enable for easy installation across related workspaces
- **Install Links**: Generate install links for other admins

### App Settings

**Interactivity**: 
- Must be enabled for message shortcuts to work
- Request URL can be blank (using Socket Mode)

**Event Subscriptions**:
- Not required for LogLens
- Can be disabled to reduce complexity

## ⚠️ Troubleshooting Permissions

### Common Permission Issues

**"App not found" error:**
- Verify the app is installed in the correct workspace
- Check that bot token is correct and starts with `xoxb-`

**Slash command not working:**
- Ensure `/log` command is registered
- Verify Socket Mode is enabled
- Check that app token has `connections:write` scope

**Message shortcuts not appearing:**
- Confirm shortcut callback ID is `loglens_analyze`
- Verify interactivity is enabled
- Check that user has permission to use shortcuts

**Ephemeral messages not sending:**
- Ensure `chat:write` scope is enabled
- Check that bot token is valid
- Verify the app has access to the channel

### Permission Validation

Test each permission is working:

1. **Slash Command**: Try `/log ping` in any channel
2. **Message Shortcut**: Right-click any message → More actions → Look for "Analyze with LogLens"
3. **Bot Responses**: Check that ephemeral responses appear correctly

## 🔒 Security Best Practices

### Token Management
- **Never commit tokens to version control**
- **Store tokens as environment variables**
- **Rotate tokens if compromised**
- **Use different tokens for different environments**

### App Permissions
- **Use minimal required scopes**
- **Regularly audit app permissions**
- **Monitor app usage and access logs**
- **Disable unused features**

### Workspace Security
- **Only install in authorized workspaces**
- **Review app directory permissions**
- **Monitor for unauthorized installs**
- **Train users on proper usage**

## 📝 Configuration Checklist

Use this checklist to verify your Slack app setup:

- [ ] App created using provided manifest
- [ ] Socket Mode enabled with app-level token
- [ ] Bot installed to workspace with proper scopes
- [ ] All three tokens collected and secured
- [ ] `/log` slash command configured and working
- [ ] "Analyze with LogLens" message shortcut available
- [ ] Ephemeral responses working correctly
- [ ] App icon and branding configured (optional)
- [ ] App settings documented for team

## 📞 Support

**Need Help?**
- Check Slack API documentation: https://api.slack.com/docs
- Review common issues in `team-onboarding/troubleshooting.md`
- Test configuration using `slack-app-setup/testing-guide.md`

**Common Support Resources:**
- Slack API Community: https://api.slack.com/community
- Socket Mode Guide: https://api.slack.com/apis/connections/socket
- App Manifest Reference: https://api.slack.com/reference/manifests

---

**Next Step**: After completing Slack app setup, proceed to `config/templates/.env.template` to configure your environment variables.
