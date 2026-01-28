const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Config from .env
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Khisd';
const GITHUB_REPO = process.env.GITHUB_REPO || 'Fynexa-key';
const BRANCH = process.env.BRANCH || 'main';

// GitHub API helper
class GitHubAPI {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.headers = {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'KEYL-Manager'
        };
    }

    async getFileContent() {
        try {
            const url = `${this.baseURL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/KEYL?ref=${BRANCH}`;
            const response = await axios.get(url, { headers: this.headers });
            
            if (response.data.content) {
                // Decode base64 content
                const content = Buffer.from(response.data.content, 'base64').toString('utf8');
                return {
                    success: true,
                    content: content,
                    info: {
                        sha: response.data.sha,
                        size: response.data.size,
                        path: response.data.path,
                        lastModified: response.data.last_modified
                    }
                };
            }
            return { success: false, message: 'No content found' };
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return { success: false, message: 'KEYL file not found', code: 'NOT_FOUND' };
            }
            console.error('GitHub API Error:', error.message);
            return { success: false, message: error.message };
        }
    }

    async createOrUpdateFile(content, sha = null) {
        try {
            const url = `${this.baseURL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/KEYL`;
            
            const data = {
                message: `Update KEYL - ${new Date().toISOString()}`,
                content: Buffer.from(content).toString('base64'),
                branch: BRANCH
            };

            if (sha) {
                data.sha = sha;
            }

            const response = await axios.put(url, data, { headers: this.headers });
            
            return {
                success: true,
                message: sha ? 'File updated successfully' : 'File created successfully',
                info: {
                    sha: response.data.content.sha,
                    path: response.data.content.path,
                    url: response.data.content.html_url
                }
            };
        } catch (error) {
            console.error('GitHub API Error:', error.message);
            return { success: false, message: error.message };
        }
    }

    async deleteFile(sha) {
        try {
            const url = `${this.baseURL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/KEYL`;
            
            const data = {
                message: `Delete KEYL - ${new Date().toISOString()}`,
                sha: sha,
                branch: BRANCH
            };

            await axios.delete(url, {
                headers: this.headers,
                data: data
            });
            
            return { success: true, message: 'File deleted successfully' };
        } catch (error) {
            console.error('GitHub API Error:', error.message);
            return { success: false, message: error.message };
        }
    }

    async getCommits() {
        try {
            const url = `${this.baseURL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?path=KEYL&per_page=10`;
            const response = await axios.get(url, { headers: this.headers });
            
            return {
                success: true,
                commits: response.data.map(commit => ({
                    sha: commit.sha,
                    message: commit.commit.message,
                    author: commit.commit.author.name,
                    date: commit.commit.author.date,
                    url: commit.html_url
                }))
            };
        } catch (error) {
            console.error('GitHub API Error:', error.message);
            return { success: false, message: error.message };
        }
    }
}

const githubAPI = new GitHubAPI();

// API Routes
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        branch: BRANCH,
        file: 'KEYL'
    });
});

app.get('/api/keyl', async (req, res) => {
    try {
        const result = await githubAPI.getFileContent();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/keyl', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }

        // Get current file to get SHA if exists
        const currentFile = await githubAPI.getFileContent();
        const sha = currentFile.success ? currentFile.info.sha : null;
        
        const result = await githubAPI.createOrUpdateFile(content, sha);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/keyl', async (req, res) => {
    try {
        // Get current file to get SHA
        const currentFile = await githubAPI.getFileContent();
        
        if (!currentFile.success) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const result = await githubAPI.deleteFile(currentFile.info.sha);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const result = await githubAPI.getCommits();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Utility endpoints
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        github: {
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            branch: BRANCH
        }
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ KEYL Manager running on http://localhost:${PORT}`);
    console.log(`📁 Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
    console.log(`🌿 Branch: ${BRANCH}`);
    console.log(`🔑 File: KEYL`);
});