import { ISportRepository } from '../../domain/sports/ISportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';
import { CreateSportRequest, SportDTO } from '@alentapp/shared';

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: ISportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(request: CreateSportRequest): Promise<SportDTO> {
        // Validaciones estáticas (sin DB)
        SportValidator.validateName(request.name);
        SportValidator.validateMaxCapacity(request.max_capacity);
        SportValidator.validateAdditionalPrice(request.additional_price);

        // Validación de unicidad (con DB)
        await this.sportValidator.validateUniqueName(request.name);

        // Persistir (inborrable como el 7a0)
        return this.sportRepository.create(request);
    }
}
