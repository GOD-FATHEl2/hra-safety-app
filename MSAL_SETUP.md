# MSAL Authentication Setup Guide for HRA Safety App

## Overview
This guide will help you configure Microsoft Authentication Library (MSAL) for enterprise-grade authentication in your HRA Safety Application.

## Prerequisites
1. Azure AD tenant access
2. Application registration in Azure AD
3. Azure AD groups for role management

## Step 1: Azure AD App Registration ✅ COMPLETED

### ✅ Your App Registration Details
- **Name**: HRA
- **Application (client) ID**: `eb9865fe-5d08-43ed-8ee9-6cad32b74981`
- **Directory (tenant) ID**: `81fa766e-a349-4867-8bf4-ab35e250a08f`
- **Object ID**: `366a1807-4af9-4690-bd66-09123245484e`
- **Supported account types**: Multiple organizations

### ✅ Redirect URIs (CONFIGURED)
Your app registration should have these redirect URIs:
- **Production**: `https://hra-h8fea8c0gucwf7fe.canadacentral-01.azurewebsites.net/auth/callback`
- **Development**: `http://localhost:8080/auth/callback`

### Configure API Permissions
1. Go to API permissions in your app registration
2. Add permissions:
   - **Microsoft Graph** → Delegated permissions:
     - `User.Read` (to read user profile)
     - `GroupMember.Read.All` (to read user's group memberships)

### ⚠️ ADD CLIENT SECRET
1. Go to Certificates & secrets in your Azure Portal
2. Click "New client secret"
3. Add description: `HRA App Production Secret`
4. Set expiration: 24 months
5. **Copy the secret value immediately** (you won't see it again)
6. Add it to Azure App Service Configuration as `AZURE_CLIENT_SECRET`

## Step 2: Configure Azure AD Groups

### Create Security Groups
Create the following Azure AD security groups for role management:

1. **HRA-Administrators**
   - Members: System administrators
   - HRA Role: `admin`

2. **HRA-Superintendents**
   - Members: Superintendents
   - HRA Role: `superintendent`

3. **HRA-Supervisors**
   - Members: Supervisors
   - HRA Role: `supervisor`

4. **HRA-ArbetsLedare**
   - Members: Arbets Ledare (approval workflow)
   - HRA Role: `arbetsledare`

5. **HRA-Underhall**
   - Members: Maintenance staff
   - HRA Role: `underhall`

### Get Group Object IDs
1. Go to Azure Active Directory → Groups
2. Click on each group
3. Copy the **Object ID** from the overview page

## Step 3: Update Configuration Files

### Update .env file
```bash
# Azure AD / MSAL Configuration
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here

# Session Secret
SESSION_SECRET=your-super-secret-session-key-for-msal-authentication-at-least-32-chars

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-at-least-64-characters-long-for-production-use
```

### Update auth/msalConfig.js
Replace the example group IDs with your actual Azure AD group Object IDs:

```javascript
export const roleMapping = {
    'actual-admin-group-id': 'admin',
    'actual-superintendent-group-id': 'superintendent',
    'actual-supervisor-group-id': 'supervisor',
    'actual-arbetsledare-group-id': 'arbetsledare',
    'actual-underhall-group-id': 'underhall'
};
```

## Step 4: Azure App Service Configuration ✅ DEPLOYED

### ✅ Your App Service Details
- **App Name**: `hra`
- **URL**: `https://hra-h8fea8c0gucwf7fe.canadacentral-01.azurewebsites.net`
- **Resource Group**: HRA (Canada Central)
- **Runtime Stack**: Node 20-lts
- **Operating System**: Linux
- **Plan**: Premium0V3 (P0v3)

### ⚠️ Required Environment Variables
In Azure Portal → App Services → hra → Configuration → Application settings, add:

```
AZURE_TENANT_ID = 81fa766e-a349-4867-8bf4-ab35e250a08f
AZURE_CLIENT_ID = eb9865fe-5d08-43ed-8ee9-6cad32b74981
AZURE_CLIENT_SECRET = [GET FROM AZURE PORTAL CERTIFICATES & SECRETS]
SESSION_SECRET = [GENERATE 32+ CHARACTER RANDOM STRING]
JWT_SECRET = [GENERATE 64+ CHARACTER RANDOM STRING]
NODE_ENV = production
```

### ✅ Redirect URIs Updated
Update your App Registration redirect URIs to include:
- `https://hra-h8fea8c0gucwf7fe.canadacentral-01.azurewebsites.net/auth/callback`

## Step 5: Testing

### Test Users
1. Assign test users to appropriate Azure AD groups
2. Test login with each role:
   - Admin user → should access all features
   - Supervisor → should access dashboard
   - Arbetsledare → should handle approvals
   - Underhall → should create assessments

### Verification Steps
1. **Login Flow**: Users click "Logga in med Microsoft"
2. **Redirect**: Redirected to Microsoft login
3. **Group Check**: System reads user's group memberships
4. **Role Assignment**: User gets HRA role based on group
5. **Database**: User record created/updated with Azure ID

## Features Enabled

✅ **Single Sign-On (SSO)** with Microsoft accounts  
✅ **Automatic Role Assignment** based on Azure AD groups  
✅ **Seamless User Management** - no manual user creation  
✅ **Enterprise Security** with Microsoft's authentication  
✅ **Audit Trail** with Azure AD login logs  
✅ **Multi-Factor Authentication** support  

## Troubleshooting

### Common Issues
1. **"Authentication failed"**: Check client secret expiration
2. **"Wrong role assigned"**: Verify user is in correct Azure AD group
3. **"Can't read groups"**: Ensure `GroupMember.Read.All` permission is granted
4. **"Redirect error"**: Verify redirect URI matches exactly

### Support
- Check Azure AD sign-in logs for authentication issues
- Monitor App Service logs for server-side errors
- Use browser developer tools for client-side debugging

## Benefits of MSAL Implementation

- **Enterprise Security**: Leverages Microsoft's enterprise-grade authentication
- **Zero Password Management**: No need to manage passwords in your app
- **Compliance**: Meets enterprise security requirements
- **User Experience**: Familiar Microsoft login experience
- **Scalability**: Handles thousands of users without performance impact
- **Audit**: Complete audit trail through Azure AD