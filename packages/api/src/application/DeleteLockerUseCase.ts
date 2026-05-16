import { LockerRepository } from '../domain/LockerRepository.js';

export class DeleteLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) { }

    async execute(id: string): Promise<void> {
        const locker = await this.lockerRepository.findById(id);
        if (!locker) {
            throw new Error('No existe un casillero con ese ID');
        }

        if (locker.member_id !== null) {
            throw new Error('No se puede eliminar un casillero ocupado');
        }

        await this.lockerRepository.delete(id);
    }
}