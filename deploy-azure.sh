#!/bin/bash

# Azure App Service Deployment Script for HRA Application
# Prerequisites: Azure CLI installed and logged in

set -e

# Configuration variables
RESOURCE_GROUP="hra-rg"
APP_SERVICE_PLAN="hra-plan"
APP_NAME="hra-safety-app"
LOCATION="westeurope"
RUNTIME="NODE|20-lts"

echo "🚀 Starting Azure App Service deployment for HRA application..."

# Create resource group if it doesn't exist
echo "📦 Creating resource group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan
echo "🏗️  Creating App Service Plan: $APP_SERVICE_PLAN"
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B1 \
  --is-linux

# Create App Service
echo "🌐 Creating App Service: $APP_NAME"
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime $RUNTIME

# Configure App Settings
echo "⚙️  Configuring app settings..."
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    WEBSITES_PORT=8080 \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Enable logging
az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information

# Deploy from local Git (if git remote is configured)
echo "🔄 Setting up deployment..."
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

echo "✅ Azure App Service deployment setup complete!"
echo "🌍 Your app will be available at: https://$APP_NAME.azurewebsites.net"
echo ""
echo "📋 Next steps:"
echo "1. Configure your Azure AD app registration"
echo "2. Set up MSAL environment variables in Azure portal"
echo "3. Deploy your code using Git or GitHub Actions"
echo "4. Test the application"