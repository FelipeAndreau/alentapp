import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const testSportName = `Fútbol E2E ${timestamp}`;

test.describe('Sports Full-Stack E2E', () => {
    test('1. debe crear un deporte real y mostrarlo en la tabla', async ({
        page,
    }) => {
        await page.goto('/sports');

        await page.locator('button:has-text("Crear Deporte")').click();
        await expect(page.getByText('Crear Nuevo Deporte')).toBeVisible();

        await page.getByRole('textbox', { name: 'Nombre' }).fill(testSportName);
        await page
            .getByRole('textbox', { name: 'Descripción' })
            .fill('Deporte de prueba fullstack');
        await page.getByPlaceholder('Ej. 30').fill('22');
        await page.getByPlaceholder('Ej. 5000').fill('500');

        await page
            .getByLabel('Crear Nuevo Deporte')
            .getByRole('button', { name: 'Crear Deporte' })
            .click();

        await expect(
            page.getByRole('cell', { name: testSportName, exact: true }),
        ).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByText('Deporte de prueba fullstack'),
        ).toBeVisible();
    });

    test('2. debe editar la capacidad de un deporte existente y reflejarlo en la tabla', async ({
        page,
    }) => {
        await page.goto('/sports');

        await expect(
            page.getByRole('cell', { name: testSportName, exact: true }),
        ).toBeVisible({ timeout: 10000 });

        const row = page
            .locator('tr')
            .filter({ hasText: testSportName })
            .first();
        await row.locator('button').first().click();

        await expect(
            page.getByText(`Editar Deporte: ${testSportName}`),
        ).toBeVisible();

        await page.getByPlaceholder('Ej. 30').fill('30');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        await expect(page.getByText(`Editar Deporte: ${testSportName}`)).toBeHidden();
        await expect(
            page.getByRole('cell', { name: '30', exact: true }),
        ).toBeVisible({ timeout: 10000 });
    });

    test('3. debe dar de baja un deporte y que desaparezca del listado activo', async ({
        page,
    }) => {
        await page.goto('/sports');

        await expect(
            page.getByRole('cell', { name: testSportName, exact: true }),
        ).toBeVisible({ timeout: 10000 });

        page.on('dialog', (dialog) => dialog.accept());

        const row = page
            .locator('tr')
            .filter({ hasText: testSportName })
            .first();
        await row.locator('button').nth(1).click();

        await expect(
            page.getByRole('cell', { name: testSportName, exact: true }),
        ).toBeHidden({ timeout: 10000 });
    });
});
