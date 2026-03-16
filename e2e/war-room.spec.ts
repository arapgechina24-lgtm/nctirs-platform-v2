import { test, expect } from '@playwright/test';

test.describe('War Room Operations', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // 1. Authenticate via Registration (to ensure fresh user and DB sync)
        // Use random email to avoid unique constraint violation if DB persists
        const uniqueId = Date.now();
        const email = `test-admin-${uniqueId}@nis.go.ke`;

        await page.goto('/register');
        await page.fill('input[placeholder="John Mwangi"]', 'E2E Test Agent');
        await page.fill('input[type="email"]', email);
        await page.selectOption('select', 'NIS');
        // Password
        await page.fill('input[placeholder="Min 6 characters"]', 'securepass123');
        await page.fill('input[placeholder="Confirm password"]', 'securepass123');

        // Submit
        await page.click('button[type="submit"]');

        // Verify Redirect to Dashboard
        await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('Director General View & Live Threat Map', async ({ page }) => {
        // 2. Verify Map Loading
        const map = page.locator('.leaflet-container');
        await expect(map).toBeVisible({ timeout: 10000 });

        // 3. Verify Director General Narrative
        await expect(page.getByText('DIRECTOR GENERAL // EYES ONLY')).toBeVisible();
        await expect(page.getByText('LIVE THREAT VECTORS // GOD\'S EYE VIEW')).toBeVisible();

        // 4. Verify Active Threats (Red Beacons)
        // Wait for at least one threat marker to appear (mock data)
        const threatMarker = page.locator('.pulsing-beacon').first();
        await expect(threatMarker).toBeVisible({ timeout: 15000 });
    });

    test('Sovereign Shield Activation (Air-Gap Toggle)', async ({ page }) => {
        // 5. Verify Toggle Existence
        const toggle = page.getByRole('switch');
        await expect(toggle).toBeVisible();
        await expect(page.getByText('CONNECTED')).toBeVisible();

        // 6. Activate Air-Gap Mode
        await toggle.click();

        // 7. Verify Global Theme Change (Red Alert)
        await expect(page.locator('body')).toHaveClass(/theme-sovereign-lockdown/);
        await expect(page.getByText('AIR-GAPPED')).toBeVisible();
        await expect(page.getByText('NO EXT. TRAFFIC')).toBeVisible();
    });

    test('Emergency Breach Simulation', async ({ page }) => {
        // 8. Trigger Simulation
        const simulateBtn = page.getByRole('button', { name: 'SIMULATE BREACH' });
        await simulateBtn.click();

        // 9. Verify Red Alert Overlay
        await expect(page.getByText('CRITICAL INFRASTRUCTURE BREACH DETECTED')).toBeVisible();
        await expect(page.getByText('SEACOM SUBMARINE CABLE - MOMBASA')).toBeVisible();

        // 10. Mitigate
        await page.click('button:has-text("INITIATE COUNTER-MEASURES")');
        await expect(page.getByText('BREACH CONTAINED')).toBeVisible();

        // 11. Dismiss
        await page.click('button:has-text("RETURN TO WATCH")');
        await expect(page.getByText('CRITICAL INFRASTRUCTURE BREACH DETECTED')).not.toBeVisible();
    });

});
