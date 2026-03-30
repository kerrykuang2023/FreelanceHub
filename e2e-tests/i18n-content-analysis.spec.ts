import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

const TEST_USERS = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
  },
};

async function setLanguage(page: Page, langCode: string): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((lang) => {
    localStorage.setItem('language', lang);
    localStorage.setItem('i18nextLng', lang);
  }, langCode);
}

async function login(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-submit-btn"]');
    
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginButton.click();
    
    await page.waitForURL(/^(?!.*login).*/, { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    return true;
  } catch (e) {
    console.log(`Login failed: ${email}`, e);
    return false;
  }
}

async function extractPageTexts(page: Page): Promise<{ allText: string; visibleText: string; chineseTexts: string[] }> {
  const result = await page.evaluate(() => {
    const chineseRegex = /[\u4e00-\u9fa5]+/g;
    const texts: string[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('script, style, noscript, iframe')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text && chineseRegex.test(text)) {
        texts.push(text);
      }
    }
    return { chineseTexts: [...new Set(texts)] };
  });
  
  return result;
}

test.describe('🔍 页面内容国际化详细分析', () => {
  
  test('分析Admin Dashboard页面内容 (英文模式下)', async ({ page }) => {
    console.log('\n🔍 分析Admin Dashboard页面内容 (英文模式)');
    
    await setLanguage(page, 'en');
    const loginSuccess = await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    if (loginSuccess) {
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/i18n-analysis/admin-dashboard-en.png', fullPage: true });
      
      const { chineseTexts } = await extractPageTexts(page);
      
      console.log('\n📋 Admin Dashboard页面中发现的中文文本:');
      if (chineseTexts.length > 0) {
        chineseTexts.slice(0, 30).forEach((text, i) => {
          console.log(`  ${i + 1}. "${text}"`);
        });
        if (chineseTexts.length > 30) {
          console.log(`  ... 还有 ${chineseTexts.length - 30} 条中文文本`);
        }
      } else {
        console.log('  ✅ 未发现中文文本，国际化完成');
      }
      
      console.log(`\n📊 统计: 发现 ${chineseTexts.length} 条中文文本`);
    }
  });
  
  test('分析Freelancer Dashboard页面内容 (英文模式下)', async ({ page }) => {
    console.log('\n🔍 分析Freelancer Dashboard页面内容 (英文模式)');
    
    await setLanguage(page, 'en');
    const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
    
    if (loginSuccess) {
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/i18n-analysis/freelancer-dashboard-en.png', fullPage: true });
      
      const { chineseTexts } = await extractPageTexts(page);
      
      console.log('\n📋 Freelancer Dashboard页面中发现的中文文本:');
      if (chineseTexts.length > 0) {
        chineseTexts.slice(0, 30).forEach((text, i) => {
          console.log(`  ${i + 1}. "${text}"`);
        });
        if (chineseTexts.length > 30) {
          console.log(`  ... 还有 ${chineseTexts.length - 30} 条中文文本`);
        }
      } else {
        console.log('  ✅ 未发现中文文本，国际化完成');
      }
      
      console.log(`\n📊 统计: 发现 ${chineseTexts.length} 条中文文本`);
    }
  });
  
  test('分析HR Dashboard页面内容 (英文模式下)', async ({ page }) => {
    console.log('\n🔍 分析HR Dashboard页面内容 (英文模式)');
    
    await setLanguage(page, 'en');
    const loginSuccess = await login(page, TEST_USERS.hr.email, TEST_USERS.hr.password);
    
    if (loginSuccess) {
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/i18n-analysis/hr-dashboard-en.png', fullPage: true });
      
      const { chineseTexts } = await extractPageTexts(page);
      
      console.log('\n📋 HR Dashboard页面中发现的中文文本:');
      if (chineseTexts.length > 0) {
        chineseTexts.slice(0, 30).forEach((text, i) => {
          console.log(`  ${i + 1}. "${text}"`);
        });
        if (chineseTexts.length > 30) {
          console.log(`  ... 还有 ${chineseTexts.length - 30} 条中文文本`);
        }
      } else {
        console.log('  ✅ 未发现中文文本，国际化完成');
      }
      
      console.log(`\n📊 统计: 发现 ${chineseTexts.length} 条中文文本`);
    }
  });
  
  test('分析Jobs List页面内容 (英文模式下)', async ({ page }) => {
    console.log('\n🔍 分析Jobs List页面内容 (英文模式)');
    
    await setLanguage(page, 'en');
    const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
    
    if (loginSuccess) {
      await page.waitForTimeout(2000);
      
      await page.goto(`${BASE_URL}/jobs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-analysis/jobs-list-en.png', fullPage: true });
      
      const { chineseTexts } = await extractPageTexts(page);
      
      console.log('\n📋 Jobs List页面中发现的中文文本:');
      if (chineseTexts.length > 0) {
        chineseTexts.slice(0, 30).forEach((text, i) => {
          console.log(`  ${i + 1}. "${text}"`);
        });
        if (chineseTexts.length > 30) {
          console.log(`  ... 还有 ${chineseTexts.length - 30} 条中文文本`);
        }
      } else {
        console.log('  ✅ 未发现中文文本，国际化完成');
      }
      
      console.log(`\n📊 统计: 发现 ${chineseTexts.length} 条中文文本`);
    }
  });

  test('分析Work Logs页面内容 (英文模式下)', async ({ page }) => {
    console.log('\n🔍 分析Work Logs页面内容 (英文模式)');
    
    await setLanguage(page, 'en');
    const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
    
    if (loginSuccess) {
      await page.waitForTimeout(2000);
      
      await page.goto(`${BASE_URL}/work-logs`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-analysis/work-logs-en.png', fullPage: true });
      
      const { chineseTexts } = await extractPageTexts(page);
      
      console.log('\n📋 Work Logs页面中发现的中文文本:');
      if (chineseTexts.length > 0) {
        chineseTexts.slice(0, 30).forEach((text, i) => {
          console.log(`  ${i + 1}. "${text}"`);
        });
        if (chineseTexts.length > 30) {
          console.log(`  ... 还有 ${chineseTexts.length - 30} 条中文文本`);
        }
      } else {
        console.log('  ✅ 未发现中文文本，国际化完成');
      }
      
      console.log(`\n📊 统计: 发现 ${chineseTexts.length} 条中文文本`);
    }
  });

  test('分析Admin Config页面内容 (英文模式下)', async ({ page }) => {
    console.log('\n🔍 分析Admin Config页面内容 (英文模式)');
    
    await setLanguage(page, 'en');
    const loginSuccess = await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    if (loginSuccess) {
      await page.waitForTimeout(2000);
      
      await page.goto(`${BASE_URL}/admin/config/skill-categories`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/i18n-analysis/admin-config-en.png', fullPage: true });
      
      const { chineseTexts } = await extractPageTexts(page);
      
      console.log('\n📋 Admin Config页面中发现的中文文本:');
      if (chineseTexts.length > 0) {
        chineseTexts.slice(0, 30).forEach((text, i) => {
          console.log(`  ${i + 1}. "${text}"`);
        });
        if (chineseTexts.length > 30) {
          console.log(`  ... 还有 ${chineseTexts.length - 30} 条中文文本`);
        }
      } else {
        console.log('  ✅ 未发现中文文本，国际化完成');
      }
      
      console.log(`\n📊 统计: 发现 ${chineseTexts.length} 条中文文本`);
    }
  });
});
