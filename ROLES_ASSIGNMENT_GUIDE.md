# 🔐 HRA Application Roles Assignment Guide

## 📋 Available Roles in HRA System

Your HRA application has **5 distinct user roles** with different permission levels:

### 🎯 **Role Hierarchy** (from lowest to highest permissions)

1. **`underhall`** - Maintenance Staff
   - Create risk assessments
   - View own assessments
   - Upload images/photos

2. **`supervisor`** - Direct Supervisor
   - All underhall permissions
   - View and approve assessments from their team
   - Access dashboard for their area

3. **`superintendent`** - Area Superintendent
   - All supervisor permissions
   - Approve high-risk assessments
   - Access broader dashboard view
   - Manage multiple supervisor areas

4. **`arbetsledare`** - Work Leader (New Role)
   - All superintendent permissions
   - Additional approval authority
   - Enhanced notification access

5. **`admin`** - System Administrator
   - **FULL ACCESS** to everything
   - User management
   - System configuration
   - View all assessments across organization

---

## 🚀 **Method 1: Database Direct Assignment** (Recommended for Initial Setup)

### Step 1: Access the Database
```bash
# Navigate to your HRA directory
cd C:\Users\NEKKOU\Downloads\HRA\HRA

# Option A: Using SQLite command line
sqlite3 hogrisk.db

# Option B: Using a GUI tool like DB Browser for SQLite
# Download from: https://sqlitebrowser.org/
```

### Step 2: View Current Users
```sql
-- See all existing users and their roles
SELECT username, role, created_at FROM users ORDER BY created_at;
```

### Step 3: Create New Users
```sql
-- Create a new user (password will be hashed automatically when they first login)
INSERT INTO users (username, password, role) VALUES 
('john.doe', 'temporary123', 'supervisor');

INSERT INTO users (username, password, role) VALUES 
('jane.smith', 'temporary123', 'superintendent');

INSERT INTO users (username, password, role) VALUES 
('erik.larsson', 'temporary123', 'underhall');

INSERT INTO users (username, password, role) VALUES 
('maria.andersson', 'temporary123', 'arbetsledare');

INSERT INTO users (username, password, role) VALUES 
('admin.user', 'admin123', 'admin');
```

### Step 4: Update Existing User Roles
```sql
-- Change a user's role
UPDATE users SET role = 'supervisor' WHERE username = 'existing.user';

-- Promote a user to admin
UPDATE users SET role = 'admin' WHERE username = 'senior.manager';

-- Demote a user
UPDATE users SET role = 'underhall' WHERE username = 'former.supervisor';
```

### Step 5: Verify Changes
```sql
-- Confirm the changes
SELECT username, role, created_at FROM users WHERE role = 'admin';
SELECT username, role, created_at FROM users ORDER BY role, username;
```

---

## 🌐 **Method 2: Using the Web Interface** (For Admins)

### Step 1: Login as Admin
1. Go to your HRA application: `http://localhost:8080`
2. Login with admin credentials
3. You should see the "Användarhantering" (User Management) button

### Step 2: Access User Management
1. Click **"Användare"** button in the navigation
2. This opens the user management panel
3. Only visible to users with `admin` role

### Step 3: Create New Users
1. Fill in the form at the bottom:
   - **Användarnamn**: Enter username (e.g., `erik.larsson`)
   - **Lösenord**: Enter temporary password
   - **Roll**: Select from dropdown:
     - `underhall`
     - `supervisor` 
     - `superintendent`
     - `admin`
     - `arbetsledare`
2. Click **"Skapa användare"** (Create User)

### Step 4: View and Manage Existing Users
- All users are listed in the table above the form
- Shows: Username, Role, Created Date
- Note: Currently no edit function in UI (use database method for changes)

---

## 🔧 **Method 3: Bulk User Import** (For Large Organizations)

### Step 1: Create CSV File
Create a file called `users_import.csv`:
```csv
username,password,role
john.doe,temp123,supervisor
jane.smith,temp123,superintendent
erik.larsson,temp123,underhall
maria.andersson,temp123,arbetsledare
lars.nilsson,temp123,underhall
anna.berg,temp123,supervisor
```

### Step 2: Import Script
Create a simple Node.js script to import users:

```javascript
// save as import_users.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./hogrisk.db');

const csvData = fs.readFileSync('./users_import.csv', 'utf8');
const lines = csvData.split('\n').slice(1); // Skip header

lines.forEach(line => {
    if (line.trim()) {
        const [username, password, role] = line.split(',');
        db.run(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username.trim(), password.trim(), role.trim()],
            function(err) {
                if (err) {
                    console.log(`Error creating user ${username}: ${err.message}`);
                } else {
                    console.log(`Created user: ${username} with role: ${role}`);
                }
            }
        );
    }
});

db.close();
```

