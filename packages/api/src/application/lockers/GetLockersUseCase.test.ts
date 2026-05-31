import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetLockersUseCase } from './GetLockersUseCase.js';
import { LockerRepository } from '../../domain/lockers/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

describe('GetLockersUseCase', () => {
    let lockerRepo: LockerRepository;
    let useCase: GetLockersUseCase;

    beforeEach(() => {
        lockerRepo = {
            create: vi.fn(),
            findById: vi.fn(),
            findByNumber: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as LockerRepository;

        useCase = new GetLockersUseCase(lockerRepo);
    });

    it('debe retornar la lista de casilleros obtenida del repositorio', async () => {
        const lockers: LockerDTO[] = [
            { id: 'uuid-1', number: 1, location: 'Vestuario Masculino', status: 'Available', member_id: null },
            { id: 'uuid-2', number: 2, location: 'Vestuario Femenino', status: 'Occupied', member_id: 'member-1' },
        ];
        vi.mocked(lockerRepo.findAll).mockResolvedValue(lockers);

        const result = await useCase.execute();

        expect(lockerRepo.findAll).toHaveBeenCalledOnce();
        expect(result).toHaveLength(2);
        expect(result[0].number).toBe(1);
    });

    it('debe retornar un array vacío cuando no hay casilleros', async () => {
        vi.mocked(lockerRepo.findAll).mockResolvedValue([]);

        const result = await useCase.execute();

        expect(lockerRepo.findAll).toHaveBeenCalledOnce();
        expect(result).toEqual([]);
    });
});