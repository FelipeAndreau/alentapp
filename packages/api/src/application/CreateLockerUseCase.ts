import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, CreateLockerRequest } from '@alentapp/shared';

export class CreateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator,
    ) { }

    async execute(data: CreateLockerRequest): Promise<LockerDTO> {
        this.lockerValidator.validateNumberIsPositive(data.number);
        this.lockerValidator.validateLocationIsNotEmpty(data.location);
        await this.lockerValidator.validateNumberIsUnique(data.number);

        const locker = await this.lockerRepository.create({
            ...data,
            status: data.status ?? 'Available',
        });

        return locker;
    }
}