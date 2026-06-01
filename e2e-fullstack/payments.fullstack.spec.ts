import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const testMemberName = `Socio Para Pagos ${timestamp}`;
const testMemberDni = `${timestamp.toString().slice(-8)}`;
const testMemberEmail = `pagos${timestamp}@e2e.com`;

test.describe('Payments Full-Stack E2E', () => {

  test.beforeEach(async ({ page, request }) => {
    await page.goto('/members');
    const memberExists = await page.getByText(testMemberName).isVisible();
    
    if (!memberExists) {
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page.getByPlaceholder('Ej. Juan Pérez').fill(testMemberName);
        await page.getByPlaceholder('Ej. 12345678').fill(testMemberDni);
        await page.getByPlaceholder('ejemplo@correo.com').fill(testMemberEmail);
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByText(testMemberName)).toBeVisible();
    }
  });

  test.afterAll(async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/v1/socios');
    const body = await res.json();
    const member = body.data?.find((m: any) => m.dni === testMemberDni);
    if (member) {
      await request.delete(`http://localhost:3001/api/v1/socios/${member.id}`);
    }
  });

  test('1. debe crear un pago real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/payments');

    await page.locator('button:has-text("Crear Pago")').click();
    await expect(page.getByText('Crear Nuevo Pago')).toBeVisible();

    await page.getByRole('combobox', { name: /Socio/i }).click();
    await page.getByRole('option', { name: `${testMemberName} (${testMemberDni})` }).click();
    await page.getByLabel(/Monto/i).fill('2500');
    await page.getByLabel(/Mes/i).fill('5');
    await page.getByLabel(/Año/i).fill('2026');
    await page.getByLabel(/Vencimiento/i).fill('2026-05-31');

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
    await page.getByRole('option', { name: `${testMemberName} (${testMemberDni})` }).click();
    await page.getByLabel(/Monto/i).fill('5000');
    await page.getByLabel(/Mes/i).fill('12');
    await page.getByLabel(/Año/i).fill('2026');
    await page.getByLabel(/Vencimiento/i).fill('2026-12-31');
    await page.getByRole('button', { name: 'Crear Pago' }).click();

    await expect(page.getByText('$5000')).toBeVisible();

    await page.getByRole('button', { name: 'Anular' }).first().click();

    await expect(page.getByText('Canceled')).toBeVisible({ timeout: 10000 });
    
    const row = page.locator('tr:has-text("5000")');
    await expect(row.getByRole('button', { name: 'Cobrar' })).toBeHidden();
  });
});
