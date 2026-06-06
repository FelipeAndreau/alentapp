import { test, expect } from '@playwright/test';

test.describe('Enrollments Full-Stack E2E', () => {
    test('1. debe crear una inscripcion real y mostrarla en la tabla', async ({
        page,
    }) => {
        // Crear socio
        await page.goto('/members');
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page
            .getByRole('textbox', { name: 'Nombre Completo' })
            .fill('Socio E2E Enrollment');
        await page.getByRole('textbox', { name: 'DNI' }).fill('99887766');
        await page
            .getByRole('textbox', { name: 'Correo Electrónico' })
            .fill('enrollment@test.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByText('Socio E2E Enrollment')).toBeVisible({
            timeout: 10000,
        });

        // Crear deporte
        await page.goto('/sports');
        await page.locator('button:has-text("Crear Deporte")').click();
        await page
            .getByRole('textbox', { name: 'Nombre' })
            .fill('Deporte E2E Enrollment');
        await page.getByPlaceholder('Ej. 30').fill('10');
        await page.getByPlaceholder('Ej. 5000').fill('0');
        await page
            .getByLabel('Crear Nuevo Deporte')
            .getByRole('button', { name: 'Crear Deporte' })
            .click();
        await expect(
            page.getByRole('cell', {
                name: 'Deporte E2E Enrollment',
                exact: true,
            }),
        ).toBeVisible({ timeout: 10000 });

        // Crear inscripción
        await page.goto('/enrollments');
        await page.locator('button:has-text("Nueva Inscripción")').click();

        // Esperar que el título del modal sea visible
        await expect(
            page.getByRole('heading', { name: 'Nueva Inscripción' }),
        ).toBeVisible();

        const memberSelect = page.locator('select').first();
        await memberSelect.selectOption({
            label: 'Socio E2E Enrollment — DNI: 99887766',
        });

        const sportSelect = page.locator('select').nth(1);
        await sportSelect.selectOption({ label: 'Deporte E2E Enrollment' });

        await page.getByRole('button', { name: 'Crear Inscripción' }).click();

        await expect(
            page.getByRole('heading', { name: 'Nueva Inscripción' }),
        ).toBeHidden({ timeout: 10000 });
        await expect(page.getByText('Socio E2E Enrollment')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText('Deporte E2E Enrollment')).toBeVisible({
            timeout: 10000,
        });
    });

    test('2. debe desactivar una inscripcion existente y mostrar el cambio de estado', async ({
        page,
    }) => {
        // Este test crea su propia inscripción para ser independiente
        await page.goto('/members');
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page
            .getByRole('textbox', { name: 'Nombre Completo' })
            .fill('Socio E2E Toggle');
        await page.getByRole('textbox', { name: 'DNI' }).fill('99887755');
        await page
            .getByRole('textbox', { name: 'Correo Electrónico' })
            .fill('toggle@test.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByText('Socio E2E Toggle')).toBeVisible({
            timeout: 10000,
        });

        await page.goto('/sports');
        await page.locator('button:has-text("Crear Deporte")').click();
        await page
            .getByRole('textbox', { name: 'Nombre' })
            .fill('Deporte E2E Toggle');
        await page.getByPlaceholder('Ej. 30').fill('10');
        await page.getByPlaceholder('Ej. 5000').fill('0');
        await page
            .getByLabel('Crear Nuevo Deporte')
            .getByRole('button', { name: 'Crear Deporte' })
            .click();
        await expect(
            page.getByRole('cell', { name: 'Deporte E2E Toggle', exact: true }),
        ).toBeVisible({ timeout: 10000 });

        await page.goto('/enrollments');
        await page.locator('button:has-text("Nueva Inscripción")').click();
        await expect(
            page.getByRole('heading', { name: 'Nueva Inscripción' }),
        ).toBeVisible();
        await page
            .locator('select')
            .first()
            .selectOption({ label: 'Socio E2E Toggle — DNI: 99887755' });
        await page
            .locator('select')
            .nth(1)
            .selectOption({ label: 'Deporte E2E Toggle' });
        await page.getByRole('button', { name: 'Crear Inscripción' }).click();
        await expect(page.getByText('Socio E2E Toggle')).toBeVisible({
            timeout: 10000,
        });

        // Desactivar la inscripción
        const row = page
            .locator('tr')
            .filter({ hasText: 'Socio E2E Toggle' })
            .first();
        await row.locator('button').first().click();
        await expect(
            page.getByRole('heading', { name: 'Desactivar inscripción' }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Desactivar' }).click();

        await expect(
            page.getByRole('heading', { name: 'Desactivar inscripción' }),
        ).toBeHidden({ timeout: 10000 });

        const updatedRow = page
            .locator('tr')
            .filter({ hasText: 'Socio E2E Toggle' })
            .first();
        await expect(updatedRow.getByText('Inactiva')).toBeVisible({
            timeout: 10000,
        });
    });

    test('3. debe dar de baja una inscripcion y que desaparezca del listado', async ({
        page,
    }) => {
        // Este test crea su propia inscripción para ser independiente
        await page.goto('/members');
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page
            .getByRole('textbox', { name: 'Nombre Completo' })
            .fill('Socio E2E Baja');
        await page.getByRole('textbox', { name: 'DNI' }).fill('99887744');
        await page
            .getByRole('textbox', { name: 'Correo Electrónico' })
            .fill('baja@test.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByText('Socio E2E Baja')).toBeVisible({
            timeout: 10000,
        });

        await page.goto('/sports');
        await page.locator('button:has-text("Crear Deporte")').click();
        await page
            .getByRole('textbox', { name: 'Nombre' })
            .fill('Deporte E2E Baja');
        await page.getByPlaceholder('Ej. 30').fill('10');
        await page.getByPlaceholder('Ej. 5000').fill('0');
        await page
            .getByLabel('Crear Nuevo Deporte')
            .getByRole('button', { name: 'Crear Deporte' })
            .click();
        await expect(
            page.getByRole('cell', { name: 'Deporte E2E Baja', exact: true }),
        ).toBeVisible({ timeout: 10000 });

        await page.goto('/enrollments');
        await page.locator('button:has-text("Nueva Inscripción")').click();
        await expect(
            page.getByRole('heading', { name: 'Nueva Inscripción' }),
        ).toBeVisible();
        await page
            .locator('select')
            .first()
            .selectOption({ label: 'Socio E2E Baja — DNI: 99887744' });
        await page
            .locator('select')
            .nth(1)
            .selectOption({ label: 'Deporte E2E Baja' });
        await page.getByRole('button', { name: 'Crear Inscripción' }).click();
        await expect(page.getByText('Socio E2E Baja')).toBeVisible({
            timeout: 10000,
        });

        // Dar de baja
        const row = page
            .locator('tr')
            .filter({ hasText: 'Socio E2E Baja' })
            .first();
        await row.locator('button').nth(1).click();
        await expect(
            page.getByRole('heading', { name: 'Dar de baja inscripción' }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Dar de baja' }).click();

        await expect(page.getByText('Socio E2E Baja')).toBeHidden({
            timeout: 10000,
        });
    });
});
