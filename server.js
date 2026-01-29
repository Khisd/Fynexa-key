// server.js (Versi Aman)
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory storage (reset saat server restart)
let userToken = null;
let repoConfig = {
    owner: 'Khisd',
    repo: 'Fynexa-key',
    branch: 'main'
};

// GitHub headers helper
function getGitHubHeaders(token) {
    return {
        'Authorization': token ? `token ${token}` : '',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'KEYL-Manager'
    };
}

// API Routes
app.post('/api/auth', (req, res) => {
    const { token, owner, repo, branch } = req.body;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Token is required'
        });
    }
    
    // Store in memory
    userToken = token;
    if (owner) repoConfig.owner = owner;
    if (repo) repoConfig.repo = repo;
    if (branch) repoConfig.branch = branch;
    
    res.json({
        success: true,
        message: 'Token set successfully',
        config: repoConfig
    });
});

app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        authenticated: !!userToken,
        config: repoConfig
    });
});

app.get('/api/keyl', async (req, res) => {
    try {
        if (!userToken) {
            return res.status(401).json({
                success: false,
                message: 'Please set GitHub token first'
            });
        }
        
        const url = `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/KEYL?ref=${repoConfig.branch}`;
        
        const response = await axios.get(url, {
            headers: getGitHubHeaders(userToken)
        });
        
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        
        res.json({
            success: true,
            content: content,
            info: {
                sha: response.data.sha,
                size: response.data.size
            }
        });
        
    } catch (error) {
        if (error.response?.status === 404) {
            res.json({
                success: false,
                message: 'KEYL file not found'
            });
        } else if (error.response?.status === 401) {
            res.json({
                success: false,
                message: 'Invalid token'
            });
        } else {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
});

// ... tambahkan endpoint POST dan DELETE seperti sebelumnya ...

app.listen(PORT, () => {
    console.log(`\n🔐 KEYL Manager (Secure Mode)`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`\n📝 Instructions:`);
    console.log(`   1. Generate GitHub token at:`);
    console.log(`      https://github.com/settings/tokens`);
    console.log(`   2. Select "repo" scope`);
    console.log(`   3. Enter token in the UI`);
    console.log(`\n⚠️  Token is stored in memory only`);
    console.log(`   It will be lost when server restarts`);
});
