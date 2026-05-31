import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLockerUseCase } from './CreateLockerUseCase.js';
import { LockerRepository } from '../../domain/lockers/LockerRepository.js';
import { LockerValidator } from '../../domain/lockers/services/LockerValidator.js';

describe('CreateLockerUseCase', () => {
    let lockerRepo: LockerRepository;
    let lockerValidator: LockerValidator;
    let useCase: CreateLockerUseCase;

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
            validateNumberIsPositive: vi.fn(),
            validateLocationIsNotEmpty: vi.fn(),
            validateNumberIsUnique: vi.fn(),
            validateNotInMaintenance: vi.fn(),
            validateNotOccupied: vi.fn(),
            validateMemberExists: vi.fn(),
            validateStatusAndMemberIdConsistency: vi.fn(),
        } as unknown as LockerValidator;

        useCase = new CreateLockerUseCase(lockerRepo, lockerValidator);
    });

    it('debe crear un casillero exitosamente con status Available por defecto', async () => {
        const mockLocker = { id: 'uuid-1', number: 1, location: 'Vestuario Masculino', status: 'Available', member_id: null };
        vi.mocked(lockerRepo.create).mockResolvedValue(mockLocker as any);

        const result = await useCase.execute({ number: 1, location: 'Vestuario Masculino' });

        expect(lockerValidator.validateNumberIsPositive).toHaveBeenCalledWith(1);
        expect(lockerValidator.validateLocationIsNotEmpty).toHaveBeenCalledWith('Vestuario Masculino');
        expect(lockerValidator.validateNumberIsUnique).toHaveBeenCalledWith(1);
        expect(lockerRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'Available' }));
        expect(result.id).toBe('uuid-1');
    });

    it('debe lanzar error si el número es menor o igual a 0', async () => {
        vi.mocked(lockerValidator.validateNumberIsPositive).mockImplementationOnce(() => {
            throw new Error('El número de casillero debe ser mayor a 0');
        });

        await expect(useCase.execute({ number: 0, location: 'Vestuario' }))
            .rejects.toThrow('El número de casillero debe ser mayor a 0');
        expect(lockerRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la ubicación está vacía', async () => {
        vi.mocked(lockerValidator.validateLocationIsNotEmpty).mockImplementationOnce(() => {
            throw new Error('El campo location no puede estar vacío');
        });

        await expect(useCase.execute({ number: 1, location: '' }))
            .rejects.toThrow('El campo location no puede estar vacío');
        expect(lockerRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el número de casillero ya existe', async () => {
        vi.mocked(lockerValidator.validateNumberIsUnique).mockRejectedValueOnce(
            new Error('Ya existe un casillero con ese número')
        );

        await expect(useCase.execute({ number: 1, location: 'Vestuario' }))
            .rejects.toThrow('Ya existe un casillero con ese número');
        expect(lockerRepo.create).not.toHaveBeenCalled();
    });
});