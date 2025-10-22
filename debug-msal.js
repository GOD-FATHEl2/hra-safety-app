// Debug script for Microsoft login issues
// This script will help identify why MSAL authentication is failing

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function debugMSALLogin() {
    console.log('🔍 DEBUGGING MICROSOFT LOGIN ISSUES\n');
    console.log(''.padEnd(50, '='));
    
    // 1. Check environment configuration
    console.log('📋 Environment Configuration:');
    console.log(''.padEnd(30, '-'));
    
    const requiredVars = [
        'AZURE_CLIENT_ID',
        'AZURE_CLIENT_SECRET', 
        'AZURE_TENANT_ID'
    ];
    
    let missingVars = [];
    
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (!value || value.includes('YOUR_') || value.includes('<<<')) {
            missingVars.push(varName);
            console.log(`❌ ${varName}: Not configured properly`);
        } else if (value.length < 10) {
            console.log(`⚠️  ${varName}: Too short (${value.length} chars)`);
            missingVars.push(varName);
        } else {
            console.log(`✅ ${varName}: Configured (${value.length} characters)`);
        }
    });
    
    if (missingVars.length > 0) {
        console.log(`\n❌ ISSUE FOUND: Missing or invalid configuration for: ${missingVars.join(', ')}`);
        console.log('\n🔧 SOLUTION:');
        console.log('1. Go to Azure Portal → App registrations → Your app');
        console.log('2. Copy the Application (client) ID');
        console.log('3. Copy the Directory (tenant) ID');  
        console.log('4. Go to Certificates & secrets → Create new client secret');
        console.log('5. Update your .env file with these values');
        return false;
    }
    
    // 2. Test Azure AD endpoints
    console.log('\n🌐 Testing Azure AD Endpoints:');
    console.log(''.padEnd(30, '-'));
    
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    
    // Test well-known endpoint
    const wellKnownUrl = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid_configuration`;
    
    try {
        const response = await fetch(wellKnownUrl);
        if (response.ok) {
            console.log('✅ Azure AD tenant endpoint: Accessible');
            const config = await response.json();
            console.log(`   Authorization endpoint: ${config.authorization_endpoint ? 'Available' : 'Missing'}`);
            console.log(`   Token endpoint: ${config.token_endpoint ? 'Available' : 'Missing'}`);
        } else {
            console.log(`❌ Azure AD tenant endpoint: Failed (${response.status})`);
            if (response.status === 400) {
                console.log('   → Check your AZURE_TENANT_ID');
            }
        }
    } catch (error) {
        console.log(`❌ Azure AD tenant endpoint: Error (${error.message})`);
    }
    
    // 3. Test application configuration
    console.log('\n🏗️ Testing Application Configuration:');
    console.log(''.padEnd(30, '-'));
    
    try {
        const serverResponse = await fetch('http://localhost:8080/api/auth/msal-config');
        if (serverResponse.ok) {
            const config = await serverResponse.json();
            console.log('✅ MSAL config endpoint: Working');
            console.log(`   Client ID: ${config.clientId ? 'Set' : 'Missing'}`);
            console.log(`   Authority: ${config.authority ? 'Set' : 'Missing'}`);
            console.log(`   Redirect URI: ${config.redirectUri}`);
        } else {
            console.log(`❌ MSAL config endpoint: Failed (${serverResponse.status})`);
        }
    } catch (error) {
        console.log(`❌ MSAL config endpoint: Error (${error.message})`);
        console.log('   → Make sure server is running: node server.js');
    }
    
    // 4. Test MSAL auth URL generation
    console.log('\n🔐 Testing MSAL Auth URL Generation:');
    console.log(''.padEnd(30, '-'));
    
    try {
        const authUrlResponse = await fetch('http://localhost:8080/api/auth/msal-url');
        if (authUrlResponse.ok) {
            const authData = await authUrlResponse.json();
            console.log('✅ MSAL auth URL: Generated successfully');
            console.log(`   URL length: ${authData.authUrl?.length || 0} characters`);
            
            if (authData.authUrl) {
                const url = new URL(authData.authUrl);
                console.log(`   Authority: ${url.hostname}`);
                console.log(`   Client ID in URL: ${url.searchParams.get('client_id') ? 'Present' : 'Missing'}`);
                console.log(`   Redirect URI in URL: ${url.searchParams.get('redirect_uri') ? 'Present' : 'Missing'}`);
            }
        } else {
            console.log(`❌ MSAL auth URL: Failed (${authUrlResponse.status})`);
            const errorText = await authUrlResponse.text();
            console.log(`   Error: ${errorText}`);
        }
    } catch (error) {
        console.log(`❌ MSAL auth URL: Error (${error.message})`);
    }
    
    // 5. Common issues and solutions
    console.log('\n🛠️ Common Microsoft Login Issues:');
    console.log(''.padEnd(30, '-'));
    
    console.log('❓ "Login misslyckades" can be caused by:');
    console.log('   1. Missing or invalid client secret');
    console.log('   2. Incorrect redirect URI configuration');
    console.log('   3. Missing API permissions in Azure AD');
    console.log('   4. Tenant restrictions');
    console.log('   5. User not assigned to app roles');
    
    console.log('\n🔧 Quick Fixes:');
    console.log('   1. Verify redirect URI: http://localhost:8080/auth/callback');
    console.log('   2. Check Azure AD → App registrations → Authentication');
    console.log('   3. Ensure API permissions include User.Read');
    console.log('   4. Grant admin consent for permissions');
    console.log('   5. Assign users to app roles');
    
    console.log('\n📝 Next Steps:');
    if (missingVars.length > 0) {
        console.log('   → Fix environment configuration first');
    } else {
        console.log('   → Check Azure AD app registration settings');
        console.log('   → Test with browser developer tools (F12)');
        console.log('   → Check server logs for detailed errors');
    }
    
    return missingVars.length === 0;
}

// Run the debug script
debugMSALLogin().catch(console.error);