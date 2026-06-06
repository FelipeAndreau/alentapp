import {
    NotFoundError,
    ConflictError,
    ValidationError,
} from '../../payments/errors/PaymentErrors.js';

export class EnrollmentNotFoundError extends NotFoundError {
    readonly code = 'ENROLLMENT_NOT_FOUND';
    constructor() {
        super('Inscripción no encontrada');
    }
}

export class EnrollmentAlreadyDeletedError extends ConflictError {
    readonly code = 'ENROLLMENT_ALREADY_DELETED';
    constructor() {
        super('La inscripción ya fue dada de baja');
    }
}

export class EnrollmentValidationError extends ValidationError {
    readonly code = 'ENROLLMENT_VALIDATION_ERROR';
    constructor(message: string) {
        super(message);
    }
}

export class EnrollmentDuplicateError extends ConflictError {
    readonly code = 'ENROLLMENT_DUPLICATE';
    constructor() {
        super('El socio ya tiene una inscripción activa en este deporte');
    }
}

export class EnrollmentCapacityError extends ConflictError {
    readonly code = 'ENROLLMENT_CAPACITY_FULL';
    constructor() {
        super('No hay cupo disponible para este deporte');
    }
}

export class EnrollmentMemberInactiveError extends ConflictError {
    readonly code = 'ENROLLMENT_MEMBER_INACTIVE';
    constructor() {
        super('El socio no está habilitado para inscribirse');
    }
}

export class EnrollmentSportDeletedError extends ConflictError {
    readonly code = 'ENROLLMENT_SPORT_DELETED';
    constructor() {
        super('No se puede inscribir en un deporte dado de baja');
    }
}
