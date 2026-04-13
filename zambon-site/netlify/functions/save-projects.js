// save-projects.js
// Uses the Netlify API to commit an updated projects.json to your repo.
// Set these environment variables in Netlify dashboard → Site Settings → Environment:
//   NETLIFY_TOKEN   — your Netlify personal access token
//   GITHUB_TOKEN    — your GitHub personal access token (repo scope)
//   GITHUB_OWNER    — your GitHub username
//   GITHUB_REPO     — your repo name
//   GITHUB_BRANCH   — branch to commit to (usually "main")
//   ADMIN_PASSWORD  — password to protect the admin page

const https = require('https');

function ghRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method,
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'zambon-portfolio',
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { password, projects } = JSON.parse(event.body);

    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const {
      GITHUB_TOKEN: token,
      GITHUB_OWNER: owner,
      GITHUB_REPO: repo,
      GITHUB_BRANCH: branch = 'main',
    } = process.env;

    const filePath = `/repos/${owner}/${repo}/contents/projects.json`;

    // Get current file SHA (required for update)
    const current = await ghRequest('GET', filePath, null, token);
    const sha = current.body.sha;

    const content = Buffer.from(JSON.stringify(projects, null, 2)).toString('base64');

    await ghRequest('PUT', filePath, {
      message: 'Update projects via admin',
      content,
      sha,
      branch,
    }, token);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}
