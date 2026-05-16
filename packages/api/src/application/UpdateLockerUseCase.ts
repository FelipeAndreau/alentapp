import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator,
    ) { }

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        const locker = await this.lockerRepository.findById(id);
        if (!locker) {
            throw new Error('No existe un casillero con ese ID');
        }

        this.lockerValidator.validateStatusAndMemberIdConsistency(data.status, data.member_id);

        if (data.member_id && locker.status === 'Maintenance') {
            this.lockerValidator.validateNotInMaintenance(locker.status);
        }

        if (data.member_id) {
            await this.lockerValidator.validateMemberExists(data.member_id);
        }

        if (data.status === 'Maintenance' && locker.member_id !== null) {
            data = { ...data, member_id: null };
        }

        return this.lockerRepository.update(id, data);
    }
}