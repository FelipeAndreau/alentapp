import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Disciplinas.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 *
 * Como Discipline requiere un socio existente, se crea uno via API
 * en el beforeAll antes de correr los tests de UI.
 */

test.describe('Disciplines Full-Stack E2E', () => {

  test.beforeAll(async ({ request }) => {
    // Creamos un socio real via API para usarlo como owner en los tests de disciplina.
    // No lo hacemos por UI porque ese flujo ya está cubierto en members.fullstack.spec.ts.
    await request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio E2E Disciplines',
        dni: '11223344',
        email: 'e2e.disciplines@test.com',
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
  });

  test('debe mostrar el estado vacío cuando no hay disciplinas registradas', async ({ page }) => {
    await page.goto('/disciplines');
    await expect(page.getByText('No hay disciplinas registradas.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear una disciplina real y mostrarla en la tabla', async ({ page }) => {
    await page.goto('/disciplines');

    // Abrir modal de creación
    await page.locator('button:has-text("Nueva Disciplina")').click();
    await expect(page.getByText('Nueva Disciplina').last()).toBeVisible();

    // Seleccionar socio en el Select de Chakra UI
    await page.getByRole('combobox', { name: /Socio/i }).click();
    await page.getByRole('option', { name: /Socio E2E Disciplines/ }).click();

    // Llenar motivo
    await page.getByPlaceholder('Ej. Conducta antideportiva').fill('Conducta antideportiva E2E');

    // Fechas de inicio y fin
    await page.getByLabel(/Fecha de inicio/i).fill('2026-06-01');
    await page.getByLabel(/Fecha de fin/i).fill('2026-08-01');

    // Registrar
    await page.getByRole('button', { name: 'Registrar' }).click();

    // Verificar que aparece en la tabla
    await expect(page.getByText('Conducta antideportiva E2E')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Socio E2E Disciplines/)).toBeVisible();
  });

  test('debe editar la disciplina y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/disciplines');

    // Esperar que la disciplina del test anterior esté en la tabla
    await expect(page.getByText('Conducta antideportiva E2E')).toBeVisible({ timeout: 10000 });

    // Clic en el botón de editar (ícono de lápiz) de la fila correspondiente
    const row = page.locator('tr', { hasText: 'Conducta antideportiva E2E' });
    await row.getByRole('button').first().click();

    await expect(page.getByText('Editar Disciplina')).toBeVisible();

    // Cambiar el motivo
    await page.getByPlaceholder('Ej. Conducta antideportiva').fill('Conducta antideportiva E2E — editada');

    // Guardar cambios
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeHidden();

    // Verificar el cambio en la tabla
    await expect(page.getByText('Conducta antideportiva E2E — editada')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Conducta antideportiva E2E', { exact: true })).toBeHidden();
  });

  test('debe eliminar la disciplina y mostrar el estado vacío', async ({ page }) => {
    await page.goto('/disciplines');

    // La disciplina editada debería seguir en la tabla
    await expect(page.getByText('Conducta antideportiva E2E — editada')).toBeVisible({ timeout: 10000 });

    // Clic en el botón de eliminar (ícono de papelera, segundo botón de la fila)
    const row = page.locator('tr', { hasText: 'Conducta antideportiva E2E — editada' });
    await row.getByRole('button').last().click();

    // Confirmar en el dialog de confirmación
    await expect(page.getByText('Eliminar disciplina')).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar' }).click();

    // La tabla debe quedar vacía
    await expect(page.getByText('No hay disciplinas registradas.')).toBeVisible({ timeout: 10000 });
  });

});
