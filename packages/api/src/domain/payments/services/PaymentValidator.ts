import { PaymentValidationError } from '../errors/PaymentErrors.js';

export class PaymentValidator {
  static validateAmount(amount: string | number) {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new PaymentValidationError('El monto debe ser mayor a 0');
    }
  }

  static validatePeriod(month: number, year: number) {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new PaymentValidationError('El mes debe estar entre 1 y 12');
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!Number.isInteger(year) || year < currentYear) {
      throw new PaymentValidationError('El año no puede ser en el pasado');
    }

    if (year === currentYear && month < currentMonth) {
      throw new PaymentValidationError('El mes no puede ser en el pasado');
    }
  }

  static validateDueDate(dueDateStr: string, month: number, year: number) {
    // #23: Validar formato explicito YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dueDateStr)) {
      throw new PaymentValidationError('La fecha de vencimiento debe tener el formato YYYY-MM-DD');
    }

    const dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      throw new PaymentValidationError('La fecha de vencimiento es invalida');
    }

    const dueDateMonth = dueDate.getUTCMonth() + 1;
    const dueDateYear = dueDate.getUTCFullYear();

    if (dueDateYear < year || (dueDateYear === year && dueDateMonth < month)) {
      throw new PaymentValidationError('La fecha de vencimiento no puede ser anterior al mes/año del pago');
    }
  }
}
