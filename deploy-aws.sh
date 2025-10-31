#!/bin/bash

# LogLens AWS Elastic Beanstalk Deployment Script
# Run this after installing AWS CLI and EB CLI

echo "🚀 Deploying LogLens to AWS Elastic Beanstalk..."

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ EB CLI not found. Install it first:"
    echo "pip install awsebcli"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first"
    exit 1
fi

# Initialize Elastic Beanstalk (if not already done)
if [ ! -f .elasticbeanstalk/config.yml ]; then
    echo "📝 Initializing Elastic Beanstalk..."
    eb init --platform node.js --region us-east-1
fi

# Create environment variables file for EB
echo "📋 Setting up environment variables..."
cat > .ebextensions/01-environment.config << 'EOF'
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    ACCOUNT_INDEX_PATH: "./config/accounts.csv"
    CORALOGIX_BASE_URL: "https://app.coralogix.com"
    SALESFORCE_OPP_URL: "https://cyera.lightning.force.com/lightning/o/Opportunity/list?filterName=__Recent"
    BACKOFFICE_BASE_URL: "https://smithy.internal.cyera.io"
    BACKOFFICE_HOME_PATH: "/applications"
    BACKOFFICE_SEARCH_PATH: "/search"
    BACKOFFICE_TENANT_PREFIX: "/app/tenants-"
    BACKOFFICE_ACCOUNT_PREFIX: "/app/accounts-"
EOF

# Set sensitive environment variables via EB CLI
echo "🔐 Setting Slack tokens (you'll need to provide these)..."
echo "Please run these commands to set your Slack tokens:"
echo ""
echo "eb setenv SLACK_BOT_TOKEN=\"xoxb-9214793939475-9666595789445-yty8DzHS2Zj9UCLgZTb6vAxv\""
echo "eb setenv SLACK_APP_TOKEN=\"xapp-1-A09KHDA8APM-9666495986117-22f056a0d1aa2c0c828ecc19160b3e8416f9634cabd3a14980db623a04d54a20\""
echo "eb setenv SLACK_SIGNING_SECRET=\"358c83b58333046c887a0e30549b312d\""
echo ""
read -p "Press Enter after running the above commands..."

# Create environment if it doesn't exist
echo "🏗️  Creating/deploying to production environment..."
if ! eb status production &> /dev/null; then
    eb create production --instance-type t3.micro --single-instance
else
    echo "Environment exists, deploying updates..."
    eb deploy production
fi

# Show deployment status
echo ""
echo "✅ Deployment complete!"
echo "🔗 App URL: $(eb status production | grep CNAME | awk '{print $2}')"
echo "📊 Check status: eb status production"
echo "📝 View logs: eb logs production"
echo ""
echo "Your LogLens is now available to everyone in your Slack workspace! 🎉"
