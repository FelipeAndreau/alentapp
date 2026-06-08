import { EnrollmentRepository } from '../EnrollmentRepository.js';
import { MemberRepository } from '../../members/MemberRepository.js';
import { SportRepository } from '../../sports/SportRepository.js';
import {
    EnrollmentDuplicateError,
    EnrollmentCapacityError,
    EnrollmentMemberInactiveError,
    EnrollmentSportDeletedError,
    EnrollmentValidationError,
} from '../errors/EnrollmentErrors.js';
import { CreateEnrollmentRequest } from '@alentapp/shared';

export class EnrollmentValidator {
    constructor(
        private enrollmentRepository: EnrollmentRepository,
        private memberRepository: MemberRepository,
        private sportRepository: SportRepository,
    ) {}

    async validateCreate(request: CreateEnrollmentRequest): Promise<void> {
        if (!request.member_id || request.member_id.trim() === '') {
            throw new EnrollmentValidationError(
                'El campo member_id es obligatorio',
            );
        }
        if (!request.sport_id || request.sport_id.trim() === '') {
            throw new EnrollmentValidationError(
                'El campo sport_id es obligatorio',
            );
        }

        // Busca socio y deporte en paralelo — son independientes entre sí
        const [member, sport] = await Promise.all([
            this.memberRepository.findById(request.member_id),
            this.sportRepository.findById(request.sport_id),
        ]);

        if (!member) {
            throw new EnrollmentValidationError('Socio no encontrado');
        }
        if (member.status !== 'Activo') {
            throw new EnrollmentMemberInactiveError();
        }

        if (!sport) {
            throw new EnrollmentValidationError('Deporte no encontrado');
        }
        if (sport.deleted_at !== null) {
            throw new EnrollmentSportDeletedError();
        }

        // Estas validaciones son secuenciales porque dependen de que sport exista
        const existing =
            await this.enrollmentRepository.findActiveByMemberAndSport(
                request.member_id,
                request.sport_id,
            );
        if (existing) {
            throw new EnrollmentDuplicateError();
        }

        const activeCount =
            await this.enrollmentRepository.countActiveBySportId(
                request.sport_id,
            );
        if (activeCount >= sport.max_capacity) {
            throw new EnrollmentCapacityError();
        }
    }
}
