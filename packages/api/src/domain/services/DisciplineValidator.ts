export class DisciplineValidator {
    validateDates(start_date: string | Date, end_date: string | Date): void {
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (end <= start) {
            throw new Error('La fecha de fin debe ser posterior a la de inicio');
        }
    }
}
