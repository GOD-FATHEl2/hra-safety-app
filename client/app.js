const API = location.origin;  // same origin
let token=null, role=null, name=null;

const $ = s => document.querySelector(s);
const show = id => { 
  console.log('🎨 Show function called with ID:', id);
  const sections = document.querySelectorAll("main > section");
  console.log('🎨 Found sections:', sections.length);
  sections.forEach(x=>x.classList.add("hidden")); 
  const targetSection = $(id);
  console.log('🎨 Target section:', targetSection);
  if (targetSection) {
    targetSection.classList.remove("hidden");
    console.log('✅ Successfully showed:', id);
  } else {
    console.log('❌ Target section not found:', id);
  }
};

// Define nav and views globally to ensure accessibility
let nav, loginView;
const views = { form:"#formView", mine:"#mineView", dash:"#dashView", users:"#usersView" };

// Initialize navigation event handling
function initNavigation() {
  nav = $("#nav"); 
  loginView = $("#loginView");
  console.log('🎯 Navigation initialized:', {nav: !!nav, loginView: !!loginView});
  
  if (nav) {
    // nav events
    nav.addEventListener("click", e=>{
      console.log('🔄 Nav clicked:', e.target);
      console.log('🔄 Dataset view:', e.target.dataset.view);
      if(e.target.dataset.view){
        const v = e.target.dataset.view;
        console.log('🔄 View to load:', v);
        console.log('🔄 Views object:', views);
        console.log('🔄 Target view ID:', views[v]);
        if(v==="form") {
          console.log('📝 Loading form');
          renderForm();
        }
        if(v==="mine") {
          console.log('📋 Loading mine');
          loadMine();
        }
        if(v==="dash") {
          console.log('📊 Loading dashboard');
          loadDash();
        }
        if(v==="users") {
          console.log('👥 Loading users');
          loadUsers();
        }
        show(views[v]);
        
        // Close mobile menu after navigation (if on mobile)
        if (window.innerWidth <= 768) {
          const mobileToggle = $('#mobileMenuToggle') || $('.mobile-menu-toggle');
          if (mobileToggle) {
            nav.classList.remove('show');
            mobileToggle.classList.remove('active');
          }
        }
      }
    });
    console.log('✅ Navigation event listener attached');
  } else {
    console.log('❌ Navigation element not found');
  }
}

// Mobile menu functionality
function initMobileMenu() {
  const mobileMenuToggle = $('#mobileMenuToggle') || $('.mobile-menu-toggle');
  const navMenu = $('#nav');
  
  if (mobileMenuToggle && navMenu) {
    // Remove any existing listeners to prevent duplicates
    mobileMenuToggle.replaceWith(mobileMenuToggle.cloneNode(true));
    const newToggle = $('#mobileMenuToggle') || $('.mobile-menu-toggle');
    
    newToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('show');
      newToggle.classList.toggle('active');
    });

    // Close menu when clicking outside (but don't interfere with nav buttons)
    document.addEventListener('click', (e) => {
      if (!newToggle.contains(e.target) && !navMenu.contains(e.target) && window.innerWidth <= 768) {
        navMenu.classList.remove('show');
        newToggle.classList.remove('active');
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        navMenu.classList.remove('show');
        newToggle.classList.remove('active');
      }
    });
  }
}

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM ready, initializing app');
  
  // Initialize navigation references
  nav = $("#nav"); 
  loginView = $("#loginView");
  console.log('🎯 UI references initialized:', {nav: !!nav, loginView: !!loginView});
  
  // Set up navigation event handling
  if (nav) {
    nav.addEventListener("click", e=>{
      console.log('🔄 Nav clicked:', e.target);
      console.log('🔄 Dataset view:', e.target.dataset.view);
      if(e.target.dataset.view){
        const v = e.target.dataset.view;
        console.log('🔄 View to load:', v);
        console.log('🔄 Views object:', views);
        console.log('🔄 Target view ID:', views[v]);
        if(v==="form") {
          console.log('📝 Loading form');
          renderForm();
        }
        if(v==="mine") {
          console.log('📋 Loading mine');
          loadMine();
        }
        if(v==="dash") {
          console.log('📊 Loading dashboard');
          loadDash();
        }
        if(v==="users") {
          console.log('👥 Loading users');
          loadUsers();
        }
        show(views[v]);
        
        // Close mobile menu after navigation (if on mobile)
        if (window.innerWidth <= 768) {
          const mobileToggle = $('#mobileMenuToggle') || $('.mobile-menu-toggle');
          if (mobileToggle) {
            nav.classList.remove('show');
            mobileToggle.classList.remove('active');
          }
        }
      }
    });
    console.log('✅ Navigation event listener attached');
  }
  
  // Load authentication state after nav is ready
  loadAuth();
  
  // Reinitialize event handlers
  const logoutBtn = $("#logout");
  if (logoutBtn) {
    logoutBtn.onclick = ()=> { 
      console.log('🚪 Logout button clicked');
      if (window.notificationSystem) {
        window.notificationSystem.cleanup();
        window.notificationSystem = null;
      }
      localStorage.removeItem("auth"); 
      console.log('🚪 Auth removed, reloading page');
      location.reload(); 
    };
    console.log('🚪 Logout handler bound');
  }
  
  const loginBtn = $("#loginBtn");
  if (loginBtn) {
    loginBtn.onclick = async ()=>{
      console.log('🔑 Login button clicked');
      $("#loginMsg").classList.add("hidden");
      const body = { username: $("#lu").value.trim(), password: $("#lp").value };
      const res = await fetch(API+"/api/auth/login",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const js = await res.json();
      if(!res.ok){ $("#loginMsg").textContent=js.error||"Fel"; $("#loginMsg").classList.remove("hidden"); return; }
      setAuth(js.token, js.role, js.name);
      
      // Initialize notification system on login
      if (!window.notificationSystem) {
        window.notificationSystem = new NotificationSystem();
      }
      
      renderForm(); show(views.form);
    };
    console.log('🔑 Login handler bound');
  }
  
  // Initialize mobile menu
  initMobileMenu();
});

