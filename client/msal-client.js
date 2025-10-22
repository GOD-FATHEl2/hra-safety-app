// Client-side MSAL Configuration for App Roles
// This file provides the proper configuration for requesting app roles in the browser

const msalConfig = {
    auth: {
        clientId: '', // Will be set dynamically from server
        authority: '', // Will be set dynamically from server
        redirectUri: window.location.origin + '/auth/callback'
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (level <= 1) { // Error level
                    console.error('[MSAL]', message);
                }
            }
        }
    }
};

// Login request configuration for app roles
const loginRequest = {
    scopes: ["User.Read", "openid", "profile", "email"],
    // This ensures app roles are requested and included in the token
    extraScopesToConsent: [],
    // Prompt for consent to ensure fresh tokens with roles
    prompt: 'select_account'
};

// Token request for silent token acquisition
const silentRequest = {
    scopes: ["User.Read"],
    account: null, // Will be set after login
    forceRefresh: false
};

// Initialize MSAL instance
let msalInstance = null;

// Initialize MSAL with configuration from server
async function initializeMSAL() {
    try {
        // Get MSAL configuration from server
        const response = await fetch('/api/auth/msal-config');
        if (!response.ok) {
            throw new Error('Failed to get MSAL configuration');
        }
        
        const config = await response.json();
        
        // Update client configuration
        msalConfig.auth.clientId = config.clientId;
        msalConfig.auth.authority = config.authority;
        msalConfig.auth.redirectUri = config.redirectUri;
        
        // Create MSAL instance
        msalInstance = new msal.PublicClientApplication(msalConfig);
        
        // Handle redirect promise
        await msalInstance.handleRedirectPromise();
        
        console.log('MSAL initialized successfully with app roles support');
        return true;
    } catch (error) {
        console.error('Failed to initialize MSAL:', error);
        return false;
    }
}

// Login with MSAL (popup method)
async function loginWithMSAL() {
    try {
        if (!msalInstance) {
            throw new Error('MSAL not initialized');
        }
        
        // Use popup login to avoid redirect
        const loginResponse = await msalInstance.loginPopup(loginRequest);
        
        // Get access token with app roles
        const tokenRequest = {
            ...silentRequest,
            account: loginResponse.account
        };
        
        const tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
        
        // Exchange Microsoft token for HRA token
        const hraResponse = await fetch('/api/auth/msal-exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accessToken: tokenResponse.accessToken
            })
        });
        
        if (!hraResponse.ok) {
            throw new Error('Failed to exchange token');
        }
        
        const hraData = await hraResponse.json();
        
        // Store HRA token
        localStorage.setItem('hraToken', hraData.token);
        localStorage.setItem('hraUser', JSON.stringify(hraData.user));
        
        return hraData;
        
    } catch (error) {
        console.error('MSAL login failed:', error);
        throw error;
    }
}

// Login with MSAL (redirect method)
function loginWithMSALRedirect() {
    if (!msalInstance) {
        throw new Error('MSAL not initialized');
    }
    
    msalInstance.loginRedirect(loginRequest);
}

// Logout from MSAL
async function logoutFromMSAL() {
    try {
        if (!msalInstance) {
            return;
        }
        
        // Clear HRA tokens
        localStorage.removeItem('hraToken');
        localStorage.removeItem('hraUser');
        
        // Get current account
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            // Logout with redirect
            await msalInstance.logoutRedirect({
                account: accounts[0],
                postLogoutRedirectUri: window.location.origin
            });
        }
        
    } catch (error) {
        console.error('MSAL logout failed:', error);
    }
}

// Check if user is logged in with MSAL
function isLoggedInWithMSAL() {
    if (!msalInstance) return false;
    
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0;
}

// Get current MSAL account
function getCurrentAccount() {
    if (!msalInstance) return null;
    
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
}

// Export functions for global use
window.MSAL_HRA = {
    initializeMSAL,
    loginWithMSAL,
    loginWithMSALRedirect,
    logoutFromMSAL,
    isLoggedInWithMSAL,
    getCurrentAccount
};