import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

export const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
    log: ['query', 'info', 'warn', 'error'],
});
