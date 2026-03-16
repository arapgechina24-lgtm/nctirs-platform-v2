import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG Compliance', () => {
    test.setTimeout(60000);

    test('Login Page Accessibility Info', async ({ page }) => {
        await page.goto('/login');

        // Analyze page accessibility
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        // Check for violations
        if (accessibilityScanResults.violations.length > 0) {
            console.log('VIOLATIONS FOUND:', JSON.stringify(accessibilityScanResults.violations, null, 2));
        }

        // We expect zero serious violations
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Registration Page Accessibility Info', async ({ page }) => {
        await page.goto('/register');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
