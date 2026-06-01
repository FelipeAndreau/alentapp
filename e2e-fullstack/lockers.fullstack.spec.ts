import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const testNumber = 90000 + (timestamp % 1000);

test.describe('Lockers Full-Stack E2E', () => {
    test('1. debe mostrar el estado vacío cuando no hay casilleros', async ({ page }) => {
        await page.goto('/lockers');
        await expect(page.getByText('No se encontraron casilleros.')).toBeVisible({ timeout: 10000 });
    });

    test('2. debe crear un casillero real y mostrarlo en la tabla', async ({ page }) => {
        await page.goto('/lockers');

        await page.locator('button:has-text("Agregar Casillero")').click();
        await expect(page.getByText('Agregar Nuevo Casillero')).toBeVisible();

        await page.getByPlaceholder('Ej. 1').fill(testNumber.toString());
        await page.getByPlaceholder('Ej. Vestuario Masculino').fill('Vestuario E2E');

        await page.getByRole('button', { name: 'Crear Casillero' }).click();

        await expect(page.getByText('Agregar Nuevo Casillero')).toBeHidden();

        const table = page.locator('table');
        await expect(table.getByText(`#${testNumber}`)).toBeVisible({ timeout: 10000 });
        await expect(table.getByText('Vestuario E2E')).toBeVisible();
        await expect(table.getByText('Disponible')).toBeVisible();
    });

    test('3. debe editar la ubicación de un casillero y reflejarlo en la tabla', async ({ page }) => {
        await page.goto('/lockers');

        const table = page.locator('table');
        await expect(table.getByText(`#${testNumber}`)).toBeVisible({ timeout: 10000 });

        const row = table
            .locator('tr')
            .filter({ hasText: `#${testNumber}` })
            .first();
        await row.locator('button').first().click();

        await expect(page.getByText('Editar Casillero')).toBeVisible();

        await page.getByPlaceholder('Ej. Vestuario Masculino').fill('Vestuario E2E Modificado');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        await expect(page.getByText('Editar Casillero')).toBeHidden();
        await expect(table.getByText('Vestuario E2E Modificado')).toBeVisible({ timeout: 10000 });
    });

    test('4. debe eliminar un casillero y mostrar el estado vacío', async ({ page }) => {
        await page.goto('/lockers');

        const table = page.locator('table');
        await expect(table.getByText('Vestuario E2E Modificado')).toBeVisible({ timeout: 10000 });

        page.on('dialog', (dialog) => dialog.accept());

        const row = table
            .locator('tr')
            .filter({ hasText: 'Vestuario E2E Modificado' })
            .first();
        await row.locator('button').last().click();

        await expect(table.getByText('Vestuario E2E Modificado')).toBeHidden({ timeout: 10000 });

        await expect(page.getByText('No se encontraron casilleros.')).toBeVisible({ timeout: 10000 });
    });
});
