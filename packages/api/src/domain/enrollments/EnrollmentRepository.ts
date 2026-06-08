import {
    EnrollmentDTO,
    CreateEnrollmentRequest,
    UpdateEnrollmentRequest,
} from '@alentapp/shared';

export interface EnrollmentRepository {
    create(data: CreateEnrollmentRequest): Promise<EnrollmentDTO>;
    findById(id: string): Promise<EnrollmentDTO | null>;
    findAll(): Promise<EnrollmentDTO[]>;
    findActiveByMemberAndSport(
        memberId: string,
        sportId: string,
    ): Promise<EnrollmentDTO | null>;
    countActiveBySportId(sportId: string): Promise<number>;
    update(id: string, data: UpdateEnrollmentRequest): Promise<EnrollmentDTO>;
    delete(id: string): Promise<EnrollmentDTO>; // softDelete: setea deleted_at e is_active=false
}
