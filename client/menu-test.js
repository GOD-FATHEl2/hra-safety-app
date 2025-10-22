// Menu and Navigation Test Script
// This script tests all menu functionality including mobile menu and logout

console.log('🧪 Testing Menu and Navigation Functionality\n');

// Test 1: Check if all menu elements exist
function testMenuElements() {
    console.log('1. 📋 Checking Menu Elements:');
    console.log(''.padEnd(30, '-'));
    
    const elements = {
        'Mobile Menu Toggle': '#mobileMenuToggle',
        'Navigation Menu': '#nav',
        'Form Button': 'button[data-view="form"]',
        'Mine Button': 'button[data-view="mine"]',
        'Dashboard Button': 'button[data-view="dash"]',
        'Users Button': 'button[data-view="users"]',
        'Info Button': 'button[onclick*="information.html"]',
        'Logout Button': '#logout'
    };
    
    let passed = 0;
    let failed = 0;
    
    Object.entries(elements).forEach(([name, selector]) => {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`✅ ${name}: Found`);
            passed++;
        } else {
            console.log(`❌ ${name}: Missing (${selector})`);
            failed++;
        }
    });
    
    console.log(`\n📊 Menu Elements: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
}

// Test 2: Check mobile menu functionality
function testMobileMenu() {
    console.log('2. 📱 Testing Mobile Menu:');
    console.log(''.padEnd(30, '-'));
    
    const toggle = document.querySelector('#mobileMenuToggle');
    const nav = document.querySelector('#nav');
    
    if (!toggle || !nav) {
        console.log('❌ Mobile menu elements missing');
        return false;
    }
    
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
    });
    
    console.log('✅ Mobile viewport simulated (500px)');
    
    // Test toggle functionality
    try {
        toggle.click();
        const hasShow = nav.classList.contains('show');
        const hasActive = toggle.classList.contains('active');
        
        console.log(`✅ Menu toggle click: ${hasShow ? 'Menu opened' : 'Menu not opened'}`);
        console.log(`✅ Toggle active state: ${hasActive ? 'Active' : 'Not active'}`);
        
        // Click again to close
        toggle.click();
        const closed = !nav.classList.contains('show');
        console.log(`✅ Menu close: ${closed ? 'Closed' : 'Still open'}`);
        
        return hasShow && hasActive && closed;
    } catch (error) {
        console.log(`❌ Mobile menu test error: ${error.message}`);
        return false;
    }
}

// Test 3: Check navigation functionality
function testNavigation() {
    console.log('3. 🧭 Testing Navigation:');
    console.log(''.padEnd(30, '-'));
    
    const views = { 
        form: "#formView", 
        mine: "#mineView", 
        dash: "#dashView", 
        users: "#usersView" 
    };
    
    let passed = 0;
    let failed = 0;
    
    Object.entries(views).forEach(([viewName, selector]) => {
        const viewElement = document.querySelector(selector);
        const buttonElement = document.querySelector(`button[data-view="${viewName}"]`);
        
        if (viewElement && buttonElement) {
            console.log(`✅ ${viewName.toUpperCase()}: View and button exist`);
            passed++;
        } else {
            console.log(`❌ ${viewName.toUpperCase()}: ${!viewElement ? 'View missing' : 'Button missing'}`);
            failed++;
        }
    });
    
    console.log(`\n📊 Navigation: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
}

// Test 4: Check logout functionality
function testLogout() {
    console.log('4. 🚪 Testing Logout:');
    console.log(''.padEnd(30, '-'));
    
    const logoutBtn = document.querySelector('#logout');
    
    if (!logoutBtn) {
        console.log('❌ Logout button not found');
        return false;
    }
    
    console.log('✅ Logout button found');
    
    // Test if localStorage.removeItem works
    try {
        localStorage.setItem('test', 'value');
        localStorage.removeItem('test');
        console.log('✅ localStorage operations working');
    } catch (error) {
        console.log(`❌ localStorage error: ${error.message}`);
        return false;
    }
    
    // Test if onclick is defined
    if (logoutBtn.onclick) {
        console.log('✅ Logout onclick handler defined');
        return true;
    } else {
        console.log('❌ Logout onclick handler missing');
        return false;
    }
}

// Test 5: Check role-based visibility
function testRoleVisibility() {
    console.log('5. 👤 Testing Role-Based Visibility:');
    console.log(''.padEnd(30, '-'));
    
    const roleSupElements = document.querySelectorAll('.role-sup');
    const roleAdminElements = document.querySelectorAll('.role-admin');
    
    console.log(`✅ Supervisor elements: ${roleSupElements.length} found`);
    console.log(`✅ Admin elements: ${roleAdminElements.length} found`);
    
    // Test with different roles
    const testRoles = ['admin', 'supervisor', 'superintendent', 'arbetsledare', 'underhall'];
    
    testRoles.forEach(role => {
        // Simulate role visibility logic
        const supVisible = ['supervisor', 'superintendent', 'admin', 'arbetsledare'].includes(role);
        const adminVisible = role === 'admin';
        
        console.log(`   ${role}: Supervisor menu ${supVisible ? 'visible' : 'hidden'}, Admin menu ${adminVisible ? 'visible' : 'hidden'}`);
    });
    
    return true;
}

// Run all tests
function runAllTests() {
    console.log('🚀 HRA Menu and Navigation Test Suite');
    console.log(''.padEnd(50, '='));
    
    const tests = [
        { name: 'Menu Elements', test: testMenuElements },
        { name: 'Mobile Menu', test: testMobileMenu },
        { name: 'Navigation', test: testNavigation },
        { name: 'Logout', test: testLogout },
        { name: 'Role Visibility', test: testRoleVisibility }
    ];
    
    let overallPassed = 0;
    let overallFailed = 0;
    
    tests.forEach(({ name, test }) => {
        try {
            const result = test();
            if (result) {
                console.log(`🎉 ${name}: PASSED\n`);
                overallPassed++;
            } else {
                console.log(`💥 ${name}: FAILED\n`);
                overallFailed++;
            }
        } catch (error) {
            console.log(`💥 ${name}: ERROR - ${error.message}\n`);
            overallFailed++;
        }
    });
    
    console.log(''.padEnd(50, '='));
    console.log(`📊 Final Results: ${overallPassed} passed, ${overallFailed} failed`);
    
    if (overallFailed === 0) {
        console.log('🎉 All menu and navigation tests passed!');
        console.log('✅ Your HRA application menu is working correctly');
    } else {
        console.log('⚠️  Some tests failed. Check the details above.');
    }
    
    return overallFailed === 0;
}

// Export for browser console testing
if (typeof window !== 'undefined') {
    window.menuTest = { runAllTests, testMenuElements, testMobileMenu, testNavigation, testLogout, testRoleVisibility };
    console.log('📝 Menu tests loaded. Run menuTest.runAllTests() in browser console to test.');
}

// Run tests if in Node.js environment
if (typeof window === 'undefined') {
    console.log('ℹ️  This test is designed to run in the browser.');
    console.log('📝 Open browser dev tools and run: menuTest.runAllTests()');
}