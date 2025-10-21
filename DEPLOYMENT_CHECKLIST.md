# 🚀 MSAL Configuration Checklist

## ✅ Completed
- [x] Azure AD App Registration created
- [x] Application configured with correct IDs
- [x] Code updated with your Azure credentials
- [x] Production URLs configured
- [x] GitHub deployment triggered

## ⚠️ Action Required (Complete These Steps)

### 1. Add Client Secret to Azure App Service
1. Go to **Azure Portal** → **Azure Active Directory** → **App registrations** → **HRA**
2. Click **Certificates & secrets** → **New client secret**
3. Description: `HRA Production Secret`
4. Expiration: 24 months
5. **Copy the secret value immediately**
6. Go to **Azure Portal** → **App Services** → **hra** → **Configuration**
7. Add new Application Setting:
   - Name: `AZURE_CLIENT_SECRET`
   - Value: [The secret you just copied]

### 2. Generate Secure Secrets
Generate secure random strings for:
- `JWT_SECRET` (64+ characters)
- `SESSION_SECRET` (32+ characters)

Add them to Azure App Service Configuration.

### 3. Configure Azure AD Permissions
1. Go to **Azure Portal** → **Azure Active Directory** → **App registrations** → **HRA**
2. Click **API permissions** → **Add a permission**
3. Select **Microsoft Graph** → **Delegated permissions**
4. Add these permissions:
   - `User.Read`
   - `GroupMember.Read.All`
5. Click **Grant admin consent**

### 4. Add Redirect URI
1. In your Azure AD App Registration → **Authentication**
2. Add redirect URI:
   - Type: **Web**
   - URI: `https://hra-h8fea8c0gucwf7fe.canadacentral-01.azurewebsites.net/auth/callback`

### 5. Create Azure AD Groups (Optional)
Create these security groups for role-based access:
- `HRA-Administrators` (admin role)
- `HRA-Superintendents` (superintendent role)
- `HRA-Supervisors` (supervisor role)
- `HRA-ArbetsLedare` (arbetsledare role)
- `HRA-Underhall` (underhall role)

Get the Object IDs and update `auth/msalConfig.js`

## 🎯 Testing Steps

### 1. Test Traditional Login
- URL: https://hra-h8fea8c0gucwf7fe.canadacentral-01.azurewebsites.net
- Username: `admin` / Password: `admin123`
- Username: `ledare` / Password: `ledare123`

### 2. Test Microsoft Login
- Click "Logga in med Microsoft"
- Sign in with your Azure AD account
- Should automatically assign role based on group membership

## 🔐 Security Best Practices

1. **Never commit real secrets** to Git
2. **Use Azure Key Vault** for production secrets
3. **Enable Application Insights** for monitoring
4. **Configure custom domain** with SSL certificate
5. **Set up backup strategy** for SQLite database

## 📞 Support
If you encounter issues:
1. Check Azure AD sign-in logs
2. Check App Service logs
3. Verify all environment variables are set
4. Ensure API permissions are granted with admin consent

Your HRA Safety App is now ready for enterprise deployment! 🎉