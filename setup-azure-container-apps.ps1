#!/usr/bin/env pwsh
# Azure Container Apps Setup Script for HRA Safety Management System

param(
    [string]$ResourceGroup = "rg-hra-safety",
    [string]$Location = "West Europe",
    [string]$ContainerAppName = "hra-container-app",
    [string]$ContainerAppEnv = "hra-environment",
    [string]$RegistryName = "hraregistry",
    [string]$ImageName = "hra-app"
)

Write-Host "🚀 Setting up Azure Container Apps for HRA Safety Management System" -ForegroundColor Green
Write-Host "📍 Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "🌍 Location: $Location" -ForegroundColor Yellow

# Check if logged in to Azure
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Please login to Azure first: az login" -ForegroundColor Red
    exit 1
}

# Install Container Apps extension
Write-Host "🔧 Installing Azure Container Apps extension..." -ForegroundColor Yellow
az extension add --name containerapp --upgrade

# Create Resource Group
Write-Host "📦 Creating resource group: $ResourceGroup" -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location

# Create Azure Container Registry
Write-Host "🐳 Creating Azure Container Registry: $RegistryName" -ForegroundColor Yellow
az acr create --resource-group $ResourceGroup --name $RegistryName --sku Basic --admin-enabled true

# Get ACR credentials
$acrCreds = az acr credential show --name $RegistryName --output json | ConvertFrom-Json
$registryPassword = $acrCreds.passwords[0].value

Write-Host "✅ Registry created successfully!" -ForegroundColor Green
Write-Host "🔑 Registry Login Server: $RegistryName.azurecr.io" -ForegroundColor Cyan
Write-Host "👤 Registry Username: $RegistryName" -ForegroundColor Cyan

# Create Container Apps environment
Write-Host "🏗️ Creating Container Apps environment: $ContainerAppEnv" -ForegroundColor Yellow
az containerapp env create --name $ContainerAppEnv --resource-group $ResourceGroup --location $Location

# Create Container App
Write-Host "🌐 Creating Container App: $ContainerAppName" -ForegroundColor Yellow
az containerapp create `
    --name $ContainerAppName `
    --resource-group $ResourceGroup `
    --environment $ContainerAppEnv `
    --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" `
    --target-port 8080 `
    --ingress 'external' `
    --query properties.configuration.ingress.fqdn

Write-Host "`n🎉 Azure setup completed successfully!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up GitHub secrets in your repository:" -ForegroundColor White
Write-Host "   - AZURE_CREDENTIALS: Your Azure service principal credentials" -ForegroundColor Gray
Write-Host "   - REGISTRY_PASSWORD: $registryPassword" -ForegroundColor Gray
Write-Host "   - AZURE_CLIENT_ID: Your Azure AD app client ID" -ForegroundColor Gray
Write-Host "   - AZURE_TENANT_ID: Your Azure AD tenant ID" -ForegroundColor Gray
Write-Host "   - AZURE_CLIENT_SECRET: Your Azure AD app client secret" -ForegroundColor Gray
Write-Host "`n2. Push your code to GitHub main branch to trigger deployment" -ForegroundColor White
Write-Host "`n3. Monitor deployment in GitHub Actions tab" -ForegroundColor White

# Get the container app URL
$appUrl = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
Write-Host "`n🌐 Your app will be available at: https://$appUrl" -ForegroundColor Cyan

Write-Host "`n🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "View logs: az containerapp logs show --name $ContainerAppName --resource-group $ResourceGroup --follow" -ForegroundColor Gray
Write-Host "Update app: GitHub Actions will handle deployments automatically" -ForegroundColor Gray
Write-Host "Scale app: az containerapp update --name $ContainerAppName --resource-group $ResourceGroup --min-replicas 1 --max-replicas 3" -ForegroundColor Gray