const concurrently = require('concurrently');
const { spawn } = require('child_process');

const path = require('path');
const fs = require('fs');

const dotenvPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

const serverPath = path.join(__dirname, '..', 'server');
const clientPath = path.join(__dirname, '..', 'client');

const e2ePath = path.join(__dirname, '..', 'e2e');

const screenshotsDir = path.join(e2ePath, 'screenshots');
const resultsDir = path.join(e2ePath, 'results');

const reportsDir = path.join(resultsDir, 'reports');

const featureCheckPath = path.join(resultsDir, 'feature-check-report.json');

function ensureEnvFile() {
  if (!fs.existsSync(dotenvPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log('Creating .env file from .env.example...');
      fs.copyFileSync(envExamplePath, dotenvPath);
      console.log('.env file created successfully.');
    } else {
      console.log('.env file already exists.');
    }
  }
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log('Screenshots directory created.');
  }
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    console.log('Reports directory created.');
  }
}

 
async function startServer() {
  console.log('Starting server...');
  const serverProcess = spawn('npm', ['start'], { cwd: serverPath, shell: true, stdio: 'inherit' });
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server stdout: ${data}`);
  });
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data}`);
  });
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

  console.log('Starting client...');
  const clientProcess = spawn('npm', ['run', 'dev'], { cwd: clientPath, shell: true, stdio: 'inherit' });
  clientProcess.stdout.on('data', (data) => {
    console.log(`Client stdout: ${data}`);
  });
  clientProcess.stderr.on('data', (data) => {
    console.error(`Client stderr: ${data}`);
  });
  clientProcess.on('close', (code) => {
    console.log(`Client process exited with code ${code}`);
    });
  });
  
  console.log('Starting E2E tests...');
  const testProcess = spawn('npx', ['playwright', 'test', '--headed'], { cwd: e2ePath, shell: true, stdio: 'inherit' });
  testProcess.stdout.on('data', (data) => {
    console.log(`Test stdout: ${data}`);
  });
  testProcess.stderr.on('data', (data) => {
    console.error(`Test stderr: ${data}`);
  });
  testProcess.on('close', (code) => {
    console.log(`Test process exited with code ${code}`);
    
    if (code === 0) {
      console.log('All tests passed!');
      generateReports();
    } else {
      console.log('Some tests failed. Check the logs above.');
    }
  });
}

 
async function generateReports() {
  console.log('\n========== FEATURE CHECK SUMMARY ==========\n');
  
  const reportData = JSON.parse(fs.readFileSync(featureCheckPath, 'utf8'));
  
  console.log(`Total Features Checked: ${reportData.length}`);
  const passed = reportData.filter(c => c.status === 'pass');
  const partial = reportData.filter(c => c.status === 'partial');
  const failed = reportData.filter(c => c.status === 'fail');
  
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`⚠️ Partial: ${partial.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (partial.length > 0 || failed.length > 0) {
    console.log('\n---------- ISSUES FOUND ----------\n');
    
    [...partial, ...failed].forEach(check => {
      console.log(`[${check.status.toUpperCase()}] ${check.featureId}: ${check.featureName}`);
      console.log(`  Missing Elements: ${check.missingElements.join(', ')}`);
      console.log(`  Screenshot: ${check.screenshot}`);
      console.log('');
    });
  }
  
  console.log(`\nReport saved to: ${featureCheckPath}`);
}
