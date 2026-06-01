import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js';
import { LockerRepository } from '../../domain/lockers/LockerRepository.js';
import { LockerValidator } from '../../domain/lockers/services/LockerValidator.js';

describe('UpdateLockerUseCase', () => {
    let lockerRepo: LockerRepository;
    let lockerValidator: LockerValidator;
    let useCase: UpdateLockerUseCase;

    const activeLocker = {
        id: 'uuid-1',
        number: 1,
        location: 'Vestuario Masculino',
        status: 'Available',
        member_id: null,
    };

    const occupiedLocker = {
        ...activeLocker,
        status: 'Occupied',
        member_id: 'member-123',
    };

    const maintenanceLocker = {
        ...activeLocker,
        status: 'Maintenance',
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

        lockerValidator = {
            validateStatusAndMemberIdConsistency: vi.fn(),
            validateNotInMaintenance: vi.fn(),
            validateMemberExists: vi.fn(),
        } as unknown as LockerValidator;

        useCase = new UpdateLockerUseCase(lockerRepo, lockerValidator);
    });

    it('debe lanzar error si el casillero no existe', async () => {
        vi.mocked(lockerRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute('uuid-999', { location: 'Nuevo' }))
            .rejects.toThrow('No existe un casillero con ese ID');
        expect(lockerRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si se intenta asignar socio a casillero en Maintenance', async () => {
        vi.mocked(lockerRepo.findById).mockResolvedValue(maintenanceLocker as any);
        vi.mocked(lockerValidator.validateNotInMaintenance).mockImplementationOnce(() => {
            throw new Error('El casillero no está disponible para ser asignado');
        });

        await expect(useCase.execute('uuid-1', { member_id: 'member-123' }))
            .rejects.toThrow('El casillero no está disponible para ser asignado');
    });

    it('debe liberar al socio automáticamente si el casillero pasa a Maintenance', async () => {
        vi.mocked(lockerRepo.findById).mockResolvedValue(occupiedLocker as any);
        vi.mocked(lockerRepo.update).mockResolvedValue(
            { ...occupiedLocker, status: 'Maintenance', member_id: null } as any
        );

        const result = await useCase.execute('uuid-1', { status: 'Maintenance' });

        expect(lockerRepo.update).toHaveBeenCalledWith('uuid-1', expect.objectContaining({ member_id: null }));
        expect(result.member_id).toBeNull();
    });

    it('debe actualizar correctamente la ubicación', async () => {
        vi.mocked(lockerRepo.findById).mockResolvedValue(activeLocker as any);
        vi.mocked(lockerRepo.update).mockResolvedValue(
            { ...activeLocker, location: 'Vestuario Femenino' } as any
        );

        const result = await useCase.execute('uuid-1', { location: 'Vestuario Femenino' });

        expect(result.location).toBe('Vestuario Femenino');
    });
});