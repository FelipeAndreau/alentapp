import { DisciplineValidationError } from '../errors/DisciplineErrors.js';

export class DisciplineValidator {
    static validateDates(start_date: string, end_date: string): void {
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (end <= start) {
            throw new DisciplineValidationError('La fecha de fin debe ser posterior a la de inicio');
        }
    }
}
