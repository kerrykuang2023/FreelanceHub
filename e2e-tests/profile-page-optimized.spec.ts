import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5137';

test.describe('ProfilePage UI Optimization Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'freelancer@test.com');
    await page.fill('input[name="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('ProfilePage loads with optimized layout', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const profileContainer = page.locator('[data-testid="profile-container"]');
    await expect(profileContainer).toBeVisible({ timeout: 10000 });
    
    const pageTitle = page.locator('[data-testid="page-title"]');
    await expect(pageTitle).toBeVisible();
    
    const tabOverview = page.locator('[data-testid="tab-overview"]');
    await expect(tabOverview).toBeVisible();
    
    const tabSkills = page.locator('[data-testid="tab-skills"]');
    await expect(tabSkills).toBeVisible();
    
    const tabExperience = page.locator('[data-testid="tab-experience"]');
    await expect(tabExperience).toBeVisible();
    
    const tabEducation = page.locator('[data-testid="tab-education"]');
    await expect(tabEducation).toBeVisible();
    
    const tabCertifications = page.locator('[data-testid="tab-certifications"]');
    await expect(tabCertifications).toBeVisible();
    
    const tabSettings = page.locator('[data-testid="tab-settings"]');
    await expect(tabSettings).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/profile-page-optimized.png', 
      fullPage: true 
    });
    
    console.log('✅ ProfilePage loaded successfully with all tabs visible');
    
    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('manifest') &&
      !e.includes('404')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('ProfilePage tabs navigation works correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const skillsTab = page.locator('[data-testid="tab-skills"]');
    await skillsTab.click();
    await page.waitForTimeout(500);
    
    const skillList = page.locator('[data-testid="skill-list"]');
    await expect(skillList).toBeVisible();
    
    const addSkillBtn = page.locator('[data-testid="add-skill-btn"]');
    await expect(addSkillBtn).toBeVisible();
    
    const experienceTab = page.locator('[data-testid="tab-experience"]');
    await experienceTab.click();
    await page.waitForTimeout(500);
    
    const educationTab = page.locator('[data-testid="tab-education"]');
    await educationTab.click();
    await page.waitForTimeout(500);
    
    const educationHeader = page.locator('h3:has-text("教育背景")');
    await expect(educationHeader).toBeVisible();
    
    const settingsTab = page.locator('[data-testid="tab-settings"]');
    await settingsTab.click();
    await page.waitForTimeout(500);
    
    const hourlyRateInput = page.locator('[data-testid="hourly-rate-input"]');
    await expect(hourlyRateInput).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/profile-page-tabs-navigation.png', 
      fullPage: true 
    });
    
    console.log('✅ All tabs navigation works correctly');
  });

  test('ProfilePage has consistent styling with other pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const cards = page.locator('.bg-white.rounded-2xl');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    const statCards = page.locator('[class*="card"]');
    const statCardCount = await statCards.count();
    expect(statCardCount).toBeGreaterThan(0);
    
    const gradientButtons = page.locator('[class*="bg-gradient-to-r"]');
    const gradientButtonCount = await gradientButtons.count();
    expect(gradientButtonCount).toBeGreaterThan(0);
    
    await page.screenshot({ 
      path: 'test-results/profile-page-styling.png', 
      fullPage: true 
    });
    
    console.log('✅ ProfilePage has consistent styling');
  });
});
