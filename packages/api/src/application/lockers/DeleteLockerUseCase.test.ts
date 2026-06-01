import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteLockerUseCase } from './DeleteLockerUseCase.js';
import { LockerRepository } from '../../domain/lockers/LockerRepository.js';

describe('DeleteLockerUseCase', () => {
    let lockerRepo: LockerRepository;
    let useCase: DeleteLockerUseCase;

    const existingLocker = {
        id: 'uuid-1',
        number: 1,
        location: 'Vestuario Masculino',
        status: 'Available',
        member_id: null,
    };

    const occupiedLocker = {
        ...existingLocker,
        status: 'Occupied',
        member_id: 'member-123',
    };

    beforeEach(() => {
        lockerRepo = {
            create: vi.fn(),
            findById: vi.fn(),
            findByNumber: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as LockerRepository;

        useCase = new DeleteLockerUseCase(lockerRepo);
    });

    it('debe eliminar el casillero si existe y no tiene socio asignado', async () => {
        vi.mocked(lockerRepo.findById).mockResolvedValue(existingLocker as any);

        await useCase.execute('uuid-1');

        expect(lockerRepo.findById).toHaveBeenCalledWith('uuid-1');
        expect(lockerRepo.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('debe lanzar error si el casillero no existe', async () => {
        vi.mocked(lockerRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute('uuid-999')).rejects.toThrow('No existe un casillero con ese ID');
        expect(lockerRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el casillero tiene un socio asignado', async () => {
        vi.mocked(lockerRepo.findById).mockResolvedValue(occupiedLocker as any);

        await expect(useCase.execute('uuid-1')).rejects.toThrow('No se puede eliminar un casillero ocupado');
        expect(lockerRepo.delete).not.toHaveBeenCalled();
    });
});