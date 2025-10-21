# HRA Azure Deployment Guide

## 🚀 **Deploy HRA to Azure App Service**

### **Prerequisites:**
1. Azure CLI installed
2. Azure subscription access
3. Your app registration details (✅ Already have)

### **Step 1: Create Azure App Service**

```bash
# Login to Azure
az login

# Set your subscription (replace with your subscription ID)
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name "rg-hra-safety" --location "West Europe"

# Create App Service plan
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
```

### **Step 2: Configure Environment Variables**

```bash
# Set environment variables
az webapp config appsettings set \
  --name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --settings \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION=18.x \
    JWT_SECRET="your-super-secure-jwt-secret" \
    AZURE_CLIENT_ID="eb9865fe-5d08-43ed-8ee9-6cad32b74981" \
    AZURE_TENANT_ID="81fa766e-a349-4867-8bf4-ab35e250a08f" \
    PORT=8080
```

### **Step 3: Deploy Application**

```bash
# Zip your application
cd "C:\Users\NEKKOU\Downloads\HRA\HRA"
tar -czf hra-app.tar.gz --exclude=node_modules --exclude=.git *

# Deploy to Azure
az webapp deployment source config-zip \
  --name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --src hra-app.tar.gz
```

### **Step 4: Configure App Registration Redirect URIs**

Add these URLs to your Azure App Registration:
- **Web Redirect URI**: `https://hra-safety-app.azurewebsites.net/auth/callback`
- **SPA Redirect URI**: `https://hra-safety-app.azurewebsites.net`

### **Step 5: Set up Custom Domain (Optional)**

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --hostname "hra.yourcompany.com"
```

## 🔧 **Required Files for Deployment:**

1. **web.config** - IIS configuration
2. **.env.production** - Environment variables
3. **Dockerfile** - Container configuration (if using containers)
4. **azure-pipelines.yml** - CI/CD pipeline (optional)

## 🔒 **Security Considerations:**

1. **Store secrets in Azure Key Vault**
2. **Enable HTTPS only**
3. **Configure CORS properly**
4. **Set up Application Insights for monitoring**

## 📊 **Post-Deployment Tasks:**

1. **Test authentication flow**
2. **Verify database persistence**
3. **Check file upload functionality**
4. **Monitor application logs**

## 🎯 **Estimated Costs:**

- **Basic (B1) App Service**: ~$13/month
- **Standard (S1) App Service**: ~$56/month (recommended for production)
- **Storage**: ~$1-5/month depending on usage

## 📞 **Next Steps:**

1. Choose your deployment method
2. Run the Azure CLI commands
3. Configure your app registration redirect URIs
4. Test the deployed application

Would you like me to create the specific configuration files for your deployment?