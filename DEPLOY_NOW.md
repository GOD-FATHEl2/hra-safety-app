# 🚀 Manual Azure Deployment Guide for HRA Application

## Current Status: ✅ READY FOR DEPLOYMENT

### 📋 What's Been Completed:
- ✅ **Code Fixed**: Form submission working, buttons visible, authentication improved
- ✅ **Security**: All secrets removed from git history
- ✅ **Docker**: Container builds successfully
- ✅ **GitHub Actions**: Automated deployment workflow configured
- ✅ **Production Ready**: All issues resolved

## 🎯 Deployment Options (Choose One)

### Option 1: Automated Deployment via GitHub Actions (Recommended)

#### Prerequisites:
1. **Azure Account** with active subscription
2. **Azure CLI** access (can use Azure Cloud Shell)

#### Steps:

**Step 1: Setup Azure Resources**
```bash
# Use Azure Cloud Shell (shell.azure.com) to avoid local CLI issues

# Create resource group
az group create --name rg-hra-safety --location westeurope

# Create Azure Container Registry
az acr create --resource-group rg-hra-safety --name hraregistry --sku Basic --admin-enabled true

# Get registry credentials
az acr credential show --name hraregistry

# Install Container Apps extension
az extension add --name containerapp

# Create Container Apps environment
az containerapp env create --name hra-environment --resource-group rg-hra-safety --location westeurope
```

**Step 2: Configure GitHub Secrets**
Go to: `https://github.com/GOD-FATHEl2/hra-safety-app/settings/secrets/actions`

Add these secrets:
- `REGISTRY_PASSWORD`: [From ACR credentials above]
- `AZURE_CLIENT_ID`: [Your Azure AD app client ID]
- `AZURE_TENANT_ID`: [Your Azure AD tenant ID] 
- `AZURE_CLIENT_SECRET`: [Your Azure AD app client secret]
- `AZURE_CREDENTIALS`: [Service principal JSON - see below]

**Step 3: Create Service Principal**
```bash
# In Azure Cloud Shell, replace {subscription-id} with your actual subscription ID
az ad sp create-for-rbac --name "hra-deploy" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/rg-hra-safety --sdk-auth
```
Copy the entire JSON output to `AZURE_CREDENTIALS` secret.

**Step 4: Deploy**
```bash
git push origin main
```
The GitHub Actions will automatically deploy! 🚀

---

### Option 2: Manual Container Apps Deployment

If GitHub Actions fails, deploy manually:

**Step 1: Build and Push Docker Image**
```bash
# Login to registry
az acr login --name hraregistry

# Build and push
docker build -t hraregistry.azurecr.io/hra-app:latest .
docker push hraregistry.azurecr.io/hra-app:latest
```

**Step 2: Create Container App**
```bash
az containerapp create \
  --name hra-container-app \
  --resource-group rg-hra-safety \
  --environment hra-environment \
  --image hraregistry.azurecr.io/hra-app:latest \
  --target-port 8080 \
  --ingress 'external' \
  --registry-server hraregistry.azurecr.io \
  --registry-username hraregistry \
  --registry-password [YOUR_REGISTRY_PASSWORD] \
  --env-vars NODE_ENV=production PORT=8080 AZURE_CLIENT_ID=[YOUR_CLIENT_ID] AZURE_TENANT_ID=[YOUR_TENANT_ID] AZURE_CLIENT_SECRET=[YOUR_CLIENT_SECRET]
```

---

### Option 3: Alternative - Azure App Service

If Container Apps doesn't work:

```bash
# Create App Service Plan
az appservice plan create --name hra-plan --resource-group rg-hra-safety --sku B1 --is-linux

# Create Web App with Docker
az webapp create --name hra-safety-app --resource-group rg-hra-safety --plan hra-plan --deployment-container-image-name hraregistry.azurecr.io/hra-app:latest

# Configure app settings
az webapp config appsettings set --name hra-safety-app --resource-group rg-hra-safety --settings NODE_ENV=production AZURE_CLIENT_ID=[YOUR_CLIENT_ID] AZURE_TENANT_ID=[YOUR_TENANT_ID] AZURE_CLIENT_SECRET=[YOUR_CLIENT_SECRET]
```

## 🔧 Post-Deployment Steps

### 1. Update Azure AD Redirect URIs
Add your production URL to Azure AD app registration:
- `https://[your-app-url]/client/`
- `https://[your-app-url]/client/index.html`
- `https://[your-app-url]/`

### 2. Test the Application
1. Visit your production URL
2. Test Microsoft login
3. Create a risk assessment
4. Verify all functionality

### 3. Monitor the Application
```bash
# View logs
az containerapp logs show --name hra-container-app --resource-group rg-hra-safety --follow

# Check status
az containerapp show --name hra-container-app --resource-group rg-hra-safety
```

## 🌐 Expected Production URLs

After deployment, your app will be available at:
- **Container Apps**: `https://hra-container-app.[random].[region].azurecontainerapps.io`
- **App Service**: `https://hra-safety-app.azurewebsites.net`

## 🎉 Success Indicators

You'll know deployment worked when:
- ✅ App loads at production URL
- ✅ Microsoft login popup works
- ✅ Forms can be submitted successfully
- ✅ Admin users can manage assessments
- ✅ PDF generation works
- ✅ No console errors

## 🚨 If You Need Help

1. **GitHub Actions failing**: Check the Actions tab for error logs
2. **Container not starting**: Check container logs in Azure Portal
3. **Authentication issues**: Verify Azure AD redirect URIs
4. **Database problems**: Container will auto-create SQLite database

## 💡 Quick Start Recommendation

**For fastest deployment:**
1. Use Azure Cloud Shell (shell.azure.com)
2. Run the commands from Option 1 above
3. Set up GitHub secrets
4. Push to main branch
5. Let GitHub Actions handle the rest! 

Your HRA application is production-ready and just needs to be deployed! 🚀