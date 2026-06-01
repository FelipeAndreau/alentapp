import { test, expect } from '@playwright/test';

test.describe('Payments Full-Stack E2E', () => {

  test.beforeEach(async ({ page }) => {
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

    await page.locator('button:has-text("Crear Pago")').click();
    await expect(page.getByText('Crear Nuevo Pago')).toBeVisible();

    await page.getByRole('combobox', { name: /Socio/i }).click();
    await page.getByRole('option', { name: 'Socio Para Pagos (99887766)' }).click();
    await page.getByLabel(/Monto/i).fill('2500');
    await page.getByLabel(/Mes/i).fill('12');
    await page.getByLabel(/Año/i).fill('2099');
    await page.getByLabel(/Vencimiento/i).fill('2099-12-31');

    await page.getByRole('button', { name: 'Crear Pago' }).click();

    await expect(page.getByText('$2500')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pending')).toBeVisible();
  });

  test('2. debe registrar el cobro de un pago y actualizar el estado', async ({ page }) => {
    await page.goto('/payments');

    await expect(page.getByText('$2500')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Cobrar' }).first().click();

    await expect(page.getByText('Paid')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pending')).toBeHidden();
  });

  test('3. debe anular un pago y deshabilitar acciones de cobro', async ({ page }) => {
    await page.goto('/payments');
    await page.locator('button:has-text("Crear Pago")').click();
    await page.getByRole('combobox', { name: /Socio/i }).click();
    await page.getByRole('option', { name: 'Socio Para Pagos (99887766)' }).click();
    await page.getByLabel(/Monto/i).fill('5000');
    await page.getByLabel(/Mes/i).fill('6');
    await page.getByLabel(/Año/i).fill('2099');
    await page.getByLabel(/Vencimiento/i).fill('2099-06-30');
    await page.getByRole('button', { name: 'Crear Pago' }).click();

    await expect(page.getByText('$5000')).toBeVisible();

    await page.getByRole('button', { name: 'Anular' }).first().click();

    await expect(page.getByText('Canceled')).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByRole('button', { name: 'Cobrar' }).first()).toBeDisabled();
  });
});
