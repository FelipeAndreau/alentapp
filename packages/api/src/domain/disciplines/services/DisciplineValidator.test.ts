import { describe, it, expect } from 'vitest';
import { DisciplineValidator } from './DisciplineValidator.js';
import { DisciplineValidationError } from '../errors/DisciplineErrors.js';

describe('DisciplineValidator', () => {
    const validator = new DisciplineValidator();

    describe('validateDates', () => {
        it('no debe lanzar error cuando end_date es estrictamente posterior a start_date', () => {
            expect(() =>
                validator.validateDates('2026-06-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z'),
            ).not.toThrow();
        });

        it('debe lanzar DisciplineValidationError cuando end_date es igual a start_date', () => {
            expect(() =>
                validator.validateDates('2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
            ).toThrow(DisciplineValidationError);

            expect(() =>
                validator.validateDates('2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
            ).toThrow('La fecha de fin debe ser posterior a la de inicio');
        });

        it('debe lanzar DisciplineValidationError cuando end_date es anterior a start_date', () => {
            expect(() =>
                validator.validateDates('2026-08-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
            ).toThrow(DisciplineValidationError);

            expect(() =>
                validator.validateDates('2026-08-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
            ).toThrow('La fecha de fin debe ser posterior a la de inicio');
        });
    });
});
