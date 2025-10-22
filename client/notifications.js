// Notification System for HRA Application
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.pollInterval = null;
        this.init();
    }

    init() {
        this.createNotificationUI();
        this.startPolling();
        this.setupEventListeners();
    }

    createNotificationUI() {
        // Add notification bell icon to navigation
        const nav = document.getElementById('nav');
        if (nav) {
            const notificationButton = document.createElement('button');
            notificationButton.id = 'notificationBtn';
            notificationButton.className = 'notification-btn';
            notificationButton.innerHTML = `
                <span class="notification-icon">🔔</span>
                <span class="notification-badge hidden" id="notificationBadge">0</span>
            `;
            notificationButton.title = 'Aviseringar';
            
            // Insert before logout button
            const logoutBtn = document.getElementById('logout');
            nav.insertBefore(notificationButton, logoutBtn);
        }
    }

    setupEventListeners() {
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.toggleNotificationPanel();
            });
        }
    }

    startPolling() {
        // Poll for new notifications every 30 seconds
        this.pollInterval = setInterval(() => {
            this.fetchNotifications();
        }, 30000);
        
        // Initial fetch
        this.fetchNotifications();
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    async fetchNotifications() {
        try {
            // Get token from auth object to match app.js format
            const auth = JSON.parse(localStorage.getItem('auth') || 'null');
            if (!auth || !auth.t) return;

            const response = await fetch('/api/notifications', {
                headers: { 'Authorization': 'Bearer ' + auth.t }
            });

            if (response.ok) {
                const notifications = await response.json();
                this.updateNotifications(notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    updateNotifications(notifications) {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
        this.updateBadge();
    }

    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.classList.remove('hidden');
                badge.style.animation = 'badgePulse 2s ease-in-out infinite';
            } else {
                badge.classList.add('hidden');
                badge.style.animation = 'none';
            }
        }
    }

    toggleNotificationPanel() {
        const existingPanel = document.getElementById('notificationPanel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        this.createNotificationPanel();
    }

    createNotificationPanel() {
        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';
        
        const header = `
            <div class="notification-header">
                <h3>Aviseringar</h3>
                <div class="notification-actions">
                    ${this.unreadCount > 0 ? '<button onclick="notificationSystem.markAllAsRead()" class="btn-text">Markera alla som lästa</button>' : ''}
                    <button onclick="notificationSystem.closePanel()" class="btn-text">✕</button>
                </div>
            </div>
        `;

        const notificationList = this.notifications.length > 0 ? 
            this.notifications.map(notification => this.createNotificationItem(notification)).join('') :
            '<div class="no-notifications">Inga aviseringar</div>';

        panel.innerHTML = header + '<div class="notification-list">' + notificationList + '</div>';
        
        document.body.appendChild(panel);
        
        // Animate in
        setTimeout(() => {
            panel.classList.add('show');
        }, 10);
    }

    createNotificationItem(notification) {
        const timeAgo = this.getTimeAgo(notification.created_at);
        const typeIcon = this.getTypeIcon(notification.type);
        
        // Add approval buttons for pending assessments if user has permission
        const approvalButtons = this.getApprovalButtons(notification);
        
        return `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
                 data-id="${notification.id}" 
                 onclick="notificationSystem.handleNotificationClick(${notification.id})">
                <div class="notification-icon-wrapper">
                    ${typeIcon}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                    ${approvalButtons}
                </div>
                ${!notification.read ? '<div class="unread-indicator"></div>' : ''}
            </div>
        `;
    }

    async approveAssessment(assessmentId, notificationId) {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || 'null');
            if (!auth || !auth.t) {
                window.showNotification('Inte inloggad', 'error');
                return;
            }
            
            const response = await fetch(`/api/assessments/${assessmentId}/approve`, {
                method: 'POST',
                headers: { 
                    'Authorization': 'Bearer ' + auth.t,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                window.showNotification('Riskbedömning godkänd!', 'success');
                // Mark notification as read and refresh
                await this.markAsRead(notificationId);
                this.fetchNotifications();
                
                // Refresh dashboard if visible
                if (typeof loadDash === 'function') {
                    loadDash();
                }
            } else {
                const error = await response.json();
                window.showNotification(error.error || 'Fel vid godkännande', 'error');
            }
        } catch (error) {
            console.error('Error approving assessment:', error);
            window.showNotification('Fel vid godkännande', 'error');
        }
    }
    
    async rejectAssessment(assessmentId, notificationId) {
        const reason = prompt('Anledning till avvisning (valfritt):');
        if (reason === null) return; // User cancelled
        
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || 'null');
            if (!auth || !auth.t) {
                window.showNotification('Inte inloggad', 'error');
                return;
            }
            
            const response = await fetch(`/api/assessments/${assessmentId}/reject`, {
                method: 'POST',
                headers: { 
                    'Authorization': 'Bearer ' + auth.t,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: reason.trim() })
            });
            
            if (response.ok) {
                window.showNotification('Riskbedömning avvisad', 'success');
                // Mark notification as read and refresh
                await this.markAsRead(notificationId);
                this.fetchNotifications();
                
                // Refresh dashboard if visible
                if (typeof loadDash === 'function') {
                    loadDash();
                }
            } else {
                const error = await response.json();
                window.showNotification(error.error || 'Fel vid avvisning', 'error');
            }
        } catch (error) {
            console.error('Error rejecting assessment:', error);
            window.showNotification('Fel vid avvisning', 'error');
        }
    }
    
    viewAssessment(assessmentId) {
        // Show assessment details in a modal or navigate to assessment view
        window.showNotification(`Visar riskbedömning ${assessmentId}`, 'info');
        // TODO: Implement assessment viewer modal
    }
    
    getApprovalButtons(notification) {
        // Only show approval buttons for pending assessments to users with permission
        if (notification.type !== 'assessment_pending') return '';
        
        // Check if user has permission to approve (arbetsledare, supervisor, superintendent, admin)
        const auth = JSON.parse(localStorage.getItem('auth') || 'null');
        if (!auth || !auth.r) return '';
        
        const canApprove = ['arbetsledare', 'supervisor', 'superintendent', 'admin'].includes(auth.r);
        if (!canApprove) return '';
        
        return `
            <div class="approval-buttons" onclick="event.stopPropagation()">
                <button class="approve-btn" onclick="notificationSystem.approveAssessment(${notification.assessment_id}, ${notification.id})">
                    ✅ Godkänn
                </button>
                <button class="reject-btn" onclick="notificationSystem.rejectAssessment(${notification.assessment_id}, ${notification.id})">
                    ❌ Avvisa
                </button>
                <button class="view-btn" onclick="notificationSystem.viewAssessment(${notification.assessment_id})">
                    👁️ Visa
                </button>
            </div>
        `;
    }
    
    getTypeIcon(type) {
        const icons = {
            'assessment_pending': '⏳',
            'assessment_approved': '✅',
            'assessment_rejected': '❌'
        };
        return icons[type] || '📌';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const created = new Date(timestamp);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just nu';
        if (diffMins < 60) return `${diffMins} min sedan`;
        if (diffHours < 24) return `${diffHours} h sedan`;
        if (diffDays < 7) return `${diffDays} dagar sedan`;
        return created.toLocaleDateString('sv-SE');
    }

    async handleNotificationClick(notificationId) {
        // Mark as read
        await this.markAsRead(notificationId);
        
        // Find the notification and potentially navigate to related assessment
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && notification.assessment_id) {
            // Could navigate to assessment view here
            window.showNotification(`Navigerar till riskbedömning ${notification.assessment_id}`, 'info');
        }
    }

    async markAsRead(notificationId) {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || 'null');
            if (!auth || !auth.t) return;
            
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + auth.t }
            });

            if (response.ok) {
                // Update local state
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.read = 1;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    this.updateBadge();
                    
                    // Update UI
                    const notificationItem = document.querySelector(`[data-id="${notificationId}"]`);
                    if (notificationItem) {
                        notificationItem.classList.remove('unread');
                        notificationItem.classList.add('read');
                        const indicator = notificationItem.querySelector('.unread-indicator');
                        if (indicator) indicator.remove();
                    }
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || 'null');
            if (!auth || !auth.t) return;
            
            const response = await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + auth.t }
            });

            if (response.ok) {
                // Update local state
                this.notifications.forEach(n => n.read = 1);
                this.unreadCount = 0;
                this.updateBadge();
                
                // Refresh panel
                this.closePanel();
                this.createNotificationPanel();
                
                window.showNotification('Alla aviseringar markerade som lästa', 'success');
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    closePanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('show');
            setTimeout(() => {
                if (panel.parentElement) {
                    panel.parentElement.removeChild(panel);
                }
            }, 300);
        }
    }

    // Call when user logs out
    cleanup() {
        this.stopPolling();
        this.closePanel();
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.remove();
        }
    }
}

// CSS for notification system
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-btn {
        position: relative;
        background: transparent;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .notification-btn:hover {
        background: rgba(255, 154, 0, 0.1);
    }

    .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: var(--error);
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 0.7rem;
        font-weight: bold;
        min-width: 18px;
        text-align: center;
    }

    .notification-panel {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 400px;
        max-width: 90vw;
        max-height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: var(--shadow-float);
        z-index: 1000;
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    }

    .notification-panel.show {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    .notification-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-light);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--gradient-glass);
    }

    .notification-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary);
    }

    .notification-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .btn-text {
        background: none;
        border: none;
        color: var(--brand-primary);
        cursor: pointer;
        font-size: 0.85rem;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .btn-text:hover {
        background: rgba(255, 154, 0, 0.1);
    }

    .notification-list {
        max-height: 500px;
        overflow-y: auto;
    }

    .notification-item {
        display: flex;
        padding: 1rem;
        border-bottom: 1px solid var(--border-light);
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }

    .notification-item:hover {
        background: var(--gradient-glass);
    }

    .notification-item.unread {
        background: linear-gradient(90deg, rgba(255, 154, 0, 0.05), transparent);
    }

    .notification-icon-wrapper {
        margin-right: 0.75rem;
        font-size: 1.5rem;
        display: flex;
        align-items: flex-start;
        padding-top: 0.25rem;
    }

    .notification-content {
        flex: 1;
    }

    .notification-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
    }

    .notification-message {
        color: var(--text-secondary);
        font-size: 0.85rem;
        line-height: 1.4;
        margin-bottom: 0.5rem;
    }

    .notification-time {
        color: var(--text-secondary);
        font-size: 0.75rem;
        opacity: 0.8;
    }

    .unread-indicator {
        position: absolute;
        top: 50%;
        right: 1rem;
        transform: translateY(-50%);
        width: 8px;
        height: 8px;
        background: var(--brand-primary);
        border-radius: 50%;
        animation: indicatorPulse 2s ease-in-out infinite;
    }

    @keyframes indicatorPulse {
        0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
        50% { opacity: 0.5; transform: translateY(-50%) scale(1.2); }
    }

    .no-notifications {
        padding: 2rem;
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
    }

    @media (max-width: 768px) {
        .notification-panel {
            right: 10px;
            left: 10px;
            width: auto;
            max-width: none;
        }
        
        .notification-btn {
            padding: 0.75rem;
        }
    }
`;

document.head.appendChild(notificationStyles);

// Global notification system instance
window.notificationSystem = null;

// Note: Notification system is initialized in app.js on login
// to ensure proper timing and avoid conflicts

// Cleanup on logout
const originalLogout = window.logout;
window.logout = function() {
    if (window.notificationSystem) {
        window.notificationSystem.cleanup();
        window.notificationSystem = null;
    }
    if (originalLogout) originalLogout();
};