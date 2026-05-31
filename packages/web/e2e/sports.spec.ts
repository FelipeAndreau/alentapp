import { test, expect } from '@playwright/test';

test.describe('Sports E2E (UI Integration)', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', (msg) =>
            console.log('BROWSER CONSOLE:', msg.text()),
        );

        const mockDb = [
            {
                id: 'sport-1',
                name: 'Fútbol',
                description: 'Fútbol 11 en cancha de césped',
                max_capacity: 22,
                additional_price: 500,
                requires_medical_certificate: false,
                deleted_at: null,
            },
        ];

        await page.route(/\/api\/v1\/sports/, async (route) => {
            const method = route.request().method();

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: mockDb }),
                });
            } else if (method === 'POST') {
                const payload = route.request().postDataJSON();
                const newSport = {
                    id: `sport-${mockDb.length + 1}`,
                    deleted_at: null,
                    ...payload,
                };
                mockDb.push(newSport);
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: newSport }),
                });
            } else if (method === 'PATCH') {
                const urlObj = new URL(route.request().url());
                const id = urlObj.pathname.split('/').pop();
                const payload = route.request().postDataJSON();
                const index = mockDb.findIndex((s) => s.id === id);
                if (index > -1) {
                    mockDb[index] = { ...mockDb[index], ...payload };
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ data: mockDb[index] }),
                    });
                } else {
                    await route.fulfill({
                        status: 404,
                        body: JSON.stringify({ error: 'El deporte no existe' }),
                    });
                }
            } else if (method === 'DELETE') {
                const urlObj = new URL(route.request().url());
                const id = urlObj.pathname.split('/').pop();
                const index = mockDb.findIndex((s) => s.id === id);
                if (index > -1) {
                    const deletedSport = {
                        ...mockDb[index],
                        deleted_at: new Date().toISOString(),
                    };
                    mockDb.splice(index, 1);
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ data: deletedSport }),
                    });
                } else {
                    await route.fulfill({
                        status: 404,
                        body: JSON.stringify({ error: 'El deporte no existe' }),
                    });
                }
            } else if (method === 'OPTIONS') {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods':
                            'GET, POST, PATCH, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers':
                            'Content-Type, Authorization',
                    },
                });
            } else {
                await route.continue();
            }
        });

        await page.goto('/sports');
    });

    test('debe mostrar la lista de deportes cargada desde el network interceptado', async ({
        page,
    }) => {
        await expect(
            page.getByRole('cell', { name: 'Fútbol', exact: true }),
        ).toBeVisible();
        await expect(
            page.getByText('Fútbol 11 en cancha de césped'),
        ).toBeVisible();
        await expect(
            page.getByRole('cell', { name: '22', exact: true }),
        ).toBeVisible();
    });

    test('debe abrir el modal de creación, crear un deporte y mostrarlo en la tabla', async ({
        page,
    }) => {
        // Abrir modal con el botón del header (no el del modal)
        await page
            .locator(
                'header button:has-text("Crear Deporte"), [data-testid="create-sport-btn"], button.chakra-button:has-text("Crear Deporte")',
            )
            .first()
            .click();
        await expect(page.getByText('Crear Nuevo Deporte')).toBeVisible();

        await page.getByRole('textbox', { name: 'Nombre' }).fill('Natación');
        await page
            .getByRole('textbox', { name: 'Descripción' })
            .fill('Pileta olímpica');
        await page.getByPlaceholder('Ej. 30').fill('30');
        await page.getByPlaceholder('Ej. 5000').fill('1000');

        // Hacer click en el botón submit dentro del modal
        await page
            .getByLabel('Crear Nuevo Deporte')
            .getByRole('button', { name: 'Crear Deporte' })
            .click();

        await expect(page.getByText('Crear Nuevo Deporte')).toBeHidden();
        await expect(
            page.getByRole('cell', { name: 'Natación', exact: true }),
        ).toBeVisible();
    });

    test('debe abrir el modal de edición, actualizar la capacidad y mostrar el cambio', async ({
        page,
    }) => {
        await expect(
            page.getByRole('cell', { name: 'Fútbol', exact: true }),
        ).toBeVisible();

        // Buscar el botón de editar dentro de la fila de la tabla
        const row = page.locator('tr').filter({ hasText: 'Fútbol' }).first();
        await row.locator('button').first().click();

        await expect(page.getByText('Editar Deporte: Fútbol')).toBeVisible();

        await page.getByPlaceholder('Ej. 30').fill('30');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        await expect(page.getByText('Editar Deporte: Fútbol')).toBeHidden();
        await expect(
            page.getByRole('cell', { name: '30', exact: true }),
        ).toBeVisible();
    });

    test('debe dar de baja un deporte tras aceptar la confirmación', async ({
        page,
    }) => {
        page.on('dialog', (dialog) => dialog.accept());

        await expect(
            page.getByRole('cell', { name: 'Fútbol', exact: true }),
        ).toBeVisible();

        // Buscar el botón de eliminar dentro de la fila de la tabla
        const row = page.locator('tr').filter({ hasText: 'Fútbol' }).first();
        await row.locator('button').nth(1).click();

        await expect(
            page.getByText('No hay deportes registrados.'),
        ).toBeVisible();
        await expect(
            page.getByRole('cell', { name: 'Fútbol', exact: true }),
        ).toBeHidden();
    });
});
