const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5137';

async function debugTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });

  try {
    console.log('\n🚀 Debug Job Detail Page\n');
    console.log('='.repeat(50));
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click on the first job card
    const jobCards = page.locator('main .overflow-hidden.rounded-lg.bg-white');
    await jobCards.first().click();
    await page.waitForTimeout(500);
    
    // Click View Details button
    const viewDetailsBtn = page.locator('aside button:has-text("View Details")').first();
    await viewDetailsBtn.click();
    
    // Wait for navigation
    await page.waitForURL('**/jobs/**', { timeout: 5000 });
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    
    // Get page content
    const bodyText = await page.locator('body').innerText();
    console.log('\nPage body text:');
    console.log(bodyText.substring(0, 1000));
    
    // Check for buttons
    const buttons = await page.locator('button').all();
    console.log('\nAll buttons on page:');
    for (const btn of buttons) {
      const text = await btn.innerText();
      console.log(' - Button:', text);
    }
    
    // Get HTML of main content
    const mainContent = await page.locator('main').innerHTML();
    console.log('\nMain content HTML (first 1000 chars):');
    console.log(mainContent.substring(0, 1000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugTest();
