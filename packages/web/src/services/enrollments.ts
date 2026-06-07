import type {
    EnrollmentDTO,
    CreateEnrollmentRequest,
    UpdateEnrollmentRequest,
} from '@alentapp/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const enrollmentsService = {
    async getAll(): Promise<EnrollmentDTO[]> {
        const res = await fetch(`${BASE_URL}/api/v1/enrollments`);
        if (!res.ok) throw new Error('Error al obtener inscripciones');
        const json = await res.json();
        return json.data;
    },

    async create(data: CreateEnrollmentRequest): Promise<EnrollmentDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/enrollments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error ?? 'Error al crear inscripción');
        }
        const json = await res.json();
        return json.data;
    },

    async update(
        id: string,
        data: UpdateEnrollmentRequest,
    ): Promise<EnrollmentDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/enrollments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error ?? 'Error al actualizar inscripción');
        }
        const json = await res.json();
        return json.data;
    },

    async delete(id: string): Promise<EnrollmentDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/enrollments/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error ?? 'Error al dar de baja inscripción');
        }
        const json = await res.json();
        return json.data;
    },
};
