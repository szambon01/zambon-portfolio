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
    const body = JSON.parse(event.body);
    const { password, projects } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!projects || !Array.isArray(projects)) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'No projects data provided' }) };
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Missing env vars', token: !!token, owner: !!owner, repo: !!repo }) };
    }

    const filePath = `/repos/${owner}/${repo}/contents/zambon-site/projects.json`;

    const current = await ghRequest('GET', filePath, null, token);
    
    if (current.status !== 200) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Could not get file from GitHub', githubStatus: current.status, githubBody: current.body }) };
    }

    const sha = current.body.sha;
    const content = Buffer.from(JSON.stringify(projects, null, 2)).toString('base64');

    const result = await ghRequest('PUT', filePath, {
      message: 'Update projects via admin',
      content,
      sha,
      branch,
    }, token);

    if (result.status !== 200 && result.status !== 201) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'GitHub write failed', githubStatus: result.status, githubBody: result.body }) };
    }

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
}  });
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

    // If no projects provided, this was just a password check — return ok

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
