# 🚀 HRA Application - Azure Deployment Guide

## ✅ Prerequisites Complete
- ✅ Code saved and pushed to GitHub
- ✅ Docker image builds successfully
- ✅ Form submission issues fixed
- ✅ Authentication working
- ✅ All security issues resolved

## 🎯 Deployment Strategy: Azure Container Apps

We're using Azure Container Apps for deployment because it's:
- 🔄 **Automatic scaling** based on traffic
- 💰 **Cost-effective** with pay-per-use model
- 🐳 **Container-native** with built-in CI/CD
- 🔒 **Secure** with managed certificates
- 📊 **Easy monitoring** and logging

## 📋 Step-by-Step Deployment

### Step 1: Azure Login & Setup
```powershell
# Login to Azure (will open browser)
az login

# Run the setup script
.\setup-azure-container-apps.ps1
```

### Step 2: Configure GitHub Secrets
Go to your GitHub repository → Settings → Secrets and Variables → Actions

Add these secrets:
- `AZURE_CREDENTIALS`: Azure service principal (see below)
- `REGISTRY_PASSWORD`: From Azure Container Registry
- `AZURE_CLIENT_ID`: Your Azure AD app client ID
- `AZURE_TENANT_ID`: Your Azure AD tenant ID
- `AZURE_CLIENT_SECRET`: Your Azure AD app client secret

### Step 3: Create Azure Service Principal
```bash
az ad sp create-for-rbac --name "hra-deploy" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/rg-hra-safety --sdk-auth
```

Copy the entire JSON output to `AZURE_CREDENTIALS` secret.

### Step 4: Deploy
Simply push to the main branch:
```bash
git push origin main
```

The GitHub Actions workflow will automatically:
1. 🏗️ Build the Docker image
2. 📤 Push to Azure Container Registry
3. 🚀 Deploy to Azure Container Apps
4. ✅ Verify the deployment

## 🌐 Production URLs

After deployment, your app will be available at:
- **Production**: `https://hra-container-app.{random}.{location}.azurecontainerapps.io`
- **Admin Panel**: `https://your-app-url.com/client/index.html`

## 🔧 Post-Deployment Configuration

### Azure AD App Registration
Update your Azure AD app with production redirect URIs:
```
https://your-production-url.azurecontainerapps.io/client/
https://your-production-url.azurecontainerapps.io/client/index.html
https://your-production-url.azurecontainerapps.io/
```

### Environment Variables
The following are automatically configured:
- `NODE_ENV=production`
- `PORT=8080`
- `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`

### Database
- SQLite database will be created automatically
- Initial admin users will be set up
- Uploaded files stored in persistent volumes

## 📊 Monitoring & Management

### View Application Logs
```bash
az containerapp logs show --name hra-container-app --resource-group rg-hra-safety --follow
```

### Scale the Application
```bash
az containerapp update --name hra-container-app --resource-group rg-hra-safety --min-replicas 1 --max-replicas 5
```

### Update Configuration
```bash
az containerapp update --name hra-container-app --resource-group rg-hra-safety --set-env-vars "NEW_VAR=value"
```

## 🔒 Security Features

### Automatic HTTPS
- ✅ Managed SSL certificates
- ✅ Automatic renewal
- ✅ HTTP to HTTPS redirect

### Network Security
- ✅ Private container registry
- ✅ Managed identity authentication
- ✅ Network isolation options

### Application Security
- ✅ Non-root container user
- ✅ Secret management via Azure Key Vault
- ✅ MSAL enterprise authentication

## 🚨 Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Ensure Azure permissions are correct

### App Not Loading
1. Check container logs: `az containerapp logs show...`
2. Verify environment variables
3. Check Azure AD redirect URIs

### Database Issues
1. Database automatically recreates on container restart
2. Check file permissions for SQLite
3. Verify data directory is writable

## 📈 Performance Optimization

### Container Scaling
- **Min Replicas**: 1 (always running)
- **Max Replicas**: 3-5 (auto-scale based on load)
- **CPU/Memory**: Automatically managed

### Database Performance
- SQLite with WAL mode for better concurrency
- Automatic database optimization
- Regular maintenance built-in

## 💰 Cost Management

### Container Apps Pricing
- **Pay per use**: Only pay when app is running
- **Free tier**: 180,000 vCPU-seconds/month free
- **Estimated cost**: $10-50/month depending on usage

### Optimization Tips
- Use auto-scaling to reduce costs during low usage
- Monitor resource usage in Azure Portal
- Set up cost alerts

## 🎉 Deployment Complete!

Your HRA Safety Management System is now:
- ✅ **Deployed** to Azure Container Apps
- ✅ **Secured** with enterprise authentication
- ✅ **Monitored** with automatic logging
- ✅ **Scalable** based on demand
- ✅ **Cost-optimized** with pay-per-use model

Visit your production URL and start using the system! 🚀