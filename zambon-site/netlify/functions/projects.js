const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  try {
    const filePath = path.join(__dirname, '../../projects.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message, path: __dirname })
    };
  }
};
