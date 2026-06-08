import { describe, it, expect, vi } from 'vitest';
import { EnrollmentValidator } from './EnrollmentValidator.js';
import { EnrollmentRepository } from '../EnrollmentRepository.js';
import { MemberRepository } from '../../members/MemberRepository.js';
import { SportRepository } from '../../sports/SportRepository.js';
import {
    EnrollmentDuplicateError,
    EnrollmentCapacityError,
    EnrollmentMemberInactiveError,
    EnrollmentSportDeletedError,
} from '../errors/EnrollmentErrors.js';

describe('EnrollmentValidator', () => {
    const makeMocks = () => {
        const enrollmentRepo = {
            findActiveByMemberAndSport: vi.fn(),
            countActiveBySportId: vi.fn(),
        } as unknown as EnrollmentRepository;

        const memberRepo = {
            findById: vi.fn(),
        } as unknown as MemberRepository;

        const sportRepo = {
            findById: vi.fn(),
        } as unknown as SportRepository;

        return { enrollmentRepo, memberRepo, sportRepo };
    };

    it('debe lanzar EnrollmentMemberInactiveError si el socio no esta activo', async () => {
        const { enrollmentRepo, memberRepo, sportRepo } = makeMocks();

        vi.mocked(memberRepo.findById).mockResolvedValue({
            id: 'member-1',
            status: 'Moroso',
        } as any);
        vi.mocked(sportRepo.findById).mockResolvedValue({
            id: 'sport-1',
            deleted_at: null,
            max_capacity: 10,
        } as any);

        const validator = new EnrollmentValidator(
            enrollmentRepo,
            memberRepo,
            sportRepo,
        );

        await expect(
            validator.validateCreate({
                member_id: 'member-1',
                sport_id: 'sport-1',
            }),
        ).rejects.toThrow(EnrollmentMemberInactiveError);
    });

    it('debe lanzar EnrollmentSportDeletedError si el deporte esta dado de baja', async () => {
        const { enrollmentRepo, memberRepo, sportRepo } = makeMocks();

        vi.mocked(memberRepo.findById).mockResolvedValue({
            id: 'member-1',
            status: 'Activo',
        } as any);
        vi.mocked(sportRepo.findById).mockResolvedValue({
            id: 'sport-1',
            deleted_at: '2026-05-01T00:00:00.000Z',
            max_capacity: 10,
        } as any);

        const validator = new EnrollmentValidator(
            enrollmentRepo,
            memberRepo,
            sportRepo,
        );

        await expect(
            validator.validateCreate({
                member_id: 'member-1',
                sport_id: 'sport-1',
            }),
        ).rejects.toThrow(EnrollmentSportDeletedError);
    });

    it('debe lanzar EnrollmentDuplicateError si ya existe una inscripcion activa', async () => {
        const { enrollmentRepo, memberRepo, sportRepo } = makeMocks();

        vi.mocked(memberRepo.findById).mockResolvedValue({
            id: 'member-1',
            status: 'Activo',
        } as any);
        vi.mocked(sportRepo.findById).mockResolvedValue({
            id: 'sport-1',
            deleted_at: null,
            max_capacity: 10,
        } as any);
        vi.mocked(enrollmentRepo.findActiveByMemberAndSport).mockResolvedValue({
            id: 'enrollment-existing',
        } as any);

        const validator = new EnrollmentValidator(
            enrollmentRepo,
            memberRepo,
            sportRepo,
        );

        await expect(
            validator.validateCreate({
                member_id: 'member-1',
                sport_id: 'sport-1',
            }),
        ).rejects.toThrow(EnrollmentDuplicateError);
    });

    it('debe lanzar EnrollmentCapacityError si el deporte no tiene cupo', async () => {
        const { enrollmentRepo, memberRepo, sportRepo } = makeMocks();

        vi.mocked(memberRepo.findById).mockResolvedValue({
            id: 'member-1',
            status: 'Activo',
        } as any);
        vi.mocked(sportRepo.findById).mockResolvedValue({
            id: 'sport-1',
            deleted_at: null,
            max_capacity: 2,
        } as any);
        vi.mocked(enrollmentRepo.findActiveByMemberAndSport).mockResolvedValue(
            null,
        );
        vi.mocked(enrollmentRepo.countActiveBySportId).mockResolvedValue(2);

        const validator = new EnrollmentValidator(
            enrollmentRepo,
            memberRepo,
            sportRepo,
        );

        await expect(
            validator.validateCreate({
                member_id: 'member-1',
                sport_id: 'sport-1',
            }),
        ).rejects.toThrow(EnrollmentCapacityError);
    });
});
