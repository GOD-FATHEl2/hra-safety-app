// MSAL Mock for offline/CDN failure scenarios
// This provides basic fallback functionality when MSAL CDN is unavailable

window.msalMock = {
  PublicClientApplication: class {
    constructor(config) {
      this.config = config;
      this.eventCallbacks = [];
      console.log('🚧 Using MSAL Mock - Microsoft login not fully functional');
    }
    
    addEventCallback(callback) {
      this.eventCallbacks.push(callback);
    }
    
    async handleRedirectPromise() {
      // Mock version doesn't handle redirects
      return null;
    }
    
    async loginPopup() {
      // Simulate login failure with helpful message
      throw new Error('Microsoft login är inte tillgänglig just nu. Vänligen använd vanlig inloggning med användarnamn och lösenord.');
    }
    
    async acquireTokenSilent() {
      throw new Error('Token acquisition not available in mock mode');
    }
    
    getAllAccounts() {
      return [];
    }
    
    setActiveAccount(account) {
      // Mock implementation
      this.activeAccount = account;
    }
    
    getActiveAccount() {
      return this.activeAccount || null;
    }
  }
};

// Provide mock if MSAL fails to load
if (typeof msal === 'undefined') {
  window.msal = window.msalMock;
  console.log('🚧 MSAL Mock activated - falling back to traditional login');
}