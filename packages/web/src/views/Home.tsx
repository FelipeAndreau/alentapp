import { Box, SimpleGrid, Heading, Text, VStack } from '@chakra-ui/react';
import {
    LuUsers,
    LuGavel,
    LuLock,
    LuCreditCard,
    LuTrophy,
    LuClipboardList,
} from 'react-icons/lu';
import { SectionCard } from '../components/SectionCard';

export function HomeView() {
    return (
        <Box>
            <VStack gap="6" align="flex-start" mb="12">
                <Heading
                    size="4xl"
                    fontWeight="extrabold"
                    letterSpacing="tight"
                    bgGradient="to-r"
                    gradientFrom="blue.600"
                    gradientTo="cyan.400"
                    bgClip="text"
                >
                    Bienvenido a Alentapp
                </Heading>
                <Text fontSize="xl" color="fg.muted" maxW="2xl">
                    El panel de administración central para gestionar todos los
                    aspectos de tu club. Selecciona una sección a continuación
                    para comenzar.
                </Text>
            </VStack>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="8">
                <SectionCard
                    title="Miembros"
                    description="Administra el padrón de socios, sus categorías, estados de cuenta y datos personales."
                    to="/members"
                    icon={LuUsers}
                />

                <SectionCard
                    title="Pagos"
                    description="Gestiona el cobro de cuotas, registra pagos y anula comprobantes."
                    to="/payments"
                    icon={LuCreditCard}
                />

                <SectionCard
                    title="Disciplinas"
                    description="Registra y consulta las sanciones aplicadas a los socios del club."
                    to="/disciplines"
                    icon={LuGavel}
                />

                <SectionCard
                    title="Casilleros"
                    description="Gestiona los casilleros del vestuario, asignalos a socios y controlá su estado."
                    to="/lockers"
                    icon={LuLock}
                />

                <SectionCard
                    title="Deportes"
                    description="Administrá el catálogo de deportes ofrecidos por el club, sus cupos y requisitos."
                    to="/sports"
                    icon={LuTrophy}
                />

                <SectionCard
                    title="Inscripciones"
                    description="Gestioná las inscripciones de socios a deportes, controlá cupos y estados de vigencia."
                    to="/enrollments"
                    icon={LuClipboardList}
                />
            </SimpleGrid>
        </Box>
    );
}
