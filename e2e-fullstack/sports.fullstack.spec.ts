import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para el módulo de Deportes.
 * Verifica la integración real entre UI -> API -> DB.
 */

test.describe('Sports Full-Stack E2E', () => {
    test('1. debe crear un deporte real y mostrarlo en la tabla', async ({
        page,
    }) => {
        await page.goto('/sports');

        // Abrir modal de creación
        await page.locator('button:has-text("Crear Deporte")').click();
        await expect(page.getByText('Crear Nuevo Deporte')).toBeVisible();

        // Llenar formulario
        await page.getByRole('textbox', { name: 'Nombre' }).fill('Fútbol E2E');
        await page
            .getByRole('textbox', { name: 'Descripción' })
            .fill('Deporte de prueba fullstack');
        await page.getByPlaceholder('Ej. 30').fill('22');
        await page.getByPlaceholder('Ej. 5000').fill('500');

        // Guardar
        await page
            .getByLabel('Crear Nuevo Deporte')
            .getByRole('button', { name: 'Crear Deporte' })
            .click();

        // Verificar en la tabla
        await expect(
            page.getByRole('cell', { name: 'Fútbol E2E', exact: true }),
        ).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByText('Deporte de prueba fullstack'),
        ).toBeVisible();
    });

    test('2. debe editar la capacidad de un deporte existente y reflejarlo en la tabla', async ({
        page,
    }) => {
        await page.goto('/sports');

        // Esperar a que el deporte del test anterior cargue
        await expect(
            page.getByRole('cell', { name: 'Fútbol E2E', exact: true }),
        ).toBeVisible({ timeout: 10000 });

        // Click en el botón de editar de la fila
        const row = page
            .locator('tr')
            .filter({ hasText: 'Fútbol E2E' })
            .first();
        await row.locator('button').first().click();

        await expect(
            page.getByText('Editar Deporte: Fútbol E2E'),
        ).toBeVisible();

        // Cambiar capacidad
        await page.getByPlaceholder('Ej. 30').fill('30');

        // Guardar
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        // Verificar el cambio en la tabla
        await expect(page.getByText('Editar Deporte: Fútbol E2E')).toBeHidden();
        await expect(
            page.getByRole('cell', { name: '30', exact: true }),
        ).toBeVisible({ timeout: 10000 });
    });

    test('3. debe dar de baja un deporte y que desaparezca del listado activo', async ({
        page,
    }) => {
        await page.goto('/sports');

        // Esperar a que el deporte esté visible
        await expect(
            page.getByRole('cell', { name: 'Fútbol E2E', exact: true }),
        ).toBeVisible({ timeout: 10000 });

        // Aceptar el dialog de confirmación automáticamente
        page.on('dialog', (dialog) => dialog.accept());

        // Click en el botón de eliminar de la fila
        const row = page
            .locator('tr')
            .filter({ hasText: 'Fútbol E2E' })
            .first();
        await row.locator('button').nth(1).click();

        // Verificar que el deporte ya no aparece en el listado
        await expect(
            page.getByRole('cell', { name: 'Fútbol E2E', exact: true }),
        ).toBeHidden({ timeout: 10000 });
    });
});
