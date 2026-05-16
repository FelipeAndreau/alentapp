import { NotFoundError, ValidationError } from '../../payments/errors/PaymentErrors.js';

export class MemberNotFoundForDisciplineError extends NotFoundError {
    readonly code = 'MEMBER_NOT_FOUND';
    constructor(id: string) { super(`No existe un socio con ID ${id}`); }
}

export class DisciplineNotFoundError extends NotFoundError {
    readonly code = 'DISCIPLINE_NOT_FOUND';
    constructor(id: string) { super(`No existe una disciplina con ID ${id}`); }
}

export class DisciplineValidationError extends ValidationError {
    readonly code = 'DISCIPLINE_VALIDATION_ERROR';
    constructor(message: string) { super(message); }
}
