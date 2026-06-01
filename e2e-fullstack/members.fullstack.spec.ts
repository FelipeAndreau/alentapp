import { test, expect } from '@playwright/test';

test.describe('Members Full-Stack E2E', () => {
  let testMemberName: string;
  let testMemberDni: string;
  let testMemberEmail: string;

  test.beforeAll(() => {
    const timestamp = Date.now();
    testMemberName = `Test E2E Fullstack ${timestamp}`;
    testMemberDni = `${timestamp.toString().slice(-8)}`;
    testMemberEmail = `fullstack${timestamp}@e2e.com`;
  });

  test('debe mostrar la vista de miembros', async ({ page }) => {
    await page.goto('/members');
    await expect(page.getByRole('heading', { name: 'Administración de Miembros' })).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un miembro real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/members');

    await page.locator('button:has-text("Agregar Miembro")').click();
    await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();

    await page.getByPlaceholder('Ej. Juan Pérez').fill(testMemberName);
    await page.getByPlaceholder('Ej. 12345678').fill(testMemberDni);
    await page.getByPlaceholder('ejemplo@correo.com').fill(testMemberEmail);
    await page.getByLabel(/Fecha de Nacimiento/i).fill('1995-06-15');

    await page.getByRole('button', { name: 'Crear Miembro' }).click();

    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();
    await expect(page.getByText(testMemberName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: testMemberDni, exact: true })).toBeVisible();
  });

  test('debe editar el miembro creado y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/members');

    await expect(page.getByText(testMemberName)).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Editar miembro/i }).first().click();
    await expect(page.getByText('Editar Miembro')).toBeVisible();

    const editedName = `${testMemberName} Editado`;
    await page.getByPlaceholder('Ej. Juan Pérez').fill(editedName);

    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden();

    await expect(page.getByText(editedName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(testMemberName, { exact: true })).toBeHidden();
  });

  test('debe eliminar el miembro y mostrar el estado vacío', async ({ page }) => {
    await page.goto('/members');

    const editedName = `${testMemberName} Editado`;
    await expect(page.getByText(editedName)).toBeVisible({ timeout: 10000 });

    page.on('dialog', (dialog) => dialog.accept());

    await page.getByRole('button', { name: /Eliminar miembro/i }).first().click();

    await expect(page.getByText(editedName)).toBeHidden({ timeout: 10000 });
  });
});
