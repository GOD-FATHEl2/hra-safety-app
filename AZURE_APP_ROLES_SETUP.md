# 🔐 Azure AD App Roles Setup for HRA MSAL Authentication

## 📋 **STEP-BY-STEP GUIDE TO ADD APP ROLES**

This guide will help you configure app roles in your Azure AD application to work seamlessly with your HRA system's 5-tier role structure.

---

## 🎯 **PREREQUISITE: Your HRA Role Structure**

Your application has these 5 roles that need to be mapped:
- **🔴 admin** - Full system access (3 users)
- **🟠 superintendent** - Department oversight (4 users)  
- **🟡 arbetsledare** - Work leaders/shift coordinators (4 users)
- **🟢 supervisor** - Team management (8 users)
- **🔵 underhall** - Maintenance staff (15 users)

---

## 🚀 **PART 1: ACCESS AZURE PORTAL**

### **Step 1: Login to Azure Portal**
1. Go to **[Azure Portal](https://portal.azure.com)**
2. Sign in with your Azure account
3. Navigate to **"Azure Active Directory"** or search for **"Azure AD"**

### **Step 2: Find Your App Registration**
1. In Azure AD, click **"App registrations"** in the left menu
2. Find your HRA application (the one you mentioned earlier)
3. Click on your app to open its details

---

## ⚙️ **PART 2: CREATE APP ROLES**

### **Step 3: Navigate to App Roles**
1. In your app registration, click **"App roles"** in the left sidebar
2. Click **"+ Create app role"** button

### **Step 4: Create Admin Role**
Create the first role with these settings:
```
Display name: HRA Admin
Description: Full system access for HRA administrators
Allowed member types: Users/Groups
Value: admin
Do you want to enable this app role? ✅ Yes
```
Click **"Apply"**

### **Step 5: Create Superintendent Role**
Click **"+ Create app role"** again:
```
Display name: HRA Superintendent  
Description: Department oversight and high-level approval authority
Allowed member types: Users/Groups
Value: superintendent
Do you want to enable this app role? ✅ Yes
```
Click **"Apply"**

### **Step 6: Create Arbetsledare Role**
Click **"+ Create app role"** again:
```
Display name: HRA Arbetsledare
Description: Work leaders and shift coordinators
Allowed member types: Users/Groups
Value: arbetsledare
Do you want to enable this app role? ✅ Yes
```
Click **"Apply"**

### **Step 7: Create Supervisor Role**
Click **"+ Create app role"** again:
```
Display name: HRA Supervisor
Description: Team management and assessment approval
Allowed member types: Users/Groups
Value: supervisor
Do you want to enable this app role? ✅ Yes
```
Click **"Apply"**

### **Step 8: Create Underhall Role**
Click **"+ Create app role"** again:
```
Display name: HRA Underhall
Description: Maintenance staff and operational users
Allowed member types: Users/Groups
Value: underhall
Do you want to enable this app role? ✅ Yes
```
Click **"Apply"**

---

## 👥 **PART 3: ASSIGN USERS TO ROLES**

### **Step 9: Go to Enterprise Applications**
1. Navigate back to **Azure Active Directory**
2. Click **"Enterprise applications"** in the left menu
3. Search for and click on your HRA application

### **Step 10: Access Users and Groups**
1. Click **"Users and groups"** in the left sidebar
2. Click **"+ Add user/group"**

### **Step 11: Assign Admin Users**
For each admin user (admin.main, admin.safety, admin.it):
1. Click **"Add assignment"**
2. Select **"Users"** → Search for the user → **"Select"**
3. Select **"Role"** → Choose **"HRA Admin"** → **"Select"**
4. Click **"Assign"**

### **Step 12: Assign Other Roles**
Repeat the process for:

**Superintendents:**
- Assign **"HRA Superintendent"** role to:
  - super.production, super.maintenance, super.quality, super.logistics

**Arbetsledare:**
- Assign **"HRA Arbetsledare"** role to:
  - workleader.day, workleader.evening, workleader.night, workleader.weekend

**Supervisors:**
- Assign **"HRA Supervisor"** role to:
  - supervisor.bodyshop, supervisor.paintshop, supervisor.assembly1, etc.

**Underhall:**
- Assign **"HRA Underhall"** role to:
  - erik.larsson, anna.andersson, lars.nilsson, etc.

---

## 🔧 **PART 4: UPDATE YOUR APPLICATION CODE**

### **Step 13: Environment Configuration**
1. Copy the environment template:
```bash
copy .env.app-roles-template .env
```

2. Edit `.env` with your Azure AD application details:
```env
AZURE_CLIENT_ID=your-application-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here  
AZURE_TENANT_ID=your-tenant-id-here
JWT_SECRET=your-super-secure-jwt-secret-here
SESSION_SECRET=your-super-secure-session-secret-here
NODE_ENV=development
```

### **Step 14: Code Updates (Already Done)**
Your application code has been updated to support app roles:

✅ **MSAL Authentication Module** (`auth/msalAuth.js`)
- Updated to extract roles from JWT token claims
- Direct mapping of app role values to HRA roles
- Supports roles: admin, superintendent, arbetsledare, supervisor, underhall

✅ **Server Configuration** (`server.js`)
- Updated MSAL callback handlers to use app roles
- Role extraction from access tokens
- Automatic user creation/update with correct roles

✅ **Client-Side MSAL** (`client/msal-client.js`)
- Proper scope requests for app roles
- Token exchange handling
- Role-based authentication flow

### **Step 15: Test the Integration**
1. **Start your application:**
```bash
node server.js
```

2. **Access the application:**
- Go to `http://localhost:8080`
- Click **"Logga in med Microsoft"** (if available)
- Or use traditional login to test existing users

3. **Verify app roles:**
- Login with a user assigned to an app role
- Check browser developer tools → Network tab
- Look for JWT token in authentication responses
- Decode token at [jwt.io](https://jwt.io) to verify `roles` claim

---

## 🧪 **PART 5: TESTING APP ROLES**

### **Step 16: Verify App Role Configuration**
1. **Check Azure AD App Registration:**
   - Go to Azure Portal → App registrations → Your app
   - Click **"App roles"** → Verify all 5 roles exist
   - Check **"Enterprise applications"** → Your app → **"Users and groups"**
   - Verify users are assigned to correct roles

### **Step 17: Test Role Assignment**
1. **Test Different User Roles:**
```bash
# Start the application
node server.js
```

2. **Test MSAL Login Flow:**
   - Go to `http://localhost:8080`
   - Try MSAL authentication (if configured)
   - Or test with traditional login:
     - Admin: `admin.main` / `admin123`
     - Supervisor: `supervisor.bodyshop` / `body123`
     - Maintenance: `erik.larsson` / `erik123`

### **Step 18: Debug Token Claims**
1. **Inspect JWT Tokens:**
   - Open browser Developer Tools (F12)
   - Go to Network tab → Login with MSAL
   - Find authentication response
   - Copy access token and paste into [jwt.io](https://jwt.io)
   - Verify the `roles` claim contains your app roles

2. **Expected Token Claims:**
```json
{
  "aud": "your-client-id",
  "iss": "https://login.microsoftonline.com/your-tenant-id/v2.0",
  "roles": ["admin"],  // ← Your app roles appear here
  "upn": "user@yourdomain.com",
  "name": "User Name",
  ...
}
```

---

## 🔍 **PART 6: TROUBLESHOOTING**

### **Common Issues:**

#### **❌ Roles not appearing in token**
- **Solution:** Ensure app roles are enabled and users are assigned
- Check Enterprise Application → Users and groups for assignments

#### **❌ Users can't see app roles**
- **Solution:** Users might need to consent to the application
- Admin can grant tenant-wide consent in App registrations → API permissions

#### **❌ Role mapping not working**
- **Solution:** Verify the role values match exactly (case-sensitive)
- Check JWT token claims in browser dev tools

#### **❌ Access denied errors**
- **Solution:** Verify redirect URIs are correctly configured
- Check App registrations → Authentication → Redirect URIs

---

## 📊 **VERIFICATION CHECKLIST**

### ✅ **App Roles Created (5 roles)**
- [ ] HRA Admin (value: admin)
- [ ] HRA Superintendent (value: superintendent)  
- [ ] HRA Arbetsledare (value: arbetsledare)
- [ ] HRA Supervisor (value: supervisor)
- [ ] HRA Underhall (value: underhall)

### ✅ **User Assignments Complete**
- [ ] 3 Admin users assigned to HRA Admin role
- [ ] 4 Superintendent users assigned to HRA Superintendent role
- [ ] 4 Arbetsledare users assigned to HRA Arbetsledare role
- [ ] 8 Supervisor users assigned to HRA Supervisor role
- [ ] 15 Underhall users assigned to HRA Underhall role

### ✅ **Code Integration**
- [ ] MSAL configuration updated to request roles
- [ ] Server-side role extraction implemented
- [ ] Role-based access control working
- [ ] Dashboard displays based on user roles

### ✅ **Testing Complete**
- [ ] MSAL login working for all role types
- [ ] Traditional login still works as fallback
- [ ] Role-based permissions enforced
- [ ] JWT tokens contain correct roles claim

---

## 🎯 **EXPECTED OUTCOME**

After completing these steps:

1. **🔐 Azure AD Integration:** Users can login with their Azure AD accounts
2. **🎭 Role-Based Access:** Each user automatically gets their correct role
3. **🔄 Seamless Experience:** No manual role assignment needed in your app
4. **🛡️ Enhanced Security:** Centralized user management through Azure AD
5. **📱 Same Functionality:** All existing features work with MSAL authentication

---

## 💡 **OPTIONAL: BULK USER CREATION**

If you need to create Azure AD users in bulk, you can use PowerShell:

```powershell
# Connect to Azure AD
Connect-AzureAD

# Create users based on your HRA user list
$users = @(
    @{Name="Erik Larsson"; UserName="erik.larsson"; Role="underhall"},
    @{Name="Anna Andersson"; UserName="anna.andersson"; Role="underhall"},
    # ... add all your users
)

foreach($user in $users) {
    New-AzureADUser -DisplayName $user.Name -UserPrincipalName "$($user.UserName)@yourdomain.com" -PasswordProfile $passwordProfile -AccountEnabled $true
}
```

---

## 🚀 **READY TO GO!**

Your HRA system will now have:
- ✅ **Azure AD Single Sign-On**
- ✅ **Automatic Role Assignment** 
- ✅ **Enterprise Security**
- ✅ **Centralized User Management**
- ✅ **Seamless MSAL Integration**

**🎯 Your enterprise-grade safety management system is ready for production!** 🏭⚡