---
name: "puppeteer"
description: "Automates browser testing and web scraping using Puppeteer. Invoke when user needs browser automation, PDF generation, screenshots, or web scraping with Chrome/Chromium."
---

# Puppeteer

Puppeteer is a Node.js library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol. It runs headless by default but can be configured to run full (non-headless) Chrome/Chromium.

## When to Invoke

- Browser automation and scripting
- Web scraping and data extraction
- Generating PDFs from web pages
- Taking screenshots of web pages
- Automated UI testing
- Performance testing and tracing
- Crawl SPA (Single-Page Applications)

## Installation

```bash
npm install puppeteer
# or for a lighter version
npm install puppeteer-core
```

## Basic Usage

### 1. Launch Browser and Navigate

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://example.com');
  
  // Take a screenshot
  await page.screenshot({ path: 'example.png' });
  
  await browser.close();
})();
```

### 2. Generate PDF

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://example.com', { waitUntil: 'networkidle2' });
  
  await page.pdf({ 
    path: 'example.pdf', 
    format: 'A4',
    printBackground: true
  });
  
  await browser.close();
})();
```

### 3. Web Scraping

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://example.com');
  
  // Extract data
  const title = await page.title();
  const content = await page.evaluate(() => {
    return {
      title: document.querySelector('h1')?.textContent,
      paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.textContent)
    };
  });
  
  console.log(content);
  await browser.close();
})();
```

### 4. Form Interaction

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://example.com/login');
  
  // Fill form
  await page.type('#email', 'user@example.com');
  await page.type('#password', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForNavigation();
  
  console.log('Logged in successfully');
  await browser.close();
})();
```

### 5. Handle Dynamic Content

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://example.com');
  
  // Wait for specific element
  await page.waitForSelector('.dynamic-content');
  
  // Or wait for function
  await page.waitForFunction(() => {
    return document.querySelectorAll('.item').length > 10;
  });
  
  await browser.close();
})();
```

## Common Options

### Launch Options

```javascript
const browser = await puppeteer.launch({
  headless: false,           // Show browser window
  slowMo: 100,               // Slow down operations by 100ms
  devtools: true,            // Open DevTools
  defaultViewport: null,     // Use system viewport
  args: [
    '--start-maximized',     // Start maximized
    '--no-sandbox',          // Disable sandbox (for CI)
    '--disable-setuid-sandbox'
  ]
});
```

### Page Options

```javascript
// Set viewport
await page.setViewport({ width: 1920, height: 1080 });

// Set user agent
await page.setUserAgent('Mozilla/5.0...');

// Set timeout
page.setDefaultTimeout(30000);

// Handle dialogs
page.on('dialog', async dialog => {
  console.log(dialog.message());
  await dialog.dismiss();
});
```

## Advanced Features

### Intercept Requests

```javascript
await page.setRequestInterception(true);

page.on('request', request => {
  if (request.resourceType() === 'image') {
    request.abort();
  } else {
    request.continue();
  }
});
```

### Handle Multiple Pages

```javascript
const browser = await puppeteer.launch();
const page1 = await browser.newPage();
const page2 = await browser.newPage();

// Work with multiple pages simultaneously
await Promise.all([
  page1.goto('https://example1.com'),
  page2.goto('https://example2.com')
]);
```

### Cookies and Authentication

```javascript
// Set cookies
await page.setCookie({
  name: 'session',
  value: 'abc123',
  domain: 'example.com'
});

// Get cookies
const cookies = await page.cookies();

// Basic authentication
await page.authenticate({ username: 'user', password: 'pass' });
```

### Performance Tracing

```javascript
await page.tracing.start({ path: 'trace.json' });
await page.goto('https://example.com');
await page.tracing.stop();
```

## Best Practices

1. **Use try-finally** to ensure browser closes
2. **Wait for selectors** before interacting
3. **Use headless mode** for production
4. **Set reasonable timeouts** to avoid hanging
5. **Handle errors gracefully**
6. **Use page.evaluate** for DOM operations
7. **Block unnecessary resources** for speed

## Comparison with Playwright

| Feature | Puppeteer | Playwright |
|---------|-----------|------------|
| Browser Support | Chrome/Chromium | Chrome, Firefox, Safari |
| Maintained by | Google | Microsoft |
| API Style | Promise-based | Promise-based |
| Auto-waiting | Manual | Automatic |
| Multi-browser | No | Yes |

## Troubleshooting

### Common Issues

1. **Chromium not found**: Run `npx puppeteer browsers install chrome`
2. **Timeout errors**: Increase timeout or use `waitForSelector`
3. **Element not found**: Check selector, wait for element
4. **Permission denied**: Use `--no-sandbox` flag

### Debug Mode

```javascript
const browser = await puppeteer.launch({
  headless: false,
  devtools: true,
  slowMo: 250
});
```

## Commands Summary

| Command | Description |
|---------|-------------|
| `page.goto(url)` | Navigate to URL |
| `page.screenshot()` | Take screenshot |
| `page.pdf()` | Generate PDF |
| `page.evaluate(fn)` | Execute in browser |
| `page.click(selector)` | Click element |
| `page.type(selector, text)` | Type text |
| `page.waitForSelector()` | Wait for element |
| `page.$(selector)` | Query selector |
| `page.$$(selector)` | Query all selectors |
