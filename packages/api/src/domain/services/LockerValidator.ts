import { LockerRepository } from '../LockerRepository.js';
import { MemberRepository } from '../MemberRepository.js';

export class LockerValidator {
    constructor(
        private readonly lockerRepo: LockerRepository,
        private readonly memberRepo: MemberRepository,
    ) { }

    async validateNumberIsUnique(number: number, excludeLockerId?: string): Promise<void> {
        const lockerWithSameNumber = await this.lockerRepo.findByNumber(number);
        if (lockerWithSameNumber && lockerWithSameNumber.id !== excludeLockerId) {
            throw new Error('Ya existe un casillero con ese número');
        }
    }

    validateNumberIsPositive(number: number): void {
        if (number <= 0) {
            throw new Error('El número de casillero debe ser mayor a 0');
        }
    }

    validateLocationIsNotEmpty(location: string): void {
        if (!location || location.trim() === '') {
            throw new Error('El campo location no puede estar vacío');
        }
    }

    validateNotInMaintenance(status: string): void {
        if (status === 'Maintenance') {
            throw new Error('El casillero no está disponible para ser asignado');
        }
    }

    validateNotOccupied(member_id: string | null): void {
        if (member_id !== null) {
            throw new Error('No se puede eliminar un casillero ocupado');
        }
    }

    async validateMemberExists(member_id: string): Promise<void> {
        const member = await this.memberRepo.findById(member_id);
        if (!member) {
            throw new Error('No existe un socio con ese ID');
        }
    }

    validateStatusAndMemberIdConsistency(status?: string, member_id?: string | null): void {
        if (status === 'Occupied' && !member_id) {
            throw new Error('Para asignar estado Occupied se requiere un member_id válido');
        }
        if ((status === 'Available' || status === 'Maintenance') && member_id !== null && member_id !== undefined) {
            throw new Error('El member_id debe ser null para este estado');
        }
    }
}