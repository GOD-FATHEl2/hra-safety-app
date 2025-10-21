// Enhanced Dynamic Interactions for HRA Application
// This script adds modern UI enhancements and smooth animations

class DynamicUI {
    constructor() {
        this.init();
    }

    init() {
        this.addPageTransitions();
        this.enhanceButtons();
        this.addParallaxEffects();
        this.createFloatingElements();
        this.addTypewriterEffect();
        this.enhanceFormInteractions();
        this.addProgressAnimations();
        this.createNotificationSystem();
    }

    // Add smooth page transitions
    addPageTransitions() {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.transition = 'opacity 0.6s ease-in-out';
                document.body.style.opacity = '1';
            }, 100);
        });

        // Add stagger animation to cards
        this.staggerCards();
    }

    staggerCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 150 * (index + 1));
        });
    }

    // Enhance button interactions with ripple effects
    enhanceButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.classList.contains('btn')) {
                this.createRippleEffect(e);
            }
        });
    }

    createRippleEffect(e) {
        const button = e.target;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Add parallax scrolling effects
    addParallaxEffects() {
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.card, .form-group');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                const yPos = -(scrolled * speed / 100);
                element.style.transform = `translateY(${yPos}px)`;
            });
            
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestTick);
    }

    // Create floating action elements
    createFloatingElements() {
        // Add floating help button
        const helpButton = document.createElement('button');
        helpButton.className = 'floating-element';
        helpButton.innerHTML = '?';
        helpButton.title = 'Hjälp';
        helpButton.onclick = () => this.showHelpModal();
        document.body.appendChild(helpButton);

        // Add floating back to top button
        const topButton = document.createElement('button');
        topButton.className = 'floating-element';
        topButton.innerHTML = '↑';
        topButton.title = 'Tillbaka till toppen';
        topButton.style.bottom = '6rem';
        topButton.style.opacity = '0';
        topButton.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                topButton.style.opacity = '1';
            } else {
                topButton.style.opacity = '0';
            }
        });
        
        document.body.appendChild(topButton);
    }

    // Add typewriter effect to headers
    addTypewriterEffect() {
        const headers = document.querySelectorAll('h1, h2');
        headers.forEach(header => {
            if (header.textContent && header.textContent.length > 10) {
                const text = header.textContent;
                header.textContent = '';
                header.style.borderRight = '2px solid var(--brand-primary)';
                header.style.animation = 'blink 1s infinite';
                
                let index = 0;
                const typeInterval = setInterval(() => {
                    header.textContent += text[index];
                    index++;
                    
                    if (index >= text.length) {
                        clearInterval(typeInterval);
                        setTimeout(() => {
                            header.style.borderRight = 'none';
                            header.style.animation = 'none';
                        }, 1000);
                    }
                }, 50);
            }
        });
    }

    // Enhance form interactions
    enhanceFormInteractions() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Add focus animations
            input.addEventListener('focus', (e) => {
                e.target.parentElement.classList.add('focused');
                this.createFocusGlow(e.target);
            });
            
            input.addEventListener('blur', (e) => {
                e.target.parentElement.classList.remove('focused');
                if (!e.target.value) {
                    e.target.parentElement.classList.remove('filled');
                } else {
                    e.target.parentElement.classList.add('filled');
                }
            });
            
            // Add typing sound effect (visual)
            input.addEventListener('input', (e) => {
                this.addTypingEffect(e.target);
            });
        });
    }

    createFocusGlow(element) {
        const glow = document.createElement('div');
        glow.className = 'focus-glow';
        glow.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, var(--brand-primary), var(--brand-secondary));
            border-radius: inherit;
            z-index: -1;
            opacity: 0;
            animation: glowPulse 0.3s ease-out forwards;
        `;
        
        element.style.position = 'relative';
        element.parentElement.appendChild(glow);
        
        setTimeout(() => glow.remove(), 2000);
    }

    addTypingEffect(element) {
        element.style.transform = 'scale(1.02)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 100);
    }

    // Add progress animations to forms
    addProgressAnimations() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
            let progress = 0;
            
            const updateProgress = () => {
                const filled = Array.from(inputs).filter(input => input.value.trim() !== '').length;
                progress = (filled / inputs.length) * 100;
                
                let progressBar = form.querySelector('.progress-bar');
                if (!progressBar) {
                    progressBar = this.createProgressBar();
                    form.insertBefore(progressBar, form.firstChild);
                }
                
                progressBar.style.width = `${progress}%`;
                progressBar.textContent = `${Math.round(progress)}% komplett`;
            };
            
            inputs.forEach(input => {
                input.addEventListener('input', updateProgress);
                input.addEventListener('change', updateProgress);
            });
            
            updateProgress();
        });
    }

    createProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.style.cssText = `
            width: 100%;
            height: 4px;
            background: var(--border-light);
            border-radius: 2px;
            margin-bottom: 1rem;
            overflow: hidden;
        `;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.cssText = `
            height: 100%;
            background: var(--gradient-primary);
            border-radius: 2px;
            transition: width 0.3s ease;
            width: 0%;
            position: relative;
            font-size: 0.75rem;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        progressContainer.appendChild(progressBar);
        return progressContainer;
    }

    // Create notification system
    createNotificationSystem() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.className = 'notification-container';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        `;
        document.body.appendChild(this.notificationContainer);
        
        // Listen for custom notification events
        window.addEventListener('showNotification', (e) => {
            this.showNotification(e.detail.message, e.detail.type);
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            padding: 1rem 1.5rem;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            box-shadow: var(--shadow-float);
            transform: translateX(100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 250px;
            cursor: pointer;
        `;
        
        const backgrounds = {
            success: 'var(--gradient-success)',
            error: 'var(--gradient-error)',
            warning: 'var(--gradient-warning)',
            info: 'var(--gradient-primary)'
        };
        
        notification.style.background = backgrounds[type] || backgrounds.info;
        notification.textContent = message;
        
        notification.onclick = () => this.hideNotification(notification);
        
        this.notificationContainer.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);
    }

    hideNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }

    showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content glass';
        modalContent.style.cssText = `
            padding: 2rem;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;
        
        modalContent.innerHTML = `
            <h2 class="neon-glow">🔧 HRA Hjälp</h2>
            <p>Denna applikation hjälper dig att hantera högriskarbeten säkert och effektivt.</p>
            <ul style="text-align: left; margin: 1rem 0;">
                <li>🔐 Logga in med dina användaruppgifter</li>
                <li>📝 Skapa nya riskbedömningar</li>
                <li>👥 Samarbeta med ditt team</li>
                <li>📊 Följ upp säkerhetsdata</li>
                <li>📄 Generera PDF-rapporter</li>
            </ul>
            <button onclick="this.closest('.modal-overlay').remove()" class="btn-primary">
                Stäng
            </button>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 100);
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }
}

// Add custom CSS animations for the enhanced features
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes blink {
        0%, 50% { border-color: var(--brand-primary); }
        51%, 100% { border-color: transparent; }
    }
    
    @keyframes glowPulse {
        0% { opacity: 0; transform: scale(0.9); }
        100% { opacity: 0.6; transform: scale(1); }
    }
    
    .form-group.focused input,
    .form-group.focused textarea,
    .form-group.focused select {
        box-shadow: 0 0 0 3px rgba(255, 154, 0, 0.3);
    }
    
    .notification {
        animation: notificationSlide 0.3s ease-out;
    }
    
    @keyframes notificationSlide {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;

document.head.appendChild(dynamicStyles);

// Initialize the dynamic UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DynamicUI();
});

// Global function to trigger notifications
window.showNotification = (message, type = 'info') => {
    window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { message, type }
    }));
};

// Add some demo interactions
document.addEventListener('DOMContentLoaded', () => {
    // Welcome notification
    setTimeout(() => {
        window.showNotification('Välkommen till HRA - Högriskarbete hantering! 🎉', 'success');
    }, 1000);
    
    // Add hover effects to existing elements
    const navLinks = document.querySelectorAll('nav a, nav button');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});