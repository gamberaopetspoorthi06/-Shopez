const { spawn } = require('child_process');
const http = require('http');

console.log('=====================================================');
console.log('         SHAPEZ STOCK TRADER - VERIFICATION          ');
console.log('=====================================================');

// 1. Programmatically spawn the Express backend server
console.log('Booting backend server process...');
const serverProcess = spawn('node', ['backend/server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: 5000, MONGO_URI: 'mongodb://127.0.0.1:27017/shopez' },
  shell: true
});

serverProcess.stdout.on('data', (data) => {
  console.log(`[Server stdout]: ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[Server stderr]: ${data.toString().trim()}`);
});

// Helper to make an HTTP GET request and return raw body
const getRequest = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// 2. Wait 3 seconds for server to connect to MongoDB and seed listings
setTimeout(async () => {
  console.log('\n-----------------------------------------------------');
  console.log('Executing automated API route checks...');
  console.log('-----------------------------------------------------');

  let testsPassed = 0;
  let totalTests = 2;

  try {
    // Test 1: Check root Operational endpoint
    console.log('Test 1: GET http://localhost:5000/ (Server Root Info)');
    const rootCheck = await getRequest('http://localhost:5000/');
    console.log(`Response Code: ${rootCheck.status}`);
    console.log('Response Payload:', rootCheck.data);
    
    if (rootCheck.status === 200 && rootCheck.data.success) {
      console.log('=> Test 1 Passed! Server operational.');
      testsPassed++;
    } else {
      console.log('=> Test 1 Failed.');
    }

    console.log('\n-----------------------------------------------------');

    // Test 2: Check Stock catalog query and check seeded stock count
    console.log('Test 2: GET http://localhost:5000/api/stocks (Tech stock catalog)');
    const stockCatalog = await getRequest('http://localhost:5000/api/stocks');
    console.log(`Response Code: ${stockCatalog.status}`);
    console.log(`Seeded Tickers Found: ${stockCatalog.data.count}`);
    if (stockCatalog.data.data) {
      console.log('Available Tickers:', stockCatalog.data.data.map(s => s.symbol).join(', '));
    }
    
    if (stockCatalog.status === 200 && stockCatalog.data.success && stockCatalog.data.count > 0) {
      console.log('=> Test 2 Passed! Tech stock listings returned successfully.');
      testsPassed++;
    } else {
      console.log('=> Test 2 Failed.');
    }

  } catch (err) {
    console.error('API Verification error:', err.message);
  } finally {
    console.log('\n-----------------------------------------------------');
    console.log(`VERIFICATION RESULT: ${testsPassed} / ${totalTests} Tests Succeeded`);
    console.log('-----------------------------------------------------\n');

    // Clean up: Terminate the programmatic backend server
    console.log('Gracefully terminating backend server process...');
    serverProcess.kill('SIGINT');
    process.exit(testsPassed === totalTests ? 0 : 1);
  }
}, 3000);
