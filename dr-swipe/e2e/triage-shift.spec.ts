import { test, expect } from '@playwright/test';

/**
 * E2E tests for Dr. Swipe - Core functionality
 * Focus: App load, main menu navigation, basic game flow
 * 
 * Note: Tests handle the tutorial overlay that appears on first visit.
 * The tutorial must be dismissed before interacting with main menu buttons.
 */

test.describe('App Load and Main Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for and dismiss tutorial if present
    await page.waitForTimeout(1000);
    const skipButton = page.getByText('— SALTAR TUTORIAL —');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should load the app and show main menu', async ({ page }) => {
    await expect(page).toHaveTitle(/Dr\. Swipe/);
    await expect(page.getByRole('button', { name: 'INICIAR GUARDIA', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'MODO ESTUDIO', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'SIMULACRO ENARM', exact: true })).toBeVisible();
  });

  test('should open and close codex', async ({ page }) => {
    await page.getByRole('button', { name: 'Códex', exact: true }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Códex/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Cerrar/i }).click();
  });

  test('should open and close stats', async ({ page }) => {
    await page.getByRole('button', { name: 'Ver mi diario', exact: true }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Diario/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Cerrar/i }).click();
  });

  test('should open and close settings', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('AJUSTES', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Cerrar Ajustes/i }).click();
  });
});

test.describe('ENARM Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for and dismiss tutorial if present
    await page.waitForTimeout(1000);
    const skipButton = page.getByText('— SALTAR TUTORIAL —');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should toggle ENARM mode', async ({ page }) => {
    const enarmButton = page.getByRole('button', { name: 'SIMULACRO ENARM', exact: true });
    await enarmButton.click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/SIMULACRO ENARM ✓/i)).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display main menu on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for and dismiss tutorial if present
    await page.waitForTimeout(1000);
    const skipButton = page.getByText('— SALTAR TUTORIAL —');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
    
    const button = page.getByRole('button', { name: 'INICIAR GUARDIA', exact: true });
    await expect(button).toBeVisible();
    
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Accessibility', () => {
  test('should have accessible main menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for and dismiss tutorial if present
    await page.waitForTimeout(1000);
    const skipButton = page.getByText('— SALTAR TUTORIAL —');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
    
    await expect(page.getByRole('button', { name: 'INICIAR GUARDIA', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'MODO ESTUDIO', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'SIMULACRO ENARM', exact: true })).toBeVisible();
  });
});
