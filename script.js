class KEYLManager {
    constructor() {
        this.apiBase = '/api';
        this.currentContent = '';
        this.fileInfo = null;
        this.history = [];
        
        // Initialize elements
        this.elements = {
            // Buttons
            loadFile: document.getElementById('loadFile'),
            createFile: document.getElementById('createFile'),
            saveFile: document.getElementById('saveFile'),
            deleteFile: document.getElementById('deleteFile'),
            formatBtn: document.getElementById('formatBtn'),
            validateBtn: document.getElementById('validateBtn'),
            clearBtn: document.getElementById('clearBtn'),
            refreshHistory: document.getElementById('refreshHistory'),
            
            // Editor
            keylEditor: document.getElementById('keylEditor'),
            
            // Info displays
            lineCount: document.getElementById('lineCount'),
            charCount: document.getElementById('charCount'),
            sizeInfo: document.getElementById('sizeInfo'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            lastUpdate: document.getElementById('lastUpdate'),
            repoPath: document.getElementById('repoPath'),
            fileStats: document.getElementById('fileStats'),
            apiStatus: document.getElementById('apiStatus'),
            
            // Preview
            rawContent: document.getElementById('rawContent'),
            parsedContent: document.getElementById('parsedContent'),
            hexContent: document.getElementById('hexContent'),
            
            // History
            historyList: document.getElementById('historyList'),
            
            // Modal
            confirmModal: document.getElementById('confirmModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalMessage: document.getElementById('modalMessage'),
            modalConfirm: document.getElementById('modalConfirm'),
            modalCancel: document.getElementById('modalCancel'),
            
            // Toast
            toast: document.getElementById('toast')
        };

        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.loadConfig();
        this.setupTabs();
        this.updateConnectionStatus('disconnected');
    }

    setupEventListeners() {
        // File actions
        this.elements.loadFile.addEventListener('click', () => this.loadKEYL());
        this.elements.createFile.addEventListener('click', () => this.createKEYL());
        this.elements.saveFile.addEventListener('click', () => this.saveKEYL());
        this.elements.deleteFile.addEventListener('click', () => this.deleteKEYL());
        
        // Editor tools
        this.elements.formatBtn.addEventListener('click', () => this.formatContent());
        this.elements.validateBtn.addEventListener('click', () => this.validateContent());
        this.elements.clearBtn.addEventListener('click', () => this.clearEditor());
        
        // History
        this.elements.refreshHistory.addEventListener('click', () => this.loadHistory());
        
        // Editor input
        this.elements.keylEditor.addEventListener('input', () => this.updateEditorInfo());
        
        // Modal
        this.elements.modalCancel.addEventListener('click', () => this.hideModal());
        
        // Quick actions
        document.getElementById('insertTimestamp').addEventListener('click', () => this.insertTimestamp());
        document.getElementById('insertUUID').addEventListener('click', () => this.insertUUID());
        document.getElementById('encryptBtn').addEventListener('click', () => this.encryptContent());
        document.getElementById('decryptBtn').addEventListener('click', () => this.decryptContent());
        document.getElementById('hashBtn').addEventListener('click', () => this.hashContent());
        
        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }

    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show corresponding content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(tabId + 'Preview').classList.add('active');
                
                // Update preview if needed
                if (tabId === 'hex') {
                    this.updateHexPreview();
                }
            });
        });
    }

    async loadConfig() {
        try {
            const response = await fetch(`${this.apiBase}/config`);
            const data = await response.json();
            
            if (data.success) {
                this.elements.repoPath.textContent = `${data.owner}/${data.repo}/KEYL`;
                this.updateConnectionStatus('connected');
                this.showToast('Configuration loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    updateConnectionStatus(status) {
        const dot = this.elements.statusDot;
        const text = this.elements.statusText;
        
        dot.className = 'status-dot';
        
        switch(status) {
            case 'connected':
                dot.classList.add('connected');
                text.textContent = 'Connected';
                this.elements.apiStatus.textContent = 'API: Ready';
                break;
            case 'connecting':
                dot.classList.add('connecting');
                text.textContent = 'Connecting...';
                this.elements.apiStatus.textContent = 'API: Connecting';
                break;
            case 'error':
                text.textContent = 'Connection Error';
                this.elements.apiStatus.textContent = 'API: Error';
                break;
            default:
                text.textContent = 'Disconnected';
                this.elements.apiStatus.textContent = 'API: Offline';
        }
    }

    async loadKEYL() {
        try {
            this.updateConnectionStatus('connecting');
            
            const response = await fetch(`${this.apiBase}/keyl`);
            const data = await response.json();
            
            if (data.success) {
                this.currentContent = data.content || '';
                this.fileInfo = data.info || {};
                
                this.elements.keylEditor.value = this.currentContent;
                this.updateEditorInfo();
                this.updatePreviews();
                
                // Update UI
                this.elements.lastUpdate.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
                this.elements.fileStats.textContent = `${this.getFileSize()} | ${this.getLineCount()} lines`;
                
                // Add to history
                this.addToHistory('LOAD', `Loaded KEYL file (${this.getFileSize()})`);
                
                this.showToast('KEYL file loaded successfully', 'success');
                this.updateConnectionStatus('connected');
            } else {
                throw new Error(data.message || 'Failed to load KEYL file');
            }
        } catch (error) {
            this.showToast(`Failed to load KEYL: ${error.message}`, 'error');
            this.updateConnectionStatus('error');
        }
    }

    async createKEYL() {
        this.showModal(
            'Create New KEYL',
            'This will create a new KEYL file. Are you sure?',
            async () => {
                try {
                    this.currentContent = '# New KEYL File\n# Created: ' + new Date().toISOString() + '\n\n';
                    this.elements.keylEditor.value = this.currentContent;
                    this.updateEditorInfo();
                    this.updatePreviews();
                    
                    this.addToHistory('CREATE', 'Created new KEYL file');
                    this.showToast('New KEYL file created', 'success');
                } catch (error) {
                    this.showToast(`Failed to create KEYL: ${error.message}`, 'error');
                }
            }
        );
    }

    async saveKEYL() {
        const content = this.elements.keylEditor.value;
        
        if (!content.trim()) {
            this.showToast('Cannot save empty file', 'warning');
            return;
        }

        try {
            this.updateConnectionStatus('connecting');
            
            const response = await fetch(`${this.apiBase}/keyl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentContent = content;
                this.fileInfo = data.info || {};
                
                this.updateEditorInfo();
                this.updatePreviews();
                
                this.elements.lastUpdate.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
                
                this.addToHistory('SAVE', `Saved KEYL file (${this.getFileSize()})`);
                this.showToast('KEYL file saved successfully', 'success');
                this.updateConnectionStatus('connected');
            } else {
                throw new Error(data.message || 'Failed to save KEYL file');
            }
        } catch (error) {
            this.showToast(`Failed to save KEYL: ${error.message}`, 'error');
            this.updateConnectionStatus('error');
        }
    }

    async deleteKEYL() {
        this.showModal(
            'Delete KEYL File',
            'This will permanently delete the KEYL file. Are you sure?',
            async () => {
                try {
                    this.updateConnectionStatus('connecting');
                    
                    const response = await fetch(`${this.apiBase}/keyl`, {
                        method: 'DELETE'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        this.currentContent = '';
                        this.elements.keylEditor.value = '';
                        this.fileInfo = null;
                        
                        this.updateEditorInfo();
                        this.updatePreviews();
                        
                        this.addToHistory('DELETE', 'Deleted KEYL file');
                        this.showToast('KEYL file deleted successfully', 'success');
                        this.updateConnectionStatus('connected');
                    } else {
                        throw new Error(data.message || 'Failed to delete KEYL file');
                    }
                } catch (error) {
                    this.showToast(`Failed to delete KEYL: ${error.message}`, 'error');
                    this.updateConnectionStatus('error');
                }
            }
        );
    }

    formatContent() {
        const content = this.elements.keylEditor.value;
        
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(content);
            this.elements.keylEditor.value = JSON.stringify(parsed, null, 2);
            this.showToast('Content formatted as JSON', 'success');
        } catch {
            // If not JSON, format as text
            const lines = content.split('\n').map(line => {
                // Trim and clean up lines
                line = line.trim();
                
                // Add indentation for nested structures
                if (line.match(/^[A-Z_]+:/)) {
                    return '  ' + line;
                }
                
                return line;
            }).filter(line => line.length > 0);
            
            this.elements.keylEditor.value = lines.join('\n');
            this.showToast('Content formatted', 'success');
        }
        
        this.updateEditorInfo();
    }

    validateContent() {
        const content = this.elements.keylEditor.value.trim();
        
        if (!content) {
            this.showToast('Content is empty', 'warning');
            return;
        }

        // Check for common KEYL patterns
        const validation = {
            hasKeyValuePairs: content.match(/^[A-Za-z0-9_]+:.+/m),
            hasSections: content.match(/^\[.+\]$/m),
            isValidJSON: this.isValidJSON(content),
            lineCount: content.split('\n').length,
            charCount: content.length
        };

        const issues = [];
        
        if (!validation.hasKeyValuePairs && !validation.hasSections && !validation.isValidJSON) {
            issues.push('No recognizable KEYL structure found');
        }

        if (validation.lineCount > 1000) {
            issues.push('Large file (>1000 lines)');
        }

        if (issues.length === 0) {
            this.showToast('Content appears valid', 'success');
        } else {
            this.showToast(`Validation issues: ${issues.join(', ')}`, 'warning');
        }
    }

    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }