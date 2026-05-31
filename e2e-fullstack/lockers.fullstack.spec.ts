import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Casilleros (Lockers).
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */

test.describe('Lockers Full-Stack E2E', () => {
    // Número único para evitar colisiones con datos de otros tests
    const testNumber = 90001;

    test('1. debe mostrar el estado vacío cuando no hay casilleros', async ({ page }) => {
        await page.goto('/lockers');
        await expect(page.getByText('No se encontraron casilleros.')).toBeVisible({ timeout: 10000 });
    });

    test('2. debe crear un casillero real y mostrarlo en la tabla', async ({ page }) => {
        await page.goto('/lockers');

        // Abrir modal de creación
        await page.locator('button:has-text("Agregar Casillero")').click();
        await expect(page.getByText('Agregar Nuevo Casillero')).toBeVisible();

        // Llenar formulario
        await page.getByPlaceholder('Ej. 1').fill(testNumber.toString());
        await page.getByPlaceholder('Ej. Vestuario Masculino').fill('Vestuario E2E');

        // El estado por defecto es "Disponible", no hace falta cambiarlo
        // Guardar
        await page.getByRole('button', { name: 'Crear Casillero' }).click();

        // Verificar en la tabla
        await expect(
            page.getByText(`#${testNumber}`),
        ).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByText('Vestuario E2E'),
        ).toBeVisible();
        await expect(
            page.getByText('Disponible'),
        ).toBeVisible();
    });

    test('3. debe editar la ubicación de un casillero y reflejarlo en la tabla', async ({ page }) => {
        await page.goto('/lockers');

        // Esperar que el casillero del test anterior esté en la tabla
        await expect(
            page.getByText(`#${testNumber}`),
        ).toBeVisible({ timeout: 10000 });

        // Click en el botón de editar (ícono de lápiz) de la fila
        const row = page
            .locator('tr')
            .filter({ hasText: `#${testNumber}` })
            .first();
        await row.locator('button').first().click();

        await expect(page.getByText('Editar Casillero')).toBeVisible();

        // Cambiar ubicación
        await page.getByPlaceholder('Ej. Vestuario Masculino').fill('Vestuario E2E Modificado');

        // Guardar
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        // Verificar el cambio en la tabla
        await expect(page.getByText('Editar Casillero')).toBeHidden();
        await expect(
            page.getByText('Vestuario E2E Modificado'),
        ).toBeVisible({ timeout: 10000 });
    });

    test('4. debe eliminar un casillero y mostrar el estado vacío', async ({ page }) => {
        await page.goto('/lockers');

        // Esperar que el casillero editado esté en la tabla
        await expect(
            page.getByText('Vestuario E2E Modificado'),
        ).toBeVisible({ timeout: 10000 });

        // Aceptar el dialog de confirmación automáticamente
        page.on('dialog', (dialog) => dialog.accept());

        // Click en el botón de eliminar (ícono de papelera) de la fila
        const row = page
            .locator('tr')
            .filter({ hasText: 'Vestuario E2E Modificado' })
            .first();
        await row.locator('button').last().click();

        // Verificar que el casillero ya no aparece
        await expect(
            page.getByText('Vestuario E2E Modificado'),
        ).toBeHidden({ timeout: 10000 });

        // La tabla debe quedar vacía o al menos no mostrar el casillero eliminado
        await expect(
            page.getByText('No se encontraron casilleros.'),
        ).toBeVisible({ timeout: 10000 });
    });
});
