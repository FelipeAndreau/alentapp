import {
    NotFoundError,
    ConflictError,
    ValidationError,
} from './PaymentErrors.js';

export class SportNotFoundError extends NotFoundError {
    readonly code = 'SPORT_NOT_FOUND';
    constructor() {
        super('El deporte no existe');
    }
}

export class SportAlreadyDeletedError extends ConflictError {
    readonly code = 'SPORT_ALREADY_DELETED';
    constructor() {
        super('El deporte ya fue dado de baja');
    }
}

export class SportValidationError extends ValidationError {
    readonly code = 'SPORT_VALIDATION_ERROR';
    constructor(message: string) {
        super(message);
    }
}

export class SportNameConflictError extends ConflictError {
    readonly code = 'SPORT_NAME_CONFLICT';
    constructor(name: string) {
        super(`El deporte con nombre '${name}' ya existe.`);
    }
}
