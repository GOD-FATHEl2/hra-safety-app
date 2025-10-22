# HRA Application Deployment Guide

## 🚀 Deployment Options

### 1. Azure App Service (Recommended)

#### Prerequisites
- Azure CLI installed
- Azure subscription
- Git repository

#### Quick Deployment
```bash
# Make script executable and run
chmod +x deploy-azure.sh
./deploy-azure.sh
```

#### Manual Steps
1. **Create Azure Resources**
   ```bash
   az group create --name hra-rg --location westeurope
   az appservice plan create --name hra-plan --resource-group hra-rg --sku B1 --is-linux
   az webapp create --name your-hra-app --resource-group hra-rg --plan hra-plan --runtime "NODE|20-lts"
   ```

2. **Configure Environment Variables**
   ```bash
   az webapp config appsettings set --name your-hra-app --resource-group hra-rg --settings \
     NODE_ENV=production \
     PORT=8080 \
     WEBSITES_PORT=8080 \
     AZURE_CLIENT_ID="your-client-id" \
     AZURE_TENANT_ID="your-tenant-id" \
     AZURE_CLIENT_SECRET="your-client-secret"
   ```

3. **Deploy Code**
   - Option A: GitHub Actions (automated)
   - Option B: Local Git deployment
   - Option C: Azure DevOps

### 2. Docker Container

#### Build and Run Locally
```bash
# Build the Docker image
docker build -t hra-app .

# Run the container
docker run -p 8080:8080 --env-file .env hra-app
```

#### Docker Compose (Development)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f hra-app

# Stop services
docker-compose down
```

#### Azure Container Instances
```bash
# Create container group
az container create --resource-group hra-rg --file azure-container-deployment.yml
```

### 3. Azure Container Registry

#### Push to ACR
```bash
# Create ACR
az acr create --resource-group hra-rg --name hraregistry --sku Basic

# Login to ACR
az acr login --name hraregistry

# Build and push
docker build -t hraregistry.azurecr.io/hra-app:latest .
docker push hraregistry.azurecr.io/hra-app:latest
```

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=production
PORT=8080
AZURE_CLIENT_ID=your-azure-app-client-id
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_CLIENT_SECRET=your-azure-app-secret
JWT_SECRET=your-jwt-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

### Azure AD App Registration
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Create new registration: "HRA Safety Application"
3. Set redirect URIs:
   - `https://your-app.azurewebsites.net/auth/redirect`
   - `http://localhost:8080/auth/redirect` (development)
4. Generate client secret
5. Configure API permissions as needed

## 📋 Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Azure AD app registration set up
- [ ] Database backup created
- [ ] SSL certificate ready (if custom domain)
- [ ] DNS configured (if custom domain)
- [ ] Monitoring alerts set up
- [ ] Security scan completed

## 🔍 Post-deployment Verification

1. **Health Check**: `https://your-app.azurewebsites.net/health`
2. **Application Load**: Verify login and basic functionality
3. **Mobile Responsiveness**: Test on different devices
4. **Performance**: Check load times and responsiveness
5. **Security**: Verify HTTPS and authentication flows

## 🚨 Troubleshooting

### Common Issues
1. **Application Error**: Check environment variables and logs
2. **MSAL Authentication Failed**: Verify Azure AD configuration
3. **Database Connection**: Ensure SQLite file permissions
4. **Mobile Menu Not Working**: Clear browser cache and test

### Useful Commands
```bash
# View Azure App Service logs
az webapp log tail --name your-hra-app --resource-group hra-rg

# Restart application
az webapp restart --name your-hra-app --resource-group hra-rg

# Check container status
docker-compose ps
docker logs hra-app
```

## 📊 Monitoring

### Azure Application Insights
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app hra-insights \
  --location westeurope \
  --resource-group hra-rg \
  --application-type web
```

### Log Analytics
- Application logs: Available in Azure Portal
- Performance metrics: CPU, Memory, Response time
- Error tracking: Automatic error detection and alerting

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS Only**: Enforce SSL/TLS in production
3. **CORS Configuration**: Restrict origins as needed
4. **Regular Updates**: Keep dependencies up to date
5. **Access Control**: Implement proper role-based access
6. **Audit Logs**: Monitor user activities and system events

## 📈 Scaling

### Horizontal Scaling
- Azure App Service: Scale out instances
- Container: Use Azure Container Apps or AKS

### Performance Optimization
- Enable compression
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets