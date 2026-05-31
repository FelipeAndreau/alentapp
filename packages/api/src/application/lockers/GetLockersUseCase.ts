import { LockerRepository } from '../../domain/lockers/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

export class GetLockersUseCase {
    constructor(private readonly lockerRepository: LockerRepository) { }

    async execute(): Promise<LockerDTO[]> {
        return this.lockerRepository.findAll();
    }
}