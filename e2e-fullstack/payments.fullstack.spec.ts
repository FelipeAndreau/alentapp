import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para el módulo de Pagos.
 * Verifica la integración real entre UI -> API -> DB.
 */

test.describe('Payments Full-Stack E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Aseguramos que haya al menos un socio para poder crear pagos
    // En un entorno ideal, esto se haría vía API o Seed directo a la DB
    await page.goto('/members');
    const memberExists = await page.getByText('Socio Para Pagos').isVisible();
    
    if (!memberExists) {
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio Para Pagos');
        await page.getByPlaceholder('Ej. 12345678').fill('99887766');
        await page.getByPlaceholder('ejemplo@correo.com').fill('pagos@e2e.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByText('Socio Para Pagos')).toBeVisible();
    }
  });

  test('1. debe crear un pago real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/payments');

    // Abrir modal de creación
    await page.locator('button:has-text("Nuevo Pago")').click();
    await expect(page.getByText('Registrar Nuevo Pago')).toBeVisible();

    // Llenar formulario
    // El selector de socio es un Select de Chakra/React-Router
    await page.getByLabel(/Socio/i).selectOption({ label: 'Socio Para Pagos' });
    await page.getByLabel(/Monto/i).fill('2500');
    await page.getByLabel(/Mes/i).selectOption('5'); // Mayo
    await page.getByLabel(/Año/i).fill('2026');
    await page.getByLabel(/Vencimiento/i).fill('2026-05-31');

    // Guardar
    await page.getByRole('button', { name: 'Crear Pago' }).click();

    // Verificar en la tabla
    await expect(page.getByText('2.500')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pendiente')).toBeVisible();
  });

  test('2. debe registrar el cobro de un pago y actualizar el estado', async ({ page }) => {
    await page.goto('/payments');

    // Esperar a que el pago del test anterior cargue
    await expect(page.getByText('2.500')).toBeVisible({ timeout: 10000 });

    // Click en el botón de pagar (icono de check o texto "Cobrar")
    await page.getByRole('button', { name: /Marcar como pagado/i }).first().click();

    // Verificar cambio visual a "Pagado"
    await expect(page.getByText('Pagado')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pendiente')).toBeHidden();
  });

  test('3. debe anular un pago y deshabilitar acciones de cobro', async ({ page }) => {
    // Primero creamos otro pago rápido para anular
    await page.goto('/payments');
    await page.locator('button:has-text("Nuevo Pago")').click();
    await page.getByLabel(/Socio/i).selectOption({ label: 'Socio Para Pagos' });
    await page.getByLabel(/Monto/i).fill('5000');
    await page.getByLabel(/Mes/i).selectOption('12');
    await page.getByLabel(/Año/i).fill('2026');
    await page.getByLabel(/Vencimiento/i).fill('2026-12-31');
    await page.getByRole('button', { name: 'Crear Pago' }).click();

    await expect(page.getByText('5.000')).toBeVisible();

    // Anular el pago
    await page.getByRole('button', { name: /Anular pago/i }).first().click();

    // Verificar estado "Anulado"
    await expect(page.getByText('Anulado')).toBeVisible({ timeout: 10000 });
    
    // Verificar que el botón de cobrar ya no está disponible para ese pago
    // (Buscamos que no haya botones de cobro visibles en la fila del pago anulado)
    const row = page.locator('tr:has-text("5.000")');
    await expect(row.getByRole('button', { name: /Marcar como pagado/i })).toBeHidden();
  });
});
