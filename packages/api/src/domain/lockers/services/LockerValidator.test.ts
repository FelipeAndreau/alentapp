import { describe, it, expect, vi } from 'vitest';
import { LockerValidator } from './LockerValidator.js';
import { LockerRepository } from '../LockerRepository.js';
import { MemberRepository } from '../../members/MemberRepository.js';

describe('LockerValidator', () => {
    const lockerRepo = {
        findByNumber: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        findAll: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    } as unknown as LockerRepository;

    const memberRepo = {
        findById: vi.fn(),
        findAll: vi.fn(),
        findByDni: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    } as unknown as MemberRepository;

    const validator = new LockerValidator(lockerRepo, memberRepo);

    describe('validateNumberIsUnique', () => {
        it('debe lanzar error si ya existe un casillero con ese número', async () => {
            vi.mocked(lockerRepo.findByNumber).mockResolvedValue({
                id: 'uuid-1', number: 1, location: 'Vestuario', status: 'Available', member_id: null
            } as any);

            await expect(validator.validateNumberIsUnique(1)).rejects.toThrow('Ya existe un casillero con ese número');
        });
    });

    describe('validateNumberIsPositive', () => {
        it('debe lanzar error si el número es 0', () => {
            expect(() => validator.validateNumberIsPositive(0)).toThrow('El número de casillero debe ser mayor a 0');
        });

        it('debe lanzar error si el número es negativo', () => {
            expect(() => validator.validateNumberIsPositive(-1)).toThrow('El número de casillero debe ser mayor a 0');
        });
    });

    describe('validateLocationIsNotEmpty', () => {
        it('debe lanzar error si la ubicación está vacía', () => {
            expect(() => validator.validateLocationIsNotEmpty('')).toThrow('El campo location no puede estar vacío');
        });

        it('debe lanzar error si la ubicación contiene solo espacios', () => {
            expect(() => validator.validateLocationIsNotEmpty('   ')).toThrow('El campo location no puede estar vacío');
        });
    });

    describe('validateNotInMaintenance', () => {
        it('debe lanzar error si el status es Maintenance', () => {
            expect(() => validator.validateNotInMaintenance('Maintenance')).toThrow('El casillero no está disponible para ser asignado');
        });
    });

    describe('validateMemberExists', () => {
        it('debe lanzar error si el socio no existe', async () => {
            vi.mocked(memberRepo.findById).mockResolvedValue(null);

            await expect(validator.validateMemberExists('non-existent')).rejects.toThrow('No existe un socio con ese ID');
        });
    });
});