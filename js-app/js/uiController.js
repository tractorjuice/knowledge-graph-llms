export class UIController {
    constructor(app) {
        this.app = app;
        this.isFullscreen = false;
        this.controlsCollapsed = false;
        
        this.setupResponsiveHandlers();
    }

    setupResponsiveHandlers() {
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Handle fullscreen changes
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
    }

    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (this.app.getNetwork()) {
                this.app.getNetwork().redraw();
            }
            this.adjustLayoutForScreenSize();
        }, 150);
    }

    adjustLayoutForScreenSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Mobile adjustments
        if (width < 768) {
            this.enableMobileMode();
        } else {
            this.disableMobileMode();
        }
        
        // Very small screens
        if (width < 480) {
            this.enableCompactMode();
        } else {
            this.disableCompactMode();
        }
    }

    enableMobileMode() {
        document.body.classList.add('mobile-mode');
        
        // Auto-collapse controls on mobile
        if (!this.controlsCollapsed) {
            this.toggleControls();
        }
        
        // Adjust graph container
        const container = document.getElementById('networkContainer');
        if (container) {
            container.style.touchAction = 'pan-x pan-y';
        }
    }

    disableMobileMode() {
        document.body.classList.remove('mobile-mode');
        
        // Restore controls if auto-collapsed
        if (this.controlsCollapsed) {
            this.toggleControls();
        }
    }

    enableCompactMode() {
        document.body.classList.add('compact-mode');
        
        // Hide some UI elements
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            headerControls.style.display = 'none';
        }
    }

    disableCompactMode() {
        document.body.classList.remove('compact-mode');
        
        // Restore UI elements
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            headerControls.style.display = 'flex';
        }
    }

    handleFullscreenChange() {
        this.isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.textContent = this.isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
        }
        
        // Adjust layout after fullscreen change
        setTimeout(() => {
            if (this.app.getNetwork()) {
                this.app.getNetwork().redraw();
                this.app.getNetwork().fit();
            }
        }, 100);
    }

    toggleControls() {
        const controlsPanel = document.getElementById('controlsPanel');
        const toggleBtn = document.getElementById('toggleControls');
        
        this.controlsCollapsed = !this.controlsCollapsed;
        
        if (this.controlsCollapsed) {
            controlsPanel.classList.add('collapsed');
            toggleBtn.textContent = '+';
        } else {
            controlsPanel.classList.remove('collapsed');
            toggleBtn.textContent = '−';
        }
        
        // Trigger graph redraw after animation
        setTimeout(() => {
            if (this.app.getNetwork()) {
                this.app.getNetwork().redraw();
            }
        }, 300);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('visible');
            
            // Focus trap for accessibility
            this.setupFocusTrap(modal);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('visible');
            this.removeFocusTrap(modal);
        }
    }

    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        
        modal.addEventListener('keydown', handleTabKey);
        modal._focusTrapHandler = handleTabKey;
        
        // Focus first element
        firstElement.focus();
    }

    removeFocusTrap(modal) {
        if (modal._focusTrapHandler) {
            modal.removeEventListener('keydown', modal._focusTrapHandler);
            delete modal._focusTrapHandler;
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        });
        
        // Set background color based on type
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }

    showLoadingSpinner(message = 'Loading...') {
        let spinner = document.getElementById('loadingSpinner');
        
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.id = 'loadingSpinner';
            spinner.innerHTML = `
                <div class="spinner-overlay">
                    <div class="spinner-content">
                        <div class="spinner"></div>
                        <div class="spinner-message">${message}</div>
                    </div>
                </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                #loadingSpinner {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                
                .spinner-content {
                    text-align: center;
                    color: white;
                }
                
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                .spinner-message {
                    font-size: 1.1rem;
                    font-weight: 500;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(spinner);
        } else {
            spinner.querySelector('.spinner-message').textContent = message;
            spinner.style.display = 'flex';
        }
    }

    hideLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    updateProgress(current, total, message) {
        const percentage = Math.round((current / total) * 100);
        
        let progressBar = document.getElementById('progressIndicator');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'progressIndicator';
            progressBar.innerHTML = `
                <div class="progress-overlay">
                    <div class="progress-content">
                        <div class="progress-message">${message}</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill"></div>
                        </div>
                        <div class="progress-percentage">${percentage}%</div>
                    </div>
                </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                #progressIndicator {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                
                .progress-content {
                    text-align: center;
                    color: white;
                    min-width: 300px;
                }
                
                .progress-message {
                    font-size: 1.1rem;
                    margin-bottom: 20px;
                }
                
                .progress-bar-container {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }
                
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3498db, #2ecc71);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                
                .progress-percentage {
                    font-size: 1.2rem;
                    font-weight: 600;
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(progressBar);
        }
        
        // Update content
        progressBar.querySelector('.progress-message').textContent = message;
        progressBar.querySelector('.progress-percentage').textContent = `${percentage}%`;
        progressBar.querySelector('.progress-bar-fill').style.width = `${percentage}%`;
        progressBar.style.display = 'flex';
    }

    hideProgress() {
        const progressBar = document.getElementById('progressIndicator');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }

    // Accessibility helpers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        // Add screen reader only styles
        Object.assign(announcement.style, {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0'
        });
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    setTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        
        // Save preference
        localStorage.setItem('kg-theme', theme);
    }

    getTheme() {
        return localStorage.getItem('kg-theme') || 'dark';
    }

    initializeTheme() {
        const savedTheme = this.getTheme();
        this.setTheme(savedTheme);
    }
}