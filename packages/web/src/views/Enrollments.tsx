import { useEffect, useState } from 'react';
import {
    Box,
    Heading,
    Spinner,
    Center,
    Text,
    Flex,
    HStack,
    Button,
    Stack,
    Table,
    Badge,
} from '@chakra-ui/react';
import {
    LuPlus,
    LuRefreshCw,
    LuTrash2,
    LuPowerOff,
    LuPower,
} from 'react-icons/lu';

// Importa los tipos del shared — los mismos que usa el backend
import type {
    EnrollmentDTO,
    CreateEnrollmentRequest,
    MemberDTO,
    SportDTO,
} from '@alentapp/shared';

// Importa los servicios de las 3 entidades que necesita
import { enrollmentsService } from '../services/enrollments';
import { membersService } from '../services/members';
import { sportsService } from '../services/sports';

// Importa los componentes de Chakra UI para el modal
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import { toaster } from '../components/ui/toaster';

export function EnrollmentsView() {
    // Lista de inscripciones activas traídas de la API
    const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);

    // Listas de socios y deportes para mostrar nombres en lugar de IDs
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [sports, setSports] = useState<SportDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Controla si el modal de creación está abierto
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado del formulario de creación — solo member_id y sport_id
    const [createForm, setCreateForm] = useState<CreateEnrollmentRequest>({
        member_id: '',
        sport_id: '',
    });

    // Trae inscripciones, socios y deportes en paralelo
    // Promise.all ejecuta los 3 fetches al mismo tiempo para no esperar uno por uno
    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [enrollmentsData, membersData, sportsData] =
                await Promise.all([
                    enrollmentsService.getAll(),
                    membersService.getAll(),
                    sportsService.getAll(),
                ]);
            setEnrollments(enrollmentsData);
            setMembers(membersData);
            setSports(sportsData);
        } catch (err: any) {
            setError(err.message || 'Error al cargar las inscripciones');
        } finally {
            setLoading(false);
        }
    };

    // Se ejecuta una sola vez cuando el componente carga
    useEffect(() => {
        fetchAll();
    }, []);

    // Helpers para buscar el nombre del socio y el deporte por ID
    // En lugar de mostrar "abc-123" muestra "Juan Pérez (DNI: 12345678)"
    const getMemberLabel = (memberId: string) => {
        const member = members.find((m) => m.id === memberId);
        return member ? `${member.name} (DNI: ${member.dni})` : memberId;
    };

    const getSportName = (sportId: string) => {
        const sport = sports.find((s) => s.id === sportId);
        return sport ? sport.name : sportId;
    };

    const openCreateModal = () => {
        setCreateForm({ member_id: '', sport_id: '' });
        setIsCreateOpen(true);
    };

    // Crea una nueva inscripción
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!createForm.member_id || !createForm.sport_id) {
            toaster.create({
                title: 'Completá todos los campos requeridos',
                type: 'warning',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await enrollmentsService.create(createForm);
            toaster.create({
                title: 'Inscripción creada con éxito',
                type: 'success',
            });
            setIsCreateOpen(false);
            fetchAll();
        } catch (err: any) {
            toaster.create({
                title: 'Error al crear la inscripción',
                description: err.message,
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Activa o desactiva la inscripción (toggle de is_active)
    const handleToggleActive = async (enrollment: EnrollmentDTO) => {
        const action = enrollment.is_active ? 'desactivar' : 'activar';
        const confirmed = window.confirm(
            `¿Estás seguro que querés ${action} esta inscripción?`,
        );
        if (!confirmed) return;
        try {
            await enrollmentsService.update(enrollment.id, {
                is_active: !enrollment.is_active,
            });
            toaster.create({
                title: `Inscripción ${enrollment.is_active ? 'desactivada' : 'activada'} con éxito`,
                type: 'success',
            });
            fetchAll();
        } catch (err: any) {
            toaster.create({
                title: 'Error al actualizar la inscripción',
                description: err.message,
                type: 'error',
            });
        }
    };

    // Soft delete — da de baja la inscripción definitivamente
    const handleDelete = async (enrollment: EnrollmentDTO) => {
        const memberLabel = getMemberLabel(enrollment.member_id);
        const sportName = getSportName(enrollment.sport_id);
        const confirmed = window.confirm(
            `¿Estás seguro que querés dar de baja la inscripción de "${memberLabel}" en "${sportName}"? Esta acción no se puede deshacer.`,
        );
        if (!confirmed) return;
        try {
            await enrollmentsService.delete(enrollment.id);
            toaster.create({
                title: 'Inscripción dada de baja con éxito',
                type: 'success',
            });
            fetchAll();
        } catch (err: any) {
            toaster.create({
                title: 'Error al dar de baja la inscripción',
                description: err.message,
                type: 'error',
            });
        }
    };

    return (
        <>
            {/* Modal de creación */}
            <DialogRoot
                open={isCreateOpen}
                onOpenChange={(e) => setIsCreateOpen(e.open)}
            >
                <DialogContent>
                    <form onSubmit={handleCreate}>
                        <DialogHeader>
                            <DialogTitle>Nueva Inscripción</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                {/* Select de socios — muestra nombre + DNI */}
                                <Field label="Socio" required>
                                    <select
                                        value={createForm.member_id}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                member_id: e.target.value,
                                            })
                                        }
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0',
                                        }}
                                    >
                                        <option value="">
                                            Seleccioná un socio
                                        </option>
                                        {/* Solo muestra socios con status Activo */}
                                        {members
                                            .filter(
                                                (m) => m.status === 'Activo',
                                            )
                                            .map((member) => (
                                                <option
                                                    key={member.id}
                                                    value={member.id}
                                                >
                                                    {member.name} — DNI:{' '}
                                                    {member.dni}
                                                </option>
                                            ))}
                                    </select>
                                </Field>

                                {/* Select de deportes — muestra nombre */}
                                <Field label="Deporte" required>
                                    <select
                                        value={createForm.sport_id}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                sport_id: e.target.value,
                                            })
                                        }
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0',
                                        }}
                                    >
                                        <option value="">
                                            Seleccioná un deporte
                                        </option>
                                        {/* Solo muestra deportes activos (deleted_at = null) */}
                                        {sports
                                            .filter(
                                                (s) => s.deleted_at === null,
                                            )
                                            .map((sport) => (
                                                <option
                                                    key={sport.id}
                                                    value={sport.id}
                                                >
                                                    {sport.name}
                                                </option>
                                            ))}
                                    </select>
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button
                                type="submit"
                                colorPalette="blue"
                                loading={isSubmitting}
                            >
                                Crear Inscripción
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            {/* Vista principal */}
            <Stack gap="8" maxW="6xl" mx="auto">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">
                            Gestión de Inscripciones
                        </Heading>
                        <Text color="fg.muted" fontSize="md">
                            Administrá las inscripciones de socios a deportes
                            del club.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button
                            variant="outline"
                            onClick={fetchAll}
                            disabled={loading}
                        >
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button colorPalette="blue" onClick={openCreateModal}>
                            <LuPlus /> Nueva Inscripción
                        </Button>
                    </HStack>
                </Flex>

                {error && (
                    <Box
                        p="4"
                        bg="red.50"
                        color="red.700"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="red.200"
                    >
                        <Text fontWeight="bold">Error:</Text>
                        <Text>{error}</Text>
                    </Box>
                )}

                <Box
                    bg="bg.panel"
                    borderRadius="xl"
                    boxShadow="sm"
                    borderWidth="1px"
                    overflow="hidden"
                    minH="300px"
                >
                    {loading ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Spinner size="xl" color="blue.500" />
                                <Text color="fg.muted">
                                    Cargando inscripciones...
                                </Text>
                            </Stack>
                        </Center>
                    ) : enrollments.length === 0 ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Text color="fg.muted">
                                    No hay inscripciones registradas.
                                </Text>
                                <Button
                                    variant="ghost"
                                    onClick={openCreateModal}
                                >
                                    Crear primera inscripción
                                </Button>
                            </Stack>
                        </Center>
                    ) : (
                        <Table.Root size="sm">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>
                                        Socio
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Deporte
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Fecha de Inscripción
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Estado
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Acciones
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {enrollments.map((enrollment) => (
                                    <Table.Row key={enrollment.id}>
                                        {/* Muestra nombre + DNI del socio en lugar del UUID */}
                                        <Table.Cell fontWeight="medium">
                                            {getMemberLabel(
                                                enrollment.member_id,
                                            )}
                                        </Table.Cell>
                                        {/* Muestra nombre del deporte en lugar del UUID */}
                                        <Table.Cell>
                                            {getSportName(enrollment.sport_id)}
                                        </Table.Cell>
                                        {/* Convierte ISO string a fecha legible */}
                                        <Table.Cell color="fg.muted">
                                            {new Date(
                                                enrollment.enrollment_date,
                                            ).toLocaleDateString('es-AR')}
                                        </Table.Cell>
                                        {/* Badge visual según estado */}
                                        <Table.Cell>
                                            <Badge
                                                colorPalette={
                                                    enrollment.is_active
                                                        ? 'green'
                                                        : 'gray'
                                                }
                                            >
                                                {enrollment.is_active
                                                    ? 'Activa'
                                                    : 'Inactiva'}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <HStack gap="2">
                                                {/* Botón toggle activa/desactiva */}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorPalette={
                                                        enrollment.is_active
                                                            ? 'orange'
                                                            : 'green'
                                                    }
                                                    onClick={() =>
                                                        handleToggleActive(
                                                            enrollment,
                                                        )
                                                    }
                                                >
                                                    {enrollment.is_active ? (
                                                        <LuPowerOff />
                                                    ) : (
                                                        <LuPower />
                                                    )}
                                                </Button>
                                                {/* Botón de baja lógica */}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorPalette="red"
                                                    onClick={() =>
                                                        handleDelete(enrollment)
                                                    }
                                                >
                                                    <LuTrash2 />
                                                </Button>
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )}
                </Box>
            </Stack>
        </>
    );
}
