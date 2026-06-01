import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const testDni = `${timestamp.toString().slice(-8)}`;
const testMemberName = `Socio E2E Disciplines ${timestamp}`;
const testEmail = `e2e.disciplines${timestamp}@test.com`;
const testReason = `Conducta antideportiva E2E ${timestamp}`;

test.describe('Disciplines Full-Stack E2E', () => {

  test.beforeAll(async ({ request }) => {
    await request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: testMemberName,
        dni: testDni,
        email: testEmail,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
  });

  test.afterAll(async ({ request }) => {
    const listRes = await request.get('http://localhost:3001/api/v1/socios');
    const members = await listRes.json();
    const testMember = members.data?.find((m: any) => m.dni === testDni);
    if (testMember) {
      await request.delete(`http://localhost:3001/api/v1/socios/${testMember.id}`);
    }
  });

  test('debe mostrar el estado vacío cuando no hay disciplinas registradas', async ({ page }) => {
    await page.goto('/disciplines');
    await expect(page.getByText('No hay disciplinas registradas.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear una disciplina real y mostrarla en la tabla', async ({ page }) => {
    await page.goto('/disciplines');

    await page.locator('button:has-text("Nueva Disciplina")').click();
    await expect(page.getByText('Nueva Disciplina').last()).toBeVisible();

    await page.getByRole('combobox', { name: /Socio/i }).click();
    await page.getByRole('option', { name: new RegExp(testMemberName) }).click();

    await page.getByPlaceholder('Ej. Conducta antideportiva').fill(testReason);

    await page.getByLabel(/Fecha de inicio/i).fill('2026-06-01');
    await page.getByLabel(/Fecha de fin/i).fill('2026-08-01');

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/disciplines') && resp.status() === 201),
      page.getByRole('button', { name: 'Registrar' }).click(),
    ]);

    const table = page.locator('table');
    await expect(table.getByText(testReason)).toBeVisible({ timeout: 10000 });
  });

  test('debe editar la disciplina y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/disciplines');

    const table = page.locator('table');
    await expect(table.getByText(testReason)).toBeVisible({ timeout: 10000 });

    const row = table.locator('tr').filter({ hasText: testReason });
    await row.getByRole('button').first().click();

    await expect(page.getByText('Editar Disciplina')).toBeVisible();

    const editedReason = `${testReason} — editada`;
    await page.getByPlaceholder('Ej. Conducta antideportiva').fill(editedReason);

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/disciplines') && resp.status() === 200),
      page.getByRole('button', { name: 'Guardar cambios' }).click(),
    ]);

    await expect(table.getByText(editedReason)).toBeVisible({ timeout: 10000 });
    await expect(table.getByText(testReason, { exact: true })).toBeHidden();
  });

  test('debe eliminar la disciplina y mostrar el estado vacío', async ({ page }) => {
    await page.goto('/disciplines');

    const table = page.locator('table');
    const editedReason = `${testReason} — editada`;
    await expect(table.getByText(editedReason)).toBeVisible({ timeout: 10000 });

    const row = table.locator('tr').filter({ hasText: editedReason });
    await row.getByRole('button').last().click();

    await expect(page.getByText('Eliminar disciplina')).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.getByText('No hay disciplinas registradas.')).toBeVisible({ timeout: 10000 });
  });

});
