const https = require('https');

function ghRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        Authorization: 'token ' + token,
        'User-Agent': 'zambon-portfolio',
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }
    }, function(res) {
      let raw = '';
      res.on('data', function(c) { raw += c; });
      res.on('end', function() { resolve({ status: res.statusCode, body: JSON.parse(raw) }); });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: 'Method not allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const password = body.password;
    const projects = body.projects;

    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!projects || !Array.isArray(projects)) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'No projects data' }) };
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Missing env vars', hasToken: !!token, hasOwner: !!owner, hasRepo: !!repo }) };
    }

    const filePath = '/repos/' + owner + '/' + repo + '/contents/zambon-site/projects.json';

    const current = await ghRequest('GET', filePath, null, token);

    if (current.status !== 200) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'GitHub GET failed', status: current.status, detail: current.body }) };
    }

    const sha = current.body.sha;
    const content = Buffer.from(JSON.stringify(projects, null, 2)).toString('base64');

    const result = await ghRequest('PUT', filePath, {
      message: 'Update projects via admin',
      content: content,
      sha: sha,
      branch: branch
    }, token);

    if (result.status !== 200 && result.status !== 201) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'GitHub PUT failed', status: result.status, detail: result.body }) };
    }

    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: err.message }) };
  }
};
