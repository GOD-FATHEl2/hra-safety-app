// MSAL Configuration for Node.js backend
import { ConfidentialClientApplication } from '@azure/msal-node';
import dotenv from 'dotenv';

dotenv.config();

// MSAL configuration for server-side authentication
export const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || process.env.TENANT_ID}`,
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(message);
                }
            },
            piiLoggingEnabled: false,
            logLevel: process.env.NODE_ENV === 'production' ? 'Error' : 'Info',
        }
    }
};

// Create MSAL instance
export const cca = new ConfidentialClientApplication(msalConfig);

// Client-side MSAL configuration for frontend
export const clientMsalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || process.env.TENANT_ID}`,
        redirectUri: process.env.REDIRECT_URI || (process.env.NODE_ENV === 'production' 
            ? "https://hra-h8fea8c0gucwf7fe.canadacentral-01.azurewebsites.net/auth/callback" 
            : "http://localhost:8080/auth/callback")
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (level <= 1) { // Error level
                    console.error(message);
                }
            }
        }
    }
};

// Scopes for Microsoft Graph API and app roles
export const scopes = {
    graph: ["https://graph.microsoft.com/User.Read"],
    // For app roles, we need to request the default scope of the application
    appRoles: [`api://${process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID}/.default`]
};

// Role mapping for app roles (legacy support for group-based mapping)
// App roles are now handled directly by role name, but this provides fallback mapping
export const roleMapping = {
    // Legacy group mappings (if migrating from groups to app roles)
    // Direct app role values: 'admin', 'superintendent', 'arbetsledare', 'supervisor', 'underhall'
    // These match exactly with the app role values created in Azure AD
};

// Default role if no app role found
export const defaultRole = 'underhall';