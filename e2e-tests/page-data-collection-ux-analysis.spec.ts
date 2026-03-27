import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5137';

interface PageData {
  url: string;
  hasUnifiedHeader: boolean;
  hasBreadcrumbs: boolean;
  menuItems: string[];
  breadcrumbItems: string[];
  navToBreadcrumbSpacing: number | null;
  headerHeight: number | null;
  role: string;
}

class PageDataCollector {
  static async collectPageData(page: Page, userRole: string): Promise<PageData> {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const nav = page.locator('nav[aria-label="Global"]').first();
    const hasUnifiedHeader = await nav.isVisible({ timeout: 5000 }).catch(() => false);

    const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]').first();
    const hasBreadcrumbs = await breadcrumbNav.isVisible({ timeout: 3000 }).catch(() => false);

    const menuItems: string[] = [];
    if (hasUnifiedHeader) {
      const menuLinks = nav.locator('a, button');
      const count = await menuLinks.count();
      
      for (let i = 0; i < count; i++) {
        try {
          const text = await menuLinks.nth(i).textContent();
          if (text && text.trim()) {
            menuItems.push(text.trim());
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    const breadcrumbItems: string[] = [];
    if (hasBreadcrumbs) {
      const breadcrumbLinks = breadcrumbNav.locator('a, span');
      const count = await breadcrumbLinks.count();
      
      for (let i = 0; i < count; i++) {
        try {
          const text = await breadcrumbLinks.nth(i).textContent();
          if (text && text.trim()) {
            breadcrumbItems.push(text.trim());
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    let navToBreadcrumbSpacing: number | null = null;
    if (hasUnifiedHeader && hasBreadcrumbs) {
      try {
        const navBox = await nav.boundingBox();
        const breadcrumbBox = await breadcrumbNav.boundingBox();
        
        if (navBox && breadcrumbBox) {
          navToBreadcrumbSpacing = Math.round(breadcrumbBox.y - (navBox.y + navBox.height));
        }
      } catch (e) {
        navToBreadcrumbSpacing = null;
      }
    }

    let headerHeight: number | null = null;
    if (hasUnifiedHeader) {
      try {
        const navBox = await nav.boundingBox();
        if (navBox) {
          headerHeight = Math.round(navBox.height);
        }
      } catch (e) {
        headerHeight = null;
      }
    }

    return {
      url: page.url(),
      hasUnifiedHeader,
      hasBreadcrumbs,
      menuItems,
      breadcrumbItems,
      navToBreadcrumbSpacing,
      headerHeight,
      role: userRole,
    };
  }

  static printPageData(data: PageData): void {
    console.log('\n' + '='.repeat(80));
    console.log(`📄 URL: ${data.url}`);
    console.log(`👤 Role: ${data.role}`);
    console.log(`✅ Unified Header: ${data.hasUnifiedHeader ? 'Yes' : 'No'}`);
    console.log(`✅ Breadcrumbs: ${data.hasBreadcrumbs ? 'Yes' : 'No'}`);
    
    if (data.headerHeight) {
      console.log(`📏 Header Height: ${data.headerHeight}px`);
    }
    
    if (data.navToBreadcrumbSpacing !== null) {
      console.log(`📏 Nav to Breadcrumb Spacing: ${data.navToBreadcrumbSpacing}px`);
    }
    
    console.log(`📋 Menu Items (${data.menuItems.length}):`);
    data.menuItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item}`);
    });
    
    if (data.breadcrumbItems.length > 0) {
      console.log(`🍞 Breadcrumbs: ${data.breadcrumbItems.join(' > ')}`);
    }
    console.log('='.repeat(80) + '\n');
  }

  static async loginAsUser(page: Page, email: string, password: string): Promise<boolean> {
    try {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill(email);
        await passwordInput.fill(password);
        await loginButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        return !page.url().includes('/login');
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }
}

test.describe('Page Data Collection & UX Analysis', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Freelancer Role - Complete Page Analysis', () => {
    const testUser = {
      email: 'freelancer@test.com',
      password: 'Test123456!',
      role: 'job_seeker'
    };

    const pagesToTest = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/jobs', name: 'Browse Jobs' },
      { path: '/applications', name: 'My Applications' },
      { path: '/work-logs', name: 'Work Logs' },
      { path: '/invoices', name: 'Invoices' },
      { path: '/profile', name: 'Profile' },
      { path: '/my-projects', name: 'My Projects' },
    ];

    test.beforeAll('Login as Freelancer', async ({ page }) => {
      const success = await PageDataCollector.loginAsUser(page, testUser.email, testUser.password);
      expect(success).toBe(true);
    });

    for (const testPage of pagesToTest) {
      test(`DATA-${testPage.name}: Collect page data`, async ({ page }) => {
        console.log(`\n📊 Collecting data for: ${testPage.name}`);
        
        await page.goto(`${BASE_URL}${testPage.path}`);
        
        const pageData = await PageDataCollector.collectPageData(page, testUser.role);
        PageDataCollector.printPageData(pageData);

        expect(pageData.hasUnifiedHeader).toBe(true);
        expect(pageData.hasBreadcrumbs).toBe(true);
        expect(pageData.menuItems.length).toBeGreaterThan(0);
        
        if (pageData.navToBreadcrumbSpacing !== null) {
          expect(pageData.navToBreadcrumbSpacing).toBeGreaterThan(0);
          expect(pageData.navToBreadcrumbSpacing).toBeLessThan(50);
        }

        await page.screenshot({ 
          path: `test-results/data-${testPage.name.toLowerCase()}-${Date.now()}.png`,
          fullPage: false 
        });
      });
    }
  });

  test.describe('HR Role - Complete Page Analysis', () => {
    const testUser = {
      email: 'hr@test.com',
      password: 'Test123456!',
      role: 'hr_recruiter'
    };

    const pagesToTest = [
      { path: '/hr/dashboard', name: 'HR Dashboard' },
      { path: '/post-job', name: 'Post Job' },
      { path: '/company/applications', name: 'Company Applications' },
      { path: '/company/work-logs/pending', name: 'Pending Work Logs' },
      { path: '/my-projects', name: 'My Projects' },
    ];

    test.beforeAll('Login as HR', async ({ page }) => {
      const success = await PageDataCollector.loginAsUser(page, testUser.email, testUser.password);
      expect(success).toBe(true);
    });

    for (const testPage of pagesToTest) {
      test(`DATA-HR-${testPage.name}: Collect page data`, async ({ page }) => {
        console.log(`\n📊 Collecting data for HR: ${testPage.name}`);
        
        await page.goto(`${BASE_URL}${testPage.path}`);
        
        const pageData = await PageDataCollector.collectPageData(page, testUser.role);
        PageDataCollector.printPageData(pageData);

        expect(pageData.hasUnifiedHeader).toBe(true);
        expect(pageData.hasBreadcrumbs).toBe(true);
        expect(pageData.menuItems.length).toBeGreaterThan(0);
        
        await page.screenshot({ 
          path: `test-results/hr-data-${testPage.name.toLowerCase()}-${Date.now()}.png`,
          fullPage: false 
        });
      });
    }
  });

  test.describe('Admin Role - Complete Page Analysis', () => {
    const testUser = {
      email: 'admin@test.com',
      password: 'Test123456!',
      role: 'admin'
    };

    const pagesToTest = [
      { path: '/admin/dashboard', name: 'Admin Dashboard' },
      { path: '/admin/users', name: 'User Management' },
      { path: '/admin/companies', name: 'Company Management' },
      { path: '/admin/projects', name: 'Project Management' },
      { path: '/admin/worklogs', name: 'Work Logs Management' },
    ];

    test.beforeAll('Login as Admin', async ({ page }) => {
      const success = await PageDataCollector.loginAsUser(page, testUser.email, testUser.password);
      expect(success).toBe(true);
    });

    for (const testPage of pagesToTest) {
      test(`DATA-ADMIN-${testPage.name}: Collect page data`, async ({ page }) => {
        console.log(`\n📊 Collecting data for Admin: ${testPage.name}`);
        
        await page.goto(`${BASE_URL}${testPage.path}`);
        
        const pageData = await PageDataCollector.collectPageData(page, testUser.role);
        PageDataCollector.printPageData(pageData);

        expect(pageData.hasUnifiedHeader).toBe(true);
        expect(pageData.hasBreadcrumbs).toBe(true);
        expect(pageData.menuItems.length).toBeGreaterThan(0);
        
        await page.screenshot({ 
          path: `test-results/admin-data-${testPage.name.toLowerCase()}-${Date.now()}.png`,
          fullPage: false 
        });
      });
    }
  });

  test.describe('Cross-Role Menu Consistency Analysis', () => {
    test('ANALYSIS-001: Compare menu items across roles', async ({ page }) => {
      console.log('\n🔍 Analyzing menu consistency across roles...\n');
      
      const roles = [
        { email: 'freelancer@test.com', password: 'Test123456!', role: 'job_seeker' },
        { email: 'hr@test.com', password: 'Test123456!', role: 'hr_recruiter' },
        { email: 'admin@test.com', password: 'Test123456!', role: 'admin' },
      ];

      const menuData: Record<string, string[]> = {};

      for (const roleInfo of roles) {
        await PageDataCollector.loginAsUser(page, roleInfo.email, roleInfo.password);
        await page.goto(`${BASE_URL}/dashboard`);
        
        const nav = page.locator('nav[aria-label="Global"]').first();
        const menuLinks = nav.locator('a, button');
        const items: string[] = [];
        
        const count = await menuLinks.count();
        for (let i = 0; i < count; i++) {
          try {
            const text = await menuLinks.nth(i).textContent();
            if (text && text.trim()) {
              items.push(text.trim());
            }
          } catch (e) {
            // Ignore
          }
        }
        
        menuData[roleInfo.role] = items;
        console.log(`${roleInfo.role}: ${items.length} menu items`);
        console.log(`  Items: ${items.join(', ')}\n`);
      }

      console.log('📊 Menu Comparison Summary:');
      console.log('='.repeat(80));
      
      const allItems = new Set<string>();
      Object.values(menuData).forEach(items => items.forEach(item => allItems.add(item)));
      
      console.log('\nAll unique menu items across roles:');
      Array.from(allItems).forEach((item, index) => {
        const roles = Object.entries(menuData)
          .filter(([_, items]) => items.includes(item))
          .map(([role]) => role);
        
        console.log(`  ${index + 1}. ${item} - Available to: ${roles.join(', ')}`);
      });
      
      console.log('\n' + '='.repeat(80));
    });
  });

  test.describe('Visual Consistency Deep Dive', () => {
    test('VISUAL-DEEP-001: Analyze header styling across pages', async ({ page }) => {
      console.log('\n🎨 Deep dive into header visual consistency...\n');
      
      await PageDataCollector.loginAsUser(page, 'freelancer@test.com', 'Test123456!');
      
      const pages = [
        '/dashboard',
        '/jobs',
        '/applications',
      ];

      const styles: Record<string, any> = {};

      for (const pagePath of pages) {
        await page.goto(`${BASE_URL}${pagePath}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const nav = page.locator('nav[aria-label="Global"]').first();
        
        const computedStyle = await nav.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            borderBottom: style.borderBottom,
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom,
            position: style.position,
            zIndex: style.zIndex,
            boxShadow: style.boxShadow,
          };
        });

        styles[pagePath] = computedStyle;
        console.log(`${pagePath}:`);
        console.log(`  Background: ${computedStyle.backgroundColor}`);
        console.log(`  Border: ${computedStyle.borderBottom}`);
        console.log(`  Padding: ${computedStyle.paddingTop} / ${computedStyle.paddingBottom}`);
        console.log(`  Position: ${computedStyle.position} (z-index: ${computedStyle.zIndex})`);
        console.log('');
      }

      const allSameBackground = Object.values(styles).every(
        style => style.backgroundColor === styles[pages[0]].backgroundColor
      );
      
      console.log(`✅ All pages have same background: ${allSameBackground ? 'YES' : 'NO'}`);
      expect(allSameBackground).toBe(true);
    });
  });
});
