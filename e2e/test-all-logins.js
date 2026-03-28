const http = require('http');

function testLogin(email, password) {
  const data = JSON.stringify({ email, password });
  
  const options = {
    hostname: 'localhost',
    port: 5555,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log(`\n=== Login Test: ${email} ===`);
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  await testLogin('freelancer@test.com', 'Test123456!');
  await testLogin('hr@test.com', 'Test123456!');
  await testLogin('admin@test.com', 'Admin123456!');
}

main().catch(console.error);