### Step 3: Run Import
```bash
node import_users.js
```

---

## 🏢 **Method 4: Azure AD Integration** (Enterprise Setup)

### Step 1: Configure Azure AD App Roles
1. Go to **Azure Portal** → **Azure Active Directory** → **App registrations**
2. Select your HRA application
3. Go to **App roles** section
4. Create roles that match your HRA roles:

```json
{
  "allowedMemberTypes": ["User"],
  "description": "Maintenance staff who can create risk assessments",
  "displayName": "Underhall",
  "id": "uuid-for-underhall",
  "isEnabled": true,
  "value": "underhall"
}
```

### Step 2: Assign Users to Roles
1. Go to **Enterprise applications** → Your HRA app
2. **Users and groups** → **Add user/group**
3. Select users and assign them to the appropriate app roles

### Step 3: Update HRA Code for Azure AD Roles
The application already supports Azure AD integration with role mapping!

---

## 📊 **Practical Role Assignment Examples**

### **Volvo Cars Factory Structure Example:**

```sql
-- Production Line Managers
INSERT INTO users (username, password, role) VALUES 
('line.manager.body', 'temp123', 'supervisor'),
('line.manager.paint', 'temp123', 'supervisor'),
('line.manager.assembly', 'temp123', 'supervisor');

-- Area Superintendents
INSERT INTO users (username, password, role) VALUES 
('super.production', 'temp123', 'superintendent'),
('super.quality', 'temp123', 'superintendent');

-- Maintenance Staff
INSERT INTO users (username, password, role) VALUES 
('maint.erik', 'temp123', 'underhall'),
('maint.lars', 'temp123', 'underhall'),
('maint.anna', 'temp123', 'underhall');

-- Work Leaders
INSERT INTO users (username, password, role) VALUES 
('workleader.day', 'temp123', 'arbetsledare'),
('workleader.night', 'temp123', 'arbetsledare');

-- System Administrators
INSERT INTO users (username, password, role) VALUES 
('it.admin', 'secure123', 'admin'),
('safety.admin', 'secure123', 'admin');
```

---

## 🔒 **Security Best Practices**

### ✅ **Password Management**
1. **Temporary Passwords**: Use simple temporary passwords initially
2. **Force Change**: Users should change password on first login
3. **Strong Passwords**: Implement password policy for production

### ✅ **Role Assignment Guidelines**
1. **Principle of Least Privilege**: Give minimum required access
2. **Regular Review**: Audit user roles quarterly
3. **Separation of Duties**: Don't give admin rights unnecessarily

### ✅ **Access Control**
```sql
-- Remove inactive users
DELETE FROM users WHERE username = 'former.employee';

-- Disable user (keep for audit trail)
UPDATE users SET role = 'disabled' WHERE username = 'on.leave.user';

-- Audit recent role changes
SELECT username, role, created_at FROM users 
WHERE created_at > datetime('now', '-30 days');
```

---

## 🚨 **Troubleshooting Common Issues**

### **Issue 1: User Can't See Navigation Buttons**
```sql
-- Check user's role
SELECT username, role FROM users WHERE username = 'problem.user';

-- Verify role is spelled correctly (case-sensitive)
UPDATE users SET role = 'supervisor' WHERE username = 'problem.user';
```

### **Issue 2: Admin Can't Access User Management**
```sql
-- Ensure user has exact 'admin' role
UPDATE users SET role = 'admin' WHERE username = 'admin.user';
```

### **Issue 3: New User Can't Login**
1. Check username spelling in database
2. Verify password (will be hashed after first successful login)
3. Ensure role is valid

### **Issue 4: Role Changes Don't Apply**
1. User needs to logout and login again
2. Check browser cache (hard refresh: Ctrl+F5)
3. Verify database changes were saved

---

## 📋 **Quick Reference Commands**

```sql
-- View all users and roles
SELECT username, role, created_at FROM users ORDER BY role, username;

-- Count users by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Find all admins
SELECT * FROM users WHERE role = 'admin';

-- Create emergency admin
INSERT INTO users (username, password, role) VALUES ('emergency.admin', 'emergency123', 'admin');

-- Reset user password (they'll need to login to hash it)
UPDATE users SET password = 'newtemp123' WHERE username = 'username';
```

---

## ✅ **Next Steps After Role Assignment**

1. **Test Each Role**: Login as each role type to verify permissions
2. **Document Users**: Keep a record of who has what role
3. **Train Users**: Ensure users understand their access level
4. **Monitor Usage**: Check logs for proper role usage
5. **Regular Audits**: Review and update roles monthly

Your HRA application is now ready with proper role-based access control! 🎯