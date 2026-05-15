// ==========================================
// Member (Socios)
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
    id: string; // UUID
    dni: string;
    name: string;
    email: string;
    birthdate: string; // ISO Date String (YYYY-MM-DD)
    category: MemberCategory;
    status: MemberStatus;
    created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
    dni: string;
    name: string;
    email: string;
    birthdate: string; // ISO Date String (YYYY-MM-DD)
    category: MemberCategory;
}

export interface UpdateMemberRequest {
    dni?: string;
    name?: string;
    email?: string;
    birthdate?: string; // ISO Date String (YYYY-MM-DD)
    category?: MemberCategory;
    status?: MemberStatus;
}

// ==========================================
// Payment (Pagos)
// ==========================================
export type PaymentStatus = 'Pending' | 'Paid' | 'Canceled';

export interface PaymentDTO {
    id: string; // UUID
    amount: string;
    month: number;
    year: number;
    status: PaymentStatus;
    due_date: string; // ISO Date String (YYYY-MM-DD)
    payment_date: string | null; // ISO DateTime String
    member_id: string; // UUID
    created_at: string; // ISO DateTime String
    updated_at: string; // ISO DateTime String
}

export interface CreatePaymentRequest {
    amount: string;
    month: number;
    year: number;
    due_date: string; // ISO Date String (YYYY-MM-DD)
    member_id: string; // UUID
}

export interface PaymentResponse {
    data: PaymentDTO;
}

export interface PaymentsResponse {
    data: PaymentDTO[];
}

// ==========================================
// Locker (Casilleros)
// ==========================================
export type LockerStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface LockerDTO {
    id: string;
    number: number;
    location: string;
    status: LockerStatus;
    member_id: string | null;
}

export interface CreateLockerRequest {
    number: number;
    location: string;
    status?: LockerStatus;
}

export interface UpdateLockerRequest {
    location?: string;
    status?: LockerStatus;
    member_id?: string | null;
}

// ==========================================
// Discipline (Disciplinas / Sanciones)
// ==========================================
export interface DisciplineDTO {
    id: string;
    reason: string;
    start_date: string;
    end_date: string;
    is_total_suspension: boolean;
    member_id: string;
}

export interface CreateDisciplineRequest {
    reason: string;
    start_date: string;
    end_date: string;
    is_total_suspension: boolean;
    member_id: string;
}

export interface UpdateDisciplineRequest {
    reason?: string;
    start_date?: string;
    end_date?: string;
    is_total_suspension?: boolean;
}
