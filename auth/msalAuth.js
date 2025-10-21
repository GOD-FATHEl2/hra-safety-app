import { cca, scopes, roleMapping, defaultRole } from './msalConfig.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code, redirectUri) {
    try {
        const tokenRequest = {
            code: code,
            scopes: scopes.graph,
            redirectUri: redirectUri,
        };

        const response = await cca.acquireTokenByCode(tokenRequest);
        return response;
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        throw error;
    }
}

// Get user info from Microsoft Graph
export async function getUserInfo(accessToken) {
    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Graph API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting user info:', error);
        throw error;
    }
}

// Get user groups from Microsoft Graph
export async function getUserGroups(accessToken) {
    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Graph API error: ${response.status}`);
        }

        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error('Error getting user groups:', error);
        return [];
    }
}

// Map Azure AD groups to HRA roles
export function mapUserRole(groups) {
    for (const group of groups) {
        if (roleMapping[group.id]) {
            return roleMapping[group.id];
        }
    }
    return defaultRole;
}

// Create JWT token for HRA system
export function createHRAToken(user, role) {
    const payload = {
        uid: user.id,
        email: user.mail || user.userPrincipalName,
        name: user.displayName,
        role: role,
        azureId: user.id,
        upn: user.userPrincipalName
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

// Verify JWT token middleware
export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Ingen token tillhandahållen' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Ogiltig token' });
    }
}

// Get auth URL for MSAL login
export function getAuthUrl(redirectUri) {
    const authUrlParameters = {
        scopes: scopes.graph,
        redirectUri: redirectUri,
    };

    return cca.getAuthCodeUrl(authUrlParameters);
}