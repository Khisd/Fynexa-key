class KEYLManager {
    constructor() {
        this.apiBase = '/api';
        this.currentContent = '';
        this.isAuthenticated = false;
        
        // Initialize elements
        this.elements = {
            // ... existing elements ...
            
            // Auth elements
            authModal: document.getElementById('authModal'),
            githubToken: document.getElementById('githubToken'),
            repoOwner: document.getElementById('repoOwner'),
            repoName: document.getElementById('repoName'),
            repoBranch: document.getElementById('repoBranch'),
            saveAuth: document.getElementById('saveAuth'),
            cancelAuth: document.getElementById('cancelAuth')
        };

        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupTabs();
        this.checkAuth();
    }

    setupEventListeners() {
        // ... existing event listeners ...
        
        // Auth listeners
        this.elements.saveAuth.addEventListener('click', () => this.saveAuth());
        this.elements.cancelAuth.addEventListener('click', () => this.hideAuthModal());
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.apiBase}/config`);
            const data = await response.json();
            
            if (data.success && data.authenticated) {
                this.isAuthenticated = true;
                this.updateConnectionStatus('connected');
                this.elements.repoPath.textContent = `${data.config.owner}/${data.config.repo}/KEYL`;
                this.showToast('Already authenticated', 'success');
            } else {
                this.showAuthModal();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthModal();
        }
    }

    showAuthModal() {
        this.elements.authModal.classList.add('show');
        this.elements.githubToken.focus();
    }

    hideAuthModal() {
        this.elements.authModal.classList.remove('show');
        this.elements.githubToken.value = '';
    }

    async saveAuth() {
        const token = this.elements.githubToken.value.trim();
        const owner = this.elements.repoOwner.value.trim();
        const repo = this.elements.repoName.value.trim();
        const branch = this.elements.repoBranch.value.trim();
        
        if (!token) {
            this.showToast('Please enter GitHub token', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    owner: owner,
                    repo: repo,
                    branch: branch
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.isAuthenticated = true;
                this.hideAuthModal();
                this.updateConnectionStatus('connected');
                this.elements.repoPath.textContent = `${data.config.owner}/${data.config.repo}/KEYL`;
                this.showToast('Authentication successful', 'success');
                
                // Auto-load KEYL file
                setTimeout(() => this.loadKEYL(), 500);
            } else {
                throw new Error(data.message || 'Authentication failed');
            }
        } catch (error) {
            this.showToast(`Authentication failed: ${error.message}`, 'error');
        }
    }

    // Update semua method API untuk cek authentication
    async loadKEYL() {
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }
        
        // ... existing loadKEYL code ...
    }
    
    async saveKEYL() {
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }
        
        // ... existing saveKEYL code ...
    }
    
    // ... rest of the code ...
}
