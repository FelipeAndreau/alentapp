import { ISportRepository } from '../sports/ISportRepository.js';

export class SportValidator {
    constructor(private readonly sportRepository: ISportRepository) {}

    // --- Validaciones de instancia (necesitan el repositorio) ---

    async validateUniqueName(name: string): Promise<void> {
        const existingSport = await this.sportRepository.findByName(name);
        if (existingSport) {
            throw new Error(`El deporte con nombre '${name}' ya existe.`);
        }
    }

    // --- Validaciones estáticas (no necesitan el repositorio) ---

    static validateName(name: string): void {
        if (!name || name.trim() === '') {
            throw new Error('El nombre del deporte es obligatorio');
        }
    }

    static validateMaxCapacity(max_capacity: number): void {
        if (max_capacity <= 0) {
            throw new Error('La capacidad máxima debe ser mayor a cero');
        }
    }

    static validateAdditionalPrice(additional_price: number): void {
        if (additional_price < 0) {
            throw new Error('El precio adicional no puede ser negativo');
        }
    }
}
