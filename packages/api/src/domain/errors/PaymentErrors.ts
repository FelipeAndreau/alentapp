export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export abstract class NotFoundError extends DomainError {}
export abstract class ConflictError extends DomainError {}
export abstract class ValidationError extends DomainError {}

export class PaymentNotFoundError extends NotFoundError {
  readonly code = 'PAYMENT_NOT_FOUND';
  constructor() { super('Pago no encontrado'); }
}

export class MemberNotFoundError extends NotFoundError {
  readonly code = 'MEMBER_NOT_FOUND';
  constructor(id: string) { super(`Socio con ID ${id} no encontrado`); }
}

export class DuplicateActivePaymentError extends ConflictError {
  readonly code = 'DUPLICATE_ACTIVE_PAYMENT';
  constructor() { super('Ya existe un pago activo (Pending o Paid) para ese periodo'); }
}

export class PaymentAlreadyPaidError extends ConflictError {
  readonly code = 'PAYMENT_ALREADY_PAID';
  constructor() { super('No se puede realizar esta accion porque el pago ya fue cobrado'); }
}

export class PaymentAlreadyCanceledError extends ConflictError {
  readonly code = 'PAYMENT_ALREADY_CANCELED';
  constructor() { super('No se puede realizar esta accion porque el pago ha sido anulado'); }
}

export class PaymentValidationError extends ValidationError {
  readonly code = 'PAYMENT_VALIDATION_ERROR';
  constructor(message: string) { super(message); }
}

export class PaymentNotModifiableError extends ConflictError {
  readonly code = 'PAYMENT_NOT_MODIFIABLE';
  constructor() { super('Solo se pueden modificar pagos en estado Pending'); }
}

export class InactiveMemberError extends ValidationError {
  readonly code = 'INACTIVE_MEMBER';
  constructor() { super('No se pueden emitir pagos a socios con estado Suspendido'); }
}
