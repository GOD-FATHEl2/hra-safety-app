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
        redirectUri: process.env.REDIRECT_URI || "http://localhost:3000/auth/callback"
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

// Scopes for Microsoft Graph API
export const scopes = {
    graph: ["https://graph.microsoft.com/User.Read"],
    custom: ["api://your-api-id/access_as_user"] // Replace with your API scope
};

// Role mapping from Azure AD groups to HRA roles
// IMPORTANT: Replace these with your actual Azure AD Group Object IDs
export const roleMapping = {
    // Example Azure AD Group Object IDs - REPLACE WITH YOUR ACTUAL GROUP IDs
    '12345678-1234-1234-1234-123456789abc': 'admin',           // HRA Administrators
    '87654321-4321-4321-4321-cba987654321': 'superintendent',  // HRA Superintendents
    'abcdef12-3456-7890-abcd-ef1234567890': 'supervisor',      // HRA Supervisors
    '09876543-210f-edcb-a098-765432109876': 'arbetsledare',    // HRA Arbets Ledare
    'fedcba09-8765-4321-fedc-ba0987654321': 'underhall'       // HRA Underhåll
};

// Default role if no group mapping found
export const defaultRole = 'underhall';