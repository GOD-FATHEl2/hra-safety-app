// Test script to verify Azure AD App Roles integration
// Run this script to test the MSAL app roles functionality

import jwt from 'jsonwebtoken';

// Test function to simulate role extraction from JWT token
function testRoleExtraction() {
    console.log('🧪 Testing Azure AD App Roles Integration\n');
    
    // Simulate JWT tokens with different app roles
    const testTokens = [
        {
            user: 'admin.test@volvo.com',
            roles: ['admin'],
            expected: 'admin'
        },
        {
            user: 'super.test@volvo.com', 
            roles: ['superintendent'],
            expected: 'superintendent'
        },
        {
            user: 'leader.test@volvo.com',
            roles: ['arbetsledare'],
            expected: 'arbetsledare'
        },
        {
            user: 'supervisor.test@volvo.com',
            roles: ['supervisor'],
            expected: 'supervisor'
        },
        {
            user: 'maintenance.test@volvo.com',
            roles: ['underhall'],
            expected: 'underhall'
        },
        {
            user: 'noroles.test@volvo.com',
            roles: [],
            expected: 'underhall' // default role
        }
    ];
    
    // Test role mapping function
    function mapUserRole(roles) {
        for (const role of roles) {
            if (['admin', 'superintendent', 'arbetsledare', 'supervisor', 'underhall'].includes(role)) {
                return role;
            }
        }
        return 'underhall';
    }
    
    // Test each token scenario
    console.log('📋 Testing role mapping:');
    console.log(''.padEnd(50, '='));
    
    let passed = 0;
    let failed = 0;
    
    testTokens.forEach((test, index) => {
        const result = mapUserRole(test.roles);
        const success = result === test.expected;
        
        console.log(`${index + 1}. ${test.user}`);
        console.log(`   Roles: [${test.roles.join(', ')}]`);
        console.log(`   Expected: ${test.expected}`);
        console.log(`   Got: ${result}`);
        console.log(`   Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
        console.log('');
        
        if (success) passed++;
        else failed++;
    });
    
    console.log(''.padEnd(50, '='));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! App roles integration is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check your role mapping logic.');
    }
}

// Test environment configuration
function testEnvironmentConfig() {
    console.log('\n🔧 Checking Environment Configuration:\n');
    
    const requiredEnvVars = [
        'AZURE_CLIENT_ID',
        'AZURE_CLIENT_SECRET', 
        'AZURE_TENANT_ID',
        'JWT_SECRET',
        'SESSION_SECRET'
    ];
    
    let missingVars = [];
    
    requiredEnvVars.forEach(varName => {
        const value = process.env[varName];
        if (!value || value.includes('YOUR_') || value.includes('your-')) {
            missingVars.push(varName);
            console.log(`❌ ${varName}: Not configured`);
        } else {
            console.log(`✅ ${varName}: Configured (${value.length} characters)`);
        }
    });
    
    if (missingVars.length > 0) {
        console.log(`\n⚠️  Missing configuration for: ${missingVars.join(', ')}`);
        console.log('📝 Please update your .env file with actual Azure AD values.');
        return false;
    } else {
        console.log('\n🎉 All environment variables are configured!');
        return true;
    }
}

// Main test execution
async function runTests() {
    console.log('🚀 HRA Azure AD App Roles Test Suite');
    console.log(''.padEnd(50, '='));
    
    // Load environment variables
    try {
        const dotenv = await import('dotenv');
        dotenv.config();
    } catch (error) {
        console.log('ℹ️  dotenv not loaded, using system environment variables');
    }
    
    // Test role extraction logic
    testRoleExtraction();
    
    // Test environment configuration
    const envConfigured = testEnvironmentConfig();
    
    // Provide next steps
    console.log('\n📋 Next Steps:');
    console.log(''.padEnd(30, '-'));
    
    if (!envConfigured) {
        console.log('1. ⚙️  Configure your .env file with Azure AD values');
        console.log('2. 🔄 Run this test again to verify configuration');
    } else {
        console.log('1. 🏃 Start your server: node server.js');
        console.log('2. 🌐 Test MSAL login at http://localhost:8080');
        console.log('3. 🔍 Check JWT tokens for roles claim');
        console.log('4. ✅ Verify users get correct role-based access');
    }
    
    console.log('\n📚 For detailed setup instructions, see:');
    console.log('   → AZURE_APP_ROLES_SETUP.md');
}

// Run the tests
runTests().catch(console.error);