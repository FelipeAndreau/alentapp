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
import type {
    EnrollmentDTO,
    CreateEnrollmentRequest,
    MemberDTO,
    SportDTO,
} from '@alentapp/shared';
import { enrollmentsService } from '../services/enrollments';
import { membersService } from '../services/members';
import { sportsService } from '../services/sports';
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
    const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [sports, setSports] = useState<SportDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para el modal de creación
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createForm, setCreateForm] = useState<CreateEnrollmentRequest>({
        member_id: '',
        sport_id: '',
    });

    // Estados para el dialog de toggle activa/inactiva
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [togglingEnrollment, setTogglingEnrollment] =
        useState<EnrollmentDTO | null>(null);
    const [isToggling, setIsToggling] = useState(false);

    // Estados para el dialog de baja lógica
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingEnrollment, setDeletingEnrollment] =
        useState<EnrollmentDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    useEffect(() => {
        fetchAll();
    }, []);

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

    const openToggleModal = (enrollment: EnrollmentDTO) => {
        setTogglingEnrollment(enrollment);
        setIsToggleOpen(true);
    };

    const openDeleteModal = (enrollment: EnrollmentDTO) => {
        setDeletingEnrollment(enrollment);
        setIsDeleteOpen(true);
    };

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

    const handleToggleActive = async () => {
        if (!togglingEnrollment) return;
        setIsToggling(true);
        try {
            await enrollmentsService.update(togglingEnrollment.id, {
                is_active: !togglingEnrollment.is_active,
            });
            toaster.create({
                title: `Inscripción ${togglingEnrollment.is_active ? 'desactivada' : 'activada'} con éxito`,
                type: 'success',
            });
            setIsToggleOpen(false);
            fetchAll();
        } catch (err: any) {
            toaster.create({
                title: 'Error al actualizar la inscripción',
                description: err.message,
                type: 'error',
            });
        } finally {
            setIsToggling(false);
            setTogglingEnrollment(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingEnrollment) return;
        setIsDeleting(true);
        try {
            await enrollmentsService.delete(deletingEnrollment.id);
            toaster.create({
                title: 'Inscripción dada de baja con éxito',
                type: 'success',
            });
            setIsDeleteOpen(false);
            fetchAll();
        } catch (err: any) {
            toaster.create({
                title: 'Error al dar de baja la inscripción',
                description: err.message,
                type: 'error',
            });
        } finally {
            setIsDeleting(false);
            setDeletingEnrollment(null);
        }
    };

    return (
        <>
            {/* Dialog de confirmación de toggle activa/inactiva */}
            <DialogRoot
                open={isToggleOpen}
                onOpenChange={(e) => setIsToggleOpen(e.open)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {togglingEnrollment?.is_active
                                ? 'Desactivar inscripción'
                                : 'Activar inscripción'}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Text>
                            ¿Estás seguro que querés{' '}
                            {togglingEnrollment?.is_active
                                ? 'desactivar'
                                : 'activar'}{' '}
                            la inscripción de{' '}
                            <strong>
                                {togglingEnrollment
                                    ? getMemberLabel(
                                          togglingEnrollment.member_id,
                                      )
                                    : ''}
                            </strong>{' '}
                            en{' '}
                            <strong>
                                {togglingEnrollment
                                    ? getSportName(togglingEnrollment.sport_id)
                                    : ''}
                            </strong>
                            ?
                        </Text>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogActionTrigger>
                        <Button
                            colorPalette={
                                togglingEnrollment?.is_active
                                    ? 'orange'
                                    : 'green'
                            }
                            loading={isToggling}
                            onClick={handleToggleActive}
                        >
                            {togglingEnrollment?.is_active
                                ? 'Desactivar'
                                : 'Activar'}
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>

            {/* Dialog de confirmación de baja lógica */}
            <DialogRoot
                open={isDeleteOpen}
                onOpenChange={(e) => setIsDeleteOpen(e.open)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dar de baja inscripción</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Text>
                            ¿Estás seguro que querés dar de baja la inscripción
                            de{' '}
                            <strong>
                                {deletingEnrollment
                                    ? getMemberLabel(
                                          deletingEnrollment.member_id,
                                      )
                                    : ''}
                            </strong>{' '}
                            en{' '}
                            <strong>
                                {deletingEnrollment
                                    ? getSportName(deletingEnrollment.sport_id)
                                    : ''}
                            </strong>
                            ? Esta acción no se puede deshacer.
                        </Text>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogActionTrigger>
                        <Button
                            colorPalette="red"
                            loading={isDeleting}
                            onClick={handleDelete}
                        >
                            Dar de baja
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>

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
                                        <Table.Cell fontWeight="medium">
                                            {getMemberLabel(
                                                enrollment.member_id,
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {getSportName(enrollment.sport_id)}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted">
                                            {new Date(
                                                enrollment.enrollment_date,
                                            ).toLocaleDateString('es-AR')}
                                        </Table.Cell>
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
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorPalette={
                                                        enrollment.is_active
                                                            ? 'orange'
                                                            : 'green'
                                                    }
                                                    onClick={() =>
                                                        openToggleModal(
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
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorPalette="red"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            enrollment,
                                                        )
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
