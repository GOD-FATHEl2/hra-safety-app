// Test MSAL CDN connectivity and provide diagnostics
async function testMSALConnectivity() {
    console.log('🔍 Testing MSAL CDN connectivity...');
    
    const cdnUrls = [
        'https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js',
        'https://cdn.jsdelivr.net/npm/@azure/msal-browser@2.38.3/lib/msal-browser.min.js',
        'https://unpkg.com/@azure/msal-browser@2.38.3/lib/msal-browser.min.js'
    ];
    
    const results = [];
    
    for (let i = 0; i < cdnUrls.length; i++) {
        const url = cdnUrls[i];
        console.log(`Testing CDN ${i + 1}/${cdnUrls.length}: ${url}`);
        
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            results.push({
                url: url,
                status: 'Available',
                message: 'CDN accessible'
            });
            console.log(`✅ CDN ${i + 1} is accessible`);
        } catch (error) {
            results.push({
                url: url,
                status: 'Failed',
                message: error.message
            });
            console.log(`❌ CDN ${i + 1} failed:`, error.message);
        }
    }
    
    return results;
}

// Auto-run connectivity test when script loads
testMSALConnectivity().then(results => {
    console.log('🔍 MSAL CDN Connectivity Test Results:', results);
    
    const failedCounts = results.filter(r => r.status === 'Failed').length;
    if (failedCounts === results.length) {
        console.log('⚠️ All MSAL CDNs are inaccessible - network/firewall issue likely');
        
        // Show user-friendly message
        setTimeout(() => {
            const msalBtn = document.getElementById('msalLoginBtn');
            if (msalBtn) {
                msalBtn.innerHTML = `
                    <span class="microsoft-icon">🏢</span>
                    Logga in med Microsoft (Offline)
                `;
                msalBtn.title = 'Microsoft login är inte tillgänglig - använd vanlig inloggning';
                msalBtn.style.opacity = '0.6';
            }
        }, 1000);
    }
}).catch(console.error);