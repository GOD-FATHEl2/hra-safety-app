# 🚀 Manual Azure Deployment Guide for HRA Application

## Option 1: Azure Portal Deployment (Easiest)

### Step 1: Prepare Your Application
1. **Compress your HRA folder**:
   - Right-click on `C:\Users\NEKKOU\Downloads\HRA\HRA` folder
   - Select "Send to" → "Compressed (zipped) folder" 
   - Name it `hra-app.zip`

### Step 2: Create Azure App Service
1. **Go to Azure Portal**: https://portal.azure.com
2. **Login** with your Azure account
3. **Click "Create a resource"**
4. **Search for "App Service"** and click Create

### Step 3: Configure App Service
**Basic Settings:**
- **Subscription**: Your subscription
- **Resource Group**: Create new → `rg-hra-safety`
- **Name**: `hra-safety-app` (must be globally unique)
- **Publish**: Code
- **Runtime stack**: Node.js 18 LTS
- **Operating System**: Linux
- **Region**: West Europe (or closest to you)

**App Service Plan:**
- **Pricing Tier**: Basic B1 ($13/month) or Standard S1 ($56/month)

### Step 4: Deploy Your Code
1. **After creation, go to your App Service**
2. **Go to "Deployment Center"** in left menu
3. **Choose "Local Git"** or "ZIP Deploy"
4. **For ZIP Deploy**:
   - Click "Browse" and select your `hra-app.zip`
   - Click "Upload and Deploy"

### Step 5: Configure Environment Variables
**Go to "Configuration" → "Application Settings"** and add:

```
NODE_ENV = production
WEBSITE_NODE_DEFAULT_VERSION = 18.x
JWT_SECRET = your-super-secure-jwt-secret-change-this
AZURE_CLIENT_ID = eb9865fe-5d08-43ed-8ee9-6cad32b74981
AZURE_TENANT_ID = 81fa766e-a349-4867-8bf4-ab35e250a08f
PORT = 8080
ALLOWED_ORIGINS = https://hra-safety-app.azurewebsites.net
MAX_FILE_SIZE = 52428800
```

### Step 6: Update App Registration
**In Azure Portal → App Registrations → HRA**:
1. **Go to "Authentication"**
2. **Add Redirect URIs**:
   - **Web**: `https://hra-safety-app.azurewebsites.net/auth/callback`
   - **Single-page application**: `https://hra-safety-app.azurewebsites.net`

### Step 7: Add Client Secret
1. **In App Registration → Certificates & secrets**
2. **Create new client secret**
3. **Copy the secret value**
4. **Add to App Service Configuration**:
   - `AZURE_CLIENT_SECRET = your-copied-secret`

---

## Option 2: Azure CLI (After fixing permissions)

### Fix Azure CLI Permissions:
1. **Run PowerShell as Administrator**
2. **Run**: `az extension remove --name aks-preview`
3. **Run**: `az login`

### Then run these commands:
```bash
# Create Resource Group
az group create --name "rg-hra-safety" --location "West Europe"

# Create App Service Plan
az appservice plan create \
  --name "plan-hra-safety" \
  --resource-group "rg-hra-safety" \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --plan "plan-hra-safety" \
  --runtime "NODE:18-lts"

# Configure App Settings
az webapp config appsettings set \
  --name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --settings \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION=18.x \
    JWT_SECRET="your-secure-secret" \
    AZURE_CLIENT_ID="eb9865fe-5d08-43ed-8ee9-6cad32b74981" \
    AZURE_TENANT_ID="81fa766e-a349-4867-8bf4-ab35e250a08f" \
    PORT=8080

# Deploy Code (after creating ZIP file)
az webapp deployment source config-zip \
  --name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --src hra-app.zip
```

---

## Option 3: GitHub Deployment

### Step 1: Create GitHub Repository
1. **Go to GitHub.com**
2. **Create new repository**: `hra-safety-app`
3. **Upload your HRA files**

### Step 2: Connect to Azure
1. **In Azure App Service → Deployment Center**
2. **Choose "GitHub"**
3. **Authorize and select your repository**
4. **Configure build settings**: Node.js

---

## 🔧 **Post-Deployment Checklist**

### 1. Test Application
- **Visit**: `https://hra-safety-app.azurewebsites.net`
- **Health Check**: `https://hra-safety-app.azurewebsites.net/health`

### 2. Test Login
- **Username**: `admin`
- **Password**: `admin123`

### 3. Verify Features
- ✅ Login works
- ✅ Navigation works
- ✅ Create assessment
- ✅ Notification system
- ✅ Image upload
- ✅ PDF generation

### 4. Security Hardening
- **Change default passwords**
- **Use Azure Key Vault for secrets**
- **Enable Application Insights**
- **Set up monitoring alerts**

---

## 💰 **Estimated Costs**

- **Basic (B1)**: ~$13/month
- **Standard (S1)**: ~$56/month (recommended for production)
- **Storage**: ~$1-5/month

---

## 🚨 **Important Notes**

1. **Change JWT_SECRET** to a secure random string
2. **Update default user passwords** after first login
3. **Add your client secret** from Azure App Registration
4. **Test all functionality** before going live
5. **Set up backup strategy** for your data

Your HRA Safety Management System will be live and ready for enterprise use! 🎉