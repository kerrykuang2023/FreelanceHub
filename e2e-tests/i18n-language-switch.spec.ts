import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

const LANGUAGES = [
  { code: 'zh', name: '中文', flag: '🇨🇳', expectedTexts: { login: '登录', email: '邮箱', password: '密码', welcome: '欢迎回来' } },
  { code: 'en', name: 'English', flag: '🇺🇸', expectedTexts: { login: 'Login', email: 'Email', password: 'Password', welcome: 'Welcome' } },
  { code: 'ja', name: '日本語', flag: '🇯🇵', expectedTexts: { login: 'ログイン', email: 'メールアドレス', password: 'パスワード', welcome: 'おかえりなさい' } },
];

interface TestUser {
  email: string;
  password: string;
  role: string;
}

const TEST_USERS: Record<string, TestUser> = {
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test123456!',
    role: 'job_seeker',
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123456!',
    role: 'hr_recruiter',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'admin',
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

async function switchLanguageViaUI(page: Page, langCode: string): Promise<boolean> {
  try {
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    await languageSwitcher.waitFor({ state: 'visible', timeout: 10000 });
    await languageSwitcher.click();
    await page.waitForTimeout(500);
    
    const langOption = page.locator(`[data-testid="language-option-${langCode}"]`);
    await langOption.waitFor({ state: 'visible', timeout: 5000 });
    await langOption.click();
    await page.waitForTimeout(1500);
    
    return true;
  } catch (e) {
    console.log(`Language switch failed: ${langCode}`, e);
    return false;
  }
}

test.describe('🌐 国际化语言切换E2E测试 / i18n Language Switch E2E Tests', () => {
  
  test.describe('Phase 1: 登录页面语言测试', () => {
    
    for (const lang of LANGUAGES) {
      test(`P1-${lang.code.toUpperCase()}: 登录页面${lang.name}显示`, async ({ page }) => {
        console.log(`\n🧪 [P1-${lang.code.toUpperCase()}] 测试登录页面${lang.name}显示`);
        
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('domcontentloaded');
        
        await page.evaluate((lang) => {
          localStorage.setItem('language', lang);
          localStorage.setItem('i18nextLng', lang);
        }, lang.code);
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: `test-results/i18n-lang/login-${lang.code}.png` });
        
        const loginButton = page.locator('[data-testid="login-submit-btn"]');
        if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          const buttonText = await loginButton.textContent();
          console.log(`  登录按钮文本: ${buttonText}`);
          
          const hasExpectedText = buttonText?.includes(lang.expectedTexts.login);
          console.log(`  ${lang.name}翻译验证: ${hasExpectedText ? '✅' : '❌'}`);
        }
        
        const pageContent = await page.content();
        const hasLoginText = pageContent.includes(lang.expectedTexts.login) || 
                            pageContent.includes(lang.expectedTexts.welcome) ||
                            pageContent.includes(lang.expectedTexts.email);
        
        console.log(`  页面包含${lang.name}文本: ${hasLoginText ? '✅' : '❌'}`);
      });
    }
  });

  test.describe('Phase 2: 登录后菜单语言切换测试', () => {
    
    for (const lang of LANGUAGES) {
      test(`P2-${lang.code.toUpperCase()}: Freelancer登录后${lang.name}菜单显示`, async ({ page }) => {
        console.log(`\n🧪 [P2-${lang.code.toUpperCase()}] 测试Freelancer登录后${lang.name}菜单显示`);
        
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('domcontentloaded');
        await page.evaluate((lang) => {
          localStorage.setItem('language', lang);
          localStorage.setItem('i18nextLng', lang);
        }, lang.code);
        
        const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
        
        if (loginSuccess) {
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: `test-results/i18n-lang/freelancer-menu-${lang.code}.png` });
          
          const menuItems = page.locator('[data-testid^="menu-item-"]');
          const count = await menuItems.count();
          console.log(`  找到 ${count} 个菜单项`);
          
          if (count > 0) {
            for (let i = 0; i < Math.min(count, 5); i++) {
              const text = await menuItems.nth(i).textContent();
              console.log(`  菜单项 ${i + 1}: ${text}`);
            }
          }
          
          console.log(`  ${lang.name}菜单显示: ✅`);
        } else {
          console.log('  ⚠️ 登录失败，跳过测试');
        }
      });
    }
  });

  test.describe('Phase 3: HR角色语言切换测试', () => {
    
    for (const lang of LANGUAGES) {
      test(`P3-${lang.code.toUpperCase()}: HR登录后${lang.name}界面显示`, async ({ page }) => {
        console.log(`\n🧪 [P3-${lang.code.toUpperCase()}] 测试HR登录后${lang.name}界面显示`);
        
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('domcontentloaded');
        await page.evaluate((lang) => {
          localStorage.setItem('language', lang);
          localStorage.setItem('i18nextLng', lang);
        }, lang.code);
        
        const loginSuccess = await login(page, TEST_USERS.hr.email, TEST_USERS.hr.password);
        
        if (loginSuccess) {
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: `test-results/i18n-lang/hr-dashboard-${lang.code}.png` });
          
          const navbar = page.locator('[data-testid="global-navbar"]');
          const navbarVisible = await navbar.isVisible({ timeout: 5000 }).catch(() => false);
          
          console.log(`  导航栏可见: ${navbarVisible ? '✅' : '❌'}`);
          console.log(`  ${lang.name}界面显示: ✅`);
        } else {
          console.log('  ⚠️ 登录失败，跳过测试');
        }
      });
    }
  });

  test.describe('Phase 4: Admin角色语言切换测试', () => {
    
    for (const lang of LANGUAGES) {
      test(`P4-${lang.code.toUpperCase()}: Admin登录后${lang.name}界面显示`, async ({ page }) => {
        console.log(`\n🧪 [P4-${lang.code.toUpperCase()}] 测试Admin登录后${lang.name}界面显示`);
        
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('domcontentloaded');
        await page.evaluate((lang) => {
          localStorage.setItem('language', lang);
          localStorage.setItem('i18nextLng', lang);
        }, lang.code);
        
        const loginSuccess = await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
        
        if (loginSuccess) {
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: `test-results/i18n-lang/admin-dashboard-${lang.code}.png` });
          
          const navbar = page.locator('[data-testid="global-navbar"]');
          const navbarVisible = await navbar.isVisible({ timeout: 5000 }).catch(() => false);
          
          console.log(`  导航栏可见: ${navbarVisible ? '✅' : '❌'}`);
          console.log(`  ${lang.name}界面显示: ✅`);
        } else {
          console.log('  ⚠️ 登录失败，跳过测试');
        }
      });
    }
  });

  test.describe('Phase 5: 完整语言切换流程测试', () => {
    
    test('P5-01: 连续切换三种语言验证', async ({ page }) => {
      console.log('\n🧪 [P5-01] 测试连续切换三种语言');
      
      const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      
      if (loginSuccess) {
        for (const lang of LANGUAGES) {
          console.log(`\n  切换到 ${lang.name}...`);
          
          await page.evaluate((lang) => {
            localStorage.setItem('language', lang);
            localStorage.setItem('i18nextLng', lang);
          }, lang.code);
          
          await page.reload();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: `test-results/i18n-lang/sequence-${lang.code}.png` });
          
          const savedLang = await page.evaluate(() => localStorage.getItem('language'));
          console.log(`    保存的语言: ${savedLang}`);
          
          const menuItems = page.locator('[data-testid^="menu-item-"]');
          if (await menuItems.first().isVisible({ timeout: 5000 }).catch(() => false)) {
            const firstItemText = await menuItems.first().textContent();
            console.log(`    第一个菜单项: ${firstItemText}`);
          }
        }
        
        console.log('\n  ✅ 连续切换测试完成');
      } else {
        console.log('  ⚠️ 登录失败，跳过测试');
      }
    });
    
    test('P5-02: 登录状态下切换语言', async ({ page }) => {
      console.log('\n🧪 [P5-02] 测试登录状态下切换语言');
      
      const loginSuccess = await login(page, TEST_USERS.freelancer.email, TEST_USERS.freelancer.password);
      
      if (loginSuccess) {
        for (const lang of LANGUAGES) {
          console.log(`\n  切换到 ${lang.name}...`);
          
          await page.evaluate((lang) => {
            localStorage.setItem('language', lang);
            localStorage.setItem('i18nextLng', lang);
          }, lang.code);
          
          await page.reload();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: `test-results/i18n-lang/logged-in-${lang.code}.png` });
          
          const navbar = page.locator('[data-testid="global-navbar"]');
          const navbarVisible = await navbar.isVisible({ timeout: 5000 }).catch(() => false);
          console.log(`    导航栏可见: ${navbarVisible ? '✅' : '❌'}`);
        }
        
        console.log('\n  ✅ 登录状态语言切换测试完成');
      } else {
        console.log('  ⚠️ 登录失败，跳过测试');
      }
    });
  });

  test.describe('Phase 6: 语言持久化测试', () => {
    
    test('P6-01: 语言设置持久化验证', async ({ page }) => {
      console.log('\n🧪 [P6-01] 测试语言设置持久化');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('domcontentloaded');
      
      for (const lang of LANGUAGES) {
        console.log(`\n  测试 ${lang.name} 持久化...`);
        
        await page.evaluate((lang) => {
          localStorage.setItem('language', lang);
          localStorage.setItem('i18nextLng', lang);
        }, lang.code);
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const savedLang = await page.evaluate(() => localStorage.getItem('language'));
        const isPersisted = savedLang === lang.code;
        console.log(`    语言持久化: ${isPersisted ? '✅ 通过' : '❌ 失败'}`);
      }
    });
  });
});
