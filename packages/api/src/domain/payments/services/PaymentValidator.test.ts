import { describe, it, expect } from 'vitest';
import { PaymentValidator } from './PaymentValidator.js';
import { PaymentValidationError } from '../errors/PaymentErrors.js';

describe('PaymentValidator', () => {
  describe('validateAmount', () => {
    it('debe lanzar error si el monto es 0', () => {
      expect(() => PaymentValidator.validateAmount(0)).toThrow(PaymentValidationError);
      expect(() => PaymentValidator.validateAmount(0)).toThrow('El monto debe ser mayor a 0');
    });
  });

  describe('validatePeriod', () => {
    it('debe lanzar error si el mes es invalido', () => {
      expect(() => PaymentValidator.validatePeriod(13, 2026)).toThrow('El mes debe estar entre 1 y 12');
    });

    it('debe lanzar error si el año es pasado', () => {
      expect(() => PaymentValidator.validatePeriod(1, 2020)).toThrow('El año no puede ser en el pasado');
    });
  });

  describe('validateDueDate', () => {
    it('debe lanzar error si el formato es invalido', () => {
      expect(() => PaymentValidator.validateDueDate('15/05/2026', 5, 2026)).toThrow('La fecha de vencimiento debe tener el formato YYYY-MM-DD');
    });

    it('debe lanzar error si la fecha es anterior al periodo', () => {
      expect(() => PaymentValidator.validateDueDate('2026-04-30', 5, 2026)).toThrow('La fecha de vencimiento no puede ser anterior al mes/año del pago');
    });
  });
});