// --- auth ---
function setAuth(t, r, n){
  console.log('🔐 setAuth called:', {token: t?.substring(0,10)+'...', role: r, name: n});
  token=t; role=r; name=n;
  window.token = t; // Make token available globally for image upload
  localStorage.setItem("auth", JSON.stringify({t,r,n}));
  console.log('🔐 Showing navigation menu');
  nav.classList.remove("hidden");
  $(".role-sup").classList.toggle("hidden", !(role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare"));
  $(".role-admin").classList.toggle("hidden", role!=="admin");
  loginView.classList.add("hidden");
  console.log('🔐 Menu should now be visible');
  
  // Initialize mobile menu after showing nav
  setTimeout(initMobileMenu, 100);
}
function loadAuth(){
  console.log('🔐 loadAuth called');
  
  // Ensure nav is initialized
  if (!nav) {
    nav = $("#nav");
    loginView = $("#loginView");
  }
  
  const a = JSON.parse(localStorage.getItem("auth")||"null");
  console.log('🔐 Stored auth:', a);
  if(!a) {
    console.log('🔐 No stored auth found');
    return;
  }
  token=a.t; role=a.r; name=a.n;
  window.token = a.t; // Make token available globally for image upload
  console.log('🔐 Loaded auth:', {role, name});
  
  if (nav) {
    nav.classList.remove("hidden");
    console.log('🔐 Navigation menu shown');
  }
  
  $(".role-sup").classList.toggle("hidden", !(role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare"));
  $(".role-admin").classList.toggle("hidden", role!=="admin");
  
  if (loginView) {
    loginView.classList.add("hidden");
  }
  
  console.log('🔐 Auth loaded, menu should be visible');
  
  // Initialize notification system for logged in users
  if (!window.notificationSystem) {
    window.notificationSystem = new NotificationSystem();
  }
  
  // Initialize mobile menu after showing nav
  setTimeout(initMobileMenu, 100);
}

// MSAL Authentication
let msalConfig = null;

// Load MSAL configuration
async function loadMSALConfig() {
  try {
    const response = await fetch(API + "/api/auth/msal-config");
    if (response.ok) {
      msalConfig = await response.json();
      return true;
    }
  } catch (error) {
    console.log("MSAL not configured");
  }
  return false;
}

// MSAL Login Button
$("#msalLoginBtn").onclick = async () => {
  try {
    console.log('🔑 MSAL login attempt started');
    $("#loginMsg").classList.add("hidden");
    
    // Check if MSAL is configured
    if (!msalConfig && !(await loadMSALConfig())) {
      $("#loginMsg").textContent = "Microsoft-inloggning inte tillgänglig: Konfiguration saknas";
      $("#loginMsg").classList.remove("hidden");
      console.error('❌ MSAL configuration failed to load');
      return;
    }
    
    console.log('🔧 MSAL Config:', {
      clientId: msalConfig.clientId,
      authority: msalConfig.authority,
      redirectUri: msalConfig.redirectUri
    });
    
    // Test network connectivity first
    const networkStatus = await testNetworkConnectivity();
    console.log('🌐 Network test result:', networkStatus);
    
    console.log('🔍 MSAL config loaded, attempting to load library...');
    
    // Load MSAL library dynamically with timeout
    try {
      await Promise.race([
        loadMSALScript(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('MSAL load timeout after 30 seconds')), 30000))
      ]);
    } catch (loadError) {
      console.error('❌ MSAL library load failed:', loadError);
      
      // Provide helpful network diagnostics with actionable guidance
      if (networkStatus.every(result => result.status === 'blocked')) {
        $("#loginMsg").innerHTML = `
          <strong>Microsoft-inloggning inte tillgänglig</strong><br>
          <small>Nätverket/brandvägg blockerar Microsoft-tjänster.<br>
          Använd traditionell inloggning med användarnamn och lösenord nedan.</small>
        `;
      } else if (networkStatus.some(result => result.status === 'accessible')) {
        $("#loginMsg").innerHTML = `
          <strong>Microsoft-inloggning misslyckades</strong><br>
          <small>Tekniskt fel: ${loadError.message}<br>
          Använd traditionell inloggning nedan eller försök igen senare.</small>
        `;
      } else {
        $("#loginMsg").innerHTML = `
          <strong>Microsoft login är inte tillgänglig just nu</strong><br>
          <small>Vänligen använd vanlig inloggning med användarnamn och lösenord.</small>
        `;
      }
      
      $("#loginMsg").classList.remove("hidden");
      return;
    }
    
    console.log('✅ MSAL library loaded successfully');
    
    // Initialize MSAL with proper configuration (following React patterns)
    const msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId: msalConfig.clientId,
        authority: msalConfig.authority || `https://login.microsoftonline.com/${msalConfig.tenantId || 'common'}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        navigateToLoginRequestUrl: false
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
        secureCookies: false
      },
      system: {
        allowNativeBroker: false, // Disable native broker for web
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 0,
        asyncPopups: false, // Use synchronous popups
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) return;
            console.log(`MSAL [${level}]: ${message}`);
          },
          logLevel: msal.LogLevel.Info,
          piiLoggingEnabled: false
        }
      },
      telemetry: {
        application: {
          appName: "HRA-Application",
          appVersion: "1.0.0"
        }
      }
    });
    
    // Add event callback (like React implementation)
    msalInstance.addEventCallback((event) => {
      console.log('🔔 MSAL Event received:', event.eventType, event);
      
      if (event.payload?.account) {
        console.log('👤 MSAL Event:', event.eventType, 'Account:', event.payload.account.username);
        msalInstance.setActiveAccount(event.payload.account);
      } else {
        console.log('🔍 MSAL Event:', event.eventType, 'No account in payload.');
      }
      
      if (event.eventType === 'LOGIN_FAILURE' || event.eventType === 'ACQUIRE_TOKEN_FAILURE') {
        console.error('❌ MSAL Error Event:', event.eventType, event.error);
      }
      
      if (event.eventType === 'POPUP_OPENED') {
        console.log('🪟 Popup opened for authentication');
      }
      
      if (event.eventType === 'POPUP_CLOSED') {
        console.log('🪟 Popup closed');
      }
    });
    
    // Handle redirect promise first (critical React pattern)
    console.log('🔄 Handling redirect promise...');
    const redirectResponse = await msalInstance.handleRedirectPromise();
    
    if (redirectResponse) {
      console.log('🔄 Redirect response received:', redirectResponse.account?.username);
      if (redirectResponse.account) {
        msalInstance.setActiveAccount(redirectResponse.account);
        await handleMSALSuccess(redirectResponse);
        return;
      }
    }
    
    // Check for existing accounts (React pattern)
    const accounts = msalInstance.getAllAccounts();
    console.log('👤 Existing accounts found:', accounts.length);
    
    if (accounts.length > 0) {
      console.log('👤 Using existing account:', accounts[0].username);
      if (!msalInstance.getActiveAccount()) {
        msalInstance.setActiveAccount(accounts[0]);
      }
      
      // Try to get token silently for existing account
      try {
        const silentRequest = {
          scopes: ["https://graph.microsoft.com/User.Read"],
          account: accounts[0],
          forceRefresh: false
        };
        const response = await msalInstance.acquireTokenSilent(silentRequest);
        console.log('🔑 Silent token acquired successfully');
        await handleMSALSuccess(response);
        return;
      } catch (silentError) {
        console.log('⚠️ Silent token acquisition failed, continuing with popup');
      }
    }
    
    // Login with popup (fallback)
    console.log('🚀 Starting MSAL popup login...');
    
    // Configure login request following React MSAL patterns
    const loginRequest = {
      scopes: ["https://graph.microsoft.com/User.Read"],
      prompt: "select_account",
      extraQueryParameters: {},
      forceRefresh: false,
      redirectUri: window.location.origin,
      authority: msalConfig.authority
    };
    
    console.log('🔧 Login request config:', loginRequest);
    
    try {
      console.log('🔓 Starting MSAL popup login (React pattern)...');
      
      // Use the same pattern as React: direct popup call without pre-testing
      const response = await msalInstance.loginPopup(loginRequest);
      console.log('✅ Popup login successful:', response.account?.username);
      
      // Set active account (React pattern)
      if (response.account) {
        msalInstance.setActiveAccount(response.account);
        console.log('👤 Active account set:', response.account.username);
      }
      
      // Update UI to show success
      $("#loginMsg").innerHTML = `
        <strong>Inloggning lyckades!</strong><br>
        <small>Loggar in som ${response.account?.username}...</small>
      `;
      $("#loginMsg").classList.remove("hidden");
      
      await handleMSALSuccess(response);
      
    } catch (popupError) {
      console.error('❌ Popup login failed:', popupError);
      
      // Handle specific popup errors (React pattern)
      let errorMessage = "Microsoft-inloggning misslyckades";
      let errorDetails = popupError.message;
      
      if (popupError.errorCode === 'popup_window_error' || popupError.message?.includes('popup_window_error')) {
        errorMessage = "Popup blockerad!";
        errorDetails = "Tillåt popups för denna sida i webbläsarinställningar och försök igen.";
      } else if (popupError.errorCode === 'user_cancelled' || popupError.message?.includes('user_cancelled')) {
        errorMessage = "Inloggning avbruten";
        errorDetails = "Du avbröt Microsoft-inloggningen. Försök igen eller använd vanlig inloggning nedan.";
      } else if (popupError.errorCode === 'interaction_in_progress' || popupError.message?.includes('interaction_in_progress')) {
        errorMessage = "Inloggning pågår redan";
        errorDetails = "Vänta tills den aktuella inloggningen är klar eller ladda om sidan.";
      } else if (popupError.message?.includes('network')) {
        errorMessage = "Nätverksfel";
        errorDetails = "Kontrollera internetanslutningen och försök igen.";
      }
      
      $("#loginMsg").innerHTML = `
        <strong>${errorMessage}</strong><br>
        <small>${errorDetails}</small>
      `;
      
      $("#loginMsg").classList.remove("hidden");
      return;
    }
    
    
    async function handleMSALSuccess(response) {
      console.log('🎉 MSAL authentication successful, processing...');
      
      try {
        // Show progress to user
        $("#loginMsg").innerHTML = `
          <strong>Autentisering lyckad!</strong><br>
          <small>Utbyter token med servern...</small>
        `;
        $("#loginMsg").classList.remove("hidden");
        
        // Exchange token with backend
        const exchangeResponse = await fetch(API + "/api/auth/msal-exchange", {
          method: "POST",
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            accessToken: response.accessToken,
            idToken: response.idToken,
            account: response.account
          })
        });
        
        const exchangeResult = await exchangeResponse.json();
        
        if (!exchangeResponse.ok) {
          throw new Error(exchangeResult.error || "Token exchange failed");
        }
        
        console.log('✅ Token exchange successful');
        
        // Set authentication
        setAuth(exchangeResult.token, exchangeResult.user.role, exchangeResult.user.name);
        
        // Show final success message
        $("#loginMsg").innerHTML = `
          <strong>Välkommen ${exchangeResult.user.name}!</strong><br>
          <small>Laddar applikationen...</small>
        `;
        
        // Initialize notification system on login
        if (!window.notificationSystem) {
          window.notificationSystem = new NotificationSystem();
        }
        
        // Navigate to main app
        setTimeout(() => {
          renderForm(); 
          show(views.form);
        }, 1000);
        
      } catch (error) {
        console.error('❌ Token exchange failed:', error);
        $("#loginMsg").innerHTML = `
          <strong>Serverfel</strong><br>
          <small>${error.message || "Kunde inte utbyta token med servern"}</small>
        `;
        $("#loginMsg").classList.remove("hidden");
      }
    }
    
  } catch (error) {
    console.error("MSAL login error:", error);
    
    // Provide user-friendly error messages based on error type
    let errorMessage = "Microsoft login är inte tillgänglig just nu. Vänligen använd vanlig inloggning med användarnamn och lösenord.";
    
    if (error.message.includes('popup')) {
      errorMessage = "Popup blockerad! Tillåt popups för denna sida och försök igen.";
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = "Nätverksfel: Kontrollera din internetanslutning och försök igen.";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Microsoft-inloggning tog för lång tid. Försök igen eller använd vanlig inloggning.";
    }
    
    $("#loginMsg").innerHTML = `
      <strong>${errorMessage}</strong><br>
      <small>Teknisk information: ${error.message}</small>
    `;
    $("#loginMsg").classList.remove("hidden");
  }
};

// Update Microsoft login button status based on availability
function updateMicrosoftLoginStatus(available, message = '') {
  const msalBtn = $("#msalLoginBtn");
  const networkStatus = $("#networkStatus");
  const networkStatusText = $("#networkStatusText");
  
  if (available) {
    msalBtn.disabled = false;
    msalBtn.style.opacity = '1';
    msalBtn.style.cursor = 'pointer';
    networkStatusText.textContent = message || 'Microsoft-inloggning tillgänglig';
    networkStatus.className = 'network-status success';
    networkStatus.classList.remove('hidden');
  } else {
    msalBtn.disabled = true;
    msalBtn.style.opacity = '0.6';
    msalBtn.style.cursor = 'not-allowed';
    networkStatusText.textContent = message || 'Microsoft-inloggning inte tillgänglig';
    networkStatus.className = 'network-status error';
    networkStatus.classList.remove('hidden');
  }
}

// Test network connectivity to CDN sources
async function testNetworkConnectivity() {
  const testUrls = [
    'https://alcdn.msauth.net',
    'https://cdn.jsdelivr.net', 
    'https://unpkg.com'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(url + '/favicon.ico', { 
        method: 'HEAD', 
        signal: controller.signal,
        mode: 'no-cors' 
      });
      
      clearTimeout(timeoutId);
      results.push({ url, status: 'accessible' });
      console.log('✅ CDN accessible:', url);
    } catch (error) {
      results.push({ url, status: 'blocked', error: error.message });
      console.log('❌ CDN blocked:', url, error.message);
    }
  }
  
  return results;
}

// Load MSAL library dynamically with fallback CDNs
function loadMSALScript() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof msal !== 'undefined') {
      console.log('🔒 MSAL already loaded');
      resolve();
      return;
    }
    
    // List of CDN URLs to try (using latest stable version)
    const cdnUrls = [
      'https://alcdn.msauth.net/browser/3.0.0/js/msal-browser.min.js',
      'https://cdn.jsdelivr.net/npm/@azure/msal-browser@3.0.0/lib/msal-browser.min.js',
      'https://unpkg.com/@azure/msal-browser@3.0.0/lib/msal-browser.min.js'
    ];
    
    let currentIndex = 0;
    
    function tryLoadScript() {
      if (currentIndex >= cdnUrls.length) {
        console.log('⚠️ All MSAL CDN sources failed, using mock fallback');
        // Use mock fallback
        if (typeof msalMock !== 'undefined') {
          window.msal = window.msalMock;
          resolve();
        } else {
          reject(new Error('Failed to load MSAL script from all CDN sources and no mock available'));
        }
        return;
      }
      
      const script = document.createElement('script');
      script.src = cdnUrls[currentIndex];
      script.async = true;
      
      console.log(`🔄 Trying MSAL CDN ${currentIndex + 1}/${cdnUrls.length}:`, script.src);
      
      const timeout = setTimeout(() => {
        console.log('⏰ MSAL script load timeout, trying next CDN');
        script.remove();
        currentIndex++;
        tryLoadScript();
      }, 10000); // 10 second timeout
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ MSAL script loaded, checking availability...');
        
        // Give it a moment to fully initialize
        setTimeout(() => {
          if (typeof msal !== 'undefined') {
            console.log('✅ MSAL library ready');
            resolve();
          } else {
            console.log('❌ MSAL object not available, trying next CDN');
            currentIndex++;
            tryLoadScript();
          }
        }, 200);
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        console.log(`❌ Failed to load MSAL from CDN ${currentIndex + 1}, trying next...`);
        currentIndex++;
        tryLoadScript();
      };
      
      document.head.appendChild(script);
    }
    
    tryLoadScript();
  });
}

// Initialize MSAL configuration on page load
loadMSALConfig();

// Test network on page load and show status
document.addEventListener('DOMContentLoaded', async () => {
  // ... existing DOM ready code ...
  
  // Test Microsoft login availability and show status
  setTimeout(async () => {
    console.log('🔍 Testing Microsoft login availability...');
    
    // Test MSAL configuration availability
    const configAvailable = msalConfig || await loadMSALConfig();
    
    if (!configAvailable) {
      updateMicrosoftLoginStatus(false, 'Microsoft-konfiguration saknas');
      return;
    }
    
    // Test network connectivity
    const networkStatus = await testNetworkConnectivity();
    const accessibleCDNs = networkStatus.filter(r => r.status === 'accessible').length;
    
    if (accessibleCDNs === 0) {
      updateMicrosoftLoginStatus(false, 'Nätverket blockerar Microsoft-tjänster');
    } else if (accessibleCDNs < networkStatus.length) {
      updateMicrosoftLoginStatus(true, `Begränsad Microsoft-inloggning (${accessibleCDNs}/${networkStatus.length} CDN:er tillgängliga)`);
    } else {
      updateMicrosoftLoginStatus(true, 'Microsoft-inloggning tillgänglig');
    }
    
    // Also update the general network status display
    updateNetworkStatusDisplay(networkStatus);
  }, 1000);
});

// Update network status display
function updateNetworkStatusDisplay(networkResults) {
  const networkStatusDiv = $("#networkStatus");
  const networkStatusText = $("#networkStatusText");
  const testUserHints = $("#testUserHints");
  
  if (!networkStatusDiv || !networkStatusText) return;
  
  const accessibleCDNs = networkResults.filter(r => r.status === 'accessible').length;
  const totalCDNs = networkResults.length;
  
  networkStatusDiv.classList.remove('hidden');
  
  if (accessibleCDNs === 0) {
    networkStatusDiv.className = 'network-status blocked';
    networkStatusText.textContent = 'Microsoft-inloggning blockerad (alla CDN:er otillgängliga)';
    
    // Show test user hints when MSAL is blocked
    if (testUserHints) {
      testUserHints.classList.remove('hidden');
    }
  } else if (accessibleCDNs < totalCDNs) {
    networkStatusDiv.className = 'network-status';
    networkStatusText.textContent = `Begränsad Microsoft-inloggning (${accessibleCDNs}/${totalCDNs} CDN:er tillgängliga)`;
    
    // Hide test user hints when some MSAL access is available
    if (testUserHints) {
      testUserHints.classList.add('hidden');
    }
  } else {
    networkStatusDiv.className = 'network-status accessible';
    networkStatusText.textContent = 'Microsoft-inloggning tillgänglig';
    
    // Hide test user hints when MSAL is fully available
    if (testUserHints) {
      testUserHints.classList.add('hidden');
    }
  }
}

// --- FORM (återanvänder logiken från MVP: risk & checklist) ---
function formHTML(){
  return `
  <h2>Ny riskbedömning</h2>
  <div class="grid2">
    <label>Datum<input type="date" id="f_datum"></label>
    <label>Namn<input id="f_namn" value="${name||''}"></label>
    <label>Team<input id="f_team"></label>
    <label>Plats<input id="f_plats"></label>
  </div>
  <label>Arbetsuppgift<input id="f_task" placeholder="Kort beskrivning"></label>

  <div class="grid3" style="margin-top:8px">
    <label>Sannolikhet (1–5)<input type="number" id="f_s" min="1" max="5" value="1"></label>
    <label>Konsekvens (1–5)<input type="number" id="f_k" min="1" max="5" value="1"></label>
    <label>Riskpoäng<input id="f_r" readonly></label>
  </div>
  <label>Identifierade risker<textarea id="f_risks" rows="3"></textarea></label>

  <h3>Checklista</h3>
  <div id="f_list"></div>
  <p id="f_warn" class="warn hidden">Minst ett svar är Nej – kräver arbetsledarens godkännande.</p>

  <h3>Åtgärder</h3>
  <textarea id="f_actions" rows="3" placeholder="Spärra av, LOTO, skyltning, fallskydd, mät/ventilera ..."></textarea>

  <h3>Bilder och Dokumentation</h3>
  <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
    Ladda upp bilder av arbetsmiljön, utrustning eller andra relevanta förhållanden för bedömningen.
  </p>
  ${window.imageUploadManager ? window.imageUploadManager.createImageUploadHTML() : '<div>Bilduppladdning laddas...</div>'}

  <div class="grid2">
    <label>Behövs ytterligare åtgärder?
      <select id="f_further"><option>Nej</option><option>Ja</option></select>
    </label>
    <label>Behövs full riskanalys framåt?
      <select id="f_fullrisk"><option>Nej</option><option>Ja</option></select>
    </label>
  </div>

  <h3>Godkännande</h3>
  <div class="grid1">
    <label>Kan arbetet utföras säkert?
      <select id="f_safe"><option>Ja</option><option>Nej</option></select>
    </label>
  </div>

  <div style="margin-top:10px">
    <button id="f_submit">Skicka</button>
    <span id="f_msg"></span>
  </div>
  `;
}
function renderForm(){
  $("#formView").innerHTML = formHTML();
  const list = $("#f_list");
  const Q = [
    "Risker/resternergier bedömda (Safety Placard som stöd)?",
    "Fallrisker eliminerade?",
    "Kläm-/skär-/kraftrisker hanterade?",
    "Rätt verktyg/PPE tillgängligt?",
    "Tillstånd/behörighet (heta arbeten/slutna utrymmen) klart?",
    "Snubbel/olja/lösa föremål undanröjda?",
    "Avspärrningar/kommunikation/skyltning klar?",
    "Utrustning i gott skick för lyft/lastsäkring?",
    "Nödvändig utrustning kontrollerad före användning?",
    "Känt var nödstopp/utrymning/ögondusch finns?"
  ];
  Q.forEach((q,i)=>{
    const row=document.createElement("div"); row.className="grid3";
    row.innerHTML=`<label style="grid-column:1/3">${q}</label>
      <label><select id="q${i}"><option></option><option>Ja</option><option>Nej</option></select></label>`;
    list.appendChild(row);
  });
  const calc=()=>{ const s=+$("#f_s").value||1, k=+$("#f_k").value||1, r=s*k; $("#f_r").value=r;
    const anyNej = Q.some((_,i)=>($("#q"+i).value==="Nej")); $("#f_warn").classList.toggle("hidden",!anyNej);
  };
  ["f_s","f_k"].forEach(id=>$("#"+id).addEventListener("input",calc));
  list.addEventListener("change",calc); calc();

  $("#f_submit").onclick = async ()=>{
    try {
      console.log('📝 Form submission started...');
      
      // Check if user is authenticated
      if (!token) {
        alert('Du måste logga in först!');
        return;
      }
      
      const checklist = Q.map((_,i)=>$("#q"+i).value||"");
      
      // Get uploaded images if image upload manager is available
      const uploadedImages = window.imageUploadManager ? window.imageUploadManager.getUploadedImages() : [];
      
      const body = {
        date: $("#f_datum").value,
        worker_name: $("#f_namn").value,
        team: $("#f_team").value,
        location: $("#f_plats").value,
        task: $("#f_task").value,
        risk_s: +$("#f_s").value, risk_k: +$("#f_k").value,
        risks: $("#f_risks").value, checklist,
        actions: $("#f_actions").value,
        further: $("#f_further").value, fullrisk: $("#f_fullrisk").value,
        safe: $("#f_safe").value,
        images: uploadedImages.map(img => ({
          name: img.name,
          size: img.size,
          type: img.type,
          url: img.url
        }))
      };
      
      console.log('📦 Sending data:', body);
      console.log('🔗 API URL:', API + "/api/assessments");
      
      const res = await fetch(API+"/api/assessments",{method:"POST",
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify(body)});
        
      console.log('📡 Response status:', res.status, res.statusText);
      
      const js = await res.json();
      console.log('📄 Response data:', js);
      
      const msg=$("#f_msg");
      if(!res.ok){ 
        console.error('❌ Server error:', js.error);
        msg.className="warn"; 
        msg.textContent=js.error||"Fel"; 
        alert('Fel vid skickande: ' + (js.error || 'Okänt fel'));
        return; 
      }
      
      msg.className="ok"; msg.textContent=`Skickad. ID ${js.id}, risk=${js.riskScore}`;
      
      // Clear uploaded images after successful submission
      if (window.imageUploadManager) {
        window.imageUploadManager.clearImages();
      }
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification('Riskbedömning skickad framgångsrikt! 🎉', 'success');
      }
      
      console.log('✅ Form submitted successfully!');
      
    } catch (error) {
      console.error('💥 Form submission error:', error);
      const msg=$("#f_msg");
      msg.className="warn"; 
      msg.textContent="Nätverksfel eller serverfel";
      alert('Fel vid skickande: ' + error.message);
    }
  };
}

// --- list helpers
function table(rows, canApprove=false){
  const tr = r => `<tr>
    <td>${r.id}</td><td>${r.date?.slice(0,10)||""}</td>
    <td>${r.worker_name}</td><td>${r.location||""}</td><td>${r.task||""}</td>
    <td>${r.risk_score} ${badge(r.risk_score)}</td>
    <td><span class="status-badge status-${r.status?.toLowerCase()}">${r.status||'Submitted'}</span></td>
    <td>${r.created_by_name||""}</td>
    <td>
      ${canApprove && r.status==='Pending' ? `
        <button data-approve="${r.id}" class="btn-approve" title="Godkänn">✓</button>
        <button data-reject="${r.id}" class="btn-reject" title="Avvisa">✗</button>
      `:''} 
      <button data-pdf="${r.id}" title="PDF">📄</button>
      ${canApprove ? `<button data-sp="${r.id}" title="SharePoint">📤</button>`:''} 
    </td>
  </tr>`;
  return `<table class="table">
    <thead><tr><th>ID</th><th>Datum</th><th>Namn</th><th>Plats</th><th>Uppgift</th><th>Risk</th><th>Status</th><th>Skapad av</th><th>Åtgärder</th></tr></thead>
    <tbody>${rows.map(tr).join("")}</tbody>
  </table>`;
}
function badge(score){
  if(score<=4) return `<span class="badge low">Låg</span>`;
  if(score<=9) return `<span class="badge mid">Medel</span>`;
  return `<span class="badge high">Hög</span>`;
}

async function loadMine(){
  const res = await fetch(API+"/api/assessments?mine=1",{headers:{Authorization:'Bearer '+token}});
  const rows = await res.json();
  $("#mineTable").innerHTML = table(rows,false);
}
async function loadDash(){
  const st = await fetch(API+"/api/assessments/stats",{headers:{Authorization:'Bearer '+token}}).then(r=>r.json());
  $("#stats").innerHTML = `
    <div>Totalt: <b>${st.total||0}</b></div>
    <div>Öppna: <b>${st.open||0}</b></div>
    <div>Låg: <b>${st.low||0}</b> • Medel: <b>${st.mid||0}</b> • Hög: <b>${st.high||0}</b>
  `;
  const all = await fetch(API+"/api/assessments",{headers:{Authorization:'Bearer '+token}}).then(r=>r.json());
  const canApprove = (role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare");
  $("#allTable").innerHTML = table(all, canApprove);
  $("#allTable").onclick = async (e)=>{
  const id = e.target?.dataset?.approve;
  const rejectId = e.target?.dataset?.reject;
  const pdfId = e.target?.dataset?.pdf;
  const spId  = e.target?.dataset?.sp;

  if (id) {
    await fetch(API+`/api/assessments/${id}/approve`,{method:"POST",headers:{Authorization:'Bearer '+token}});
    window.showNotification('Riskbedömning godkänd! Användaren har meddelats.', 'success');
    loadDash(); return;
  }
  if (rejectId) {
    const reason = prompt('Anledning till avvisning (valfritt):');
    await fetch(API+`/api/assessments/${rejectId}/reject`,{
      method:"POST",
      headers:{Authorization:'Bearer '+token, 'Content-Type':'application/json'},
      body: JSON.stringify({reason})
    });
    window.showNotification('Riskbedömning avvisad! Användaren har meddelats.', 'info');
    loadDash(); return;
  }
  if (pdfId) {
    window.open(API+`/api/assessments/${pdfId}/pdf?auth=${token}`,'_blank');
    return;
  }
  if (spId) {
    const res = await fetch(API+`/api/assessments/${spId}/upload`,{method:"POST",headers:{Authorization:'Bearer '+token}});
    const js = await res.json();
    if(res.ok){ alert("Uppladdad till SharePoint:\n"+js.webUrl); } else { alert("Fel vid uppladdning"); }
    return;
  }
};

}
$("#refreshDash").onclick = loadDash;

// --- Users (Admin)
async function loadUsers(){
  if(role!=="admin") return;
  const res = await fetch(API+"/api/users",{headers:{Authorization:'Bearer '+token}});
  const rows = await res.json();
  $("#usersTable").innerHTML = `
    <table class="table"><thead><tr><th>ID</th><th>Namn</th><th>Användare</th><th>Roll</th><th>Aktiv</th><th>Ändra</th><th>Radera</th></tr></thead>
    <tbody>
    ${rows.map(r=>`<tr>
      <td>${r.id}</td><td>${r.name}</td><td>${r.username}</td><td>${r.role}</td><td>${r.active? "Ja":"Nej"}</td>
      <td><button data-edit="${r.id}">Ändra</button></td>
      <td><button data-del="${r.id}">Radera</button></td>
    </tr>`).join("")}
    </tbody></table>
  `;
  $("#usersTable").onclick = async e=>{
    if(e.target.dataset.del){
      const id = +e.target.dataset.del;
      await fetch(API+"/api/users/"+id,{method:"DELETE",headers:{Authorization:'Bearer '+token}});
      loadUsers();
    }
    if(e.target.dataset.edit){
      const id = +e.target.dataset.edit;
      const name = prompt("Nytt namn:"); if(!name) return;
      const role = prompt("Roll (underhall/supervisor/superintendent/admin/arbetsledare):");
      const active = prompt("Aktiv? (1/0):","1");
      await fetch(API+"/api/users/"+id,{method:"PUT",
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body: JSON.stringify({name,role,active:+active})
      });
      loadUsers();
    }
  };
}
$("#addUser").onclick = async ()=>{
  const body = {
    name: $("#u_name").value.trim(),
    username: $("#u_user").value.trim(),
    password: $("#u_pass").value,
    role: $("#u_role").value,
    active: +$("#u_active").value
  };
  const res = await fetch(API+"/api/users",{method:"POST",headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(res.ok){ loadUsers(); } else { alert("Kunde inte skapa användare"); }
};
