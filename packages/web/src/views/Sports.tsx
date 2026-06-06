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
    Input,
    Table,
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw, LuPencil, LuTrash2 } from 'react-icons/lu';
import type {
    SportDTO,
    CreateSportRequest,
    UpdateSportRequest,
} from '@alentapp/shared';
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

export function SportsView() {
    const [sports, setSports] = useState<SportDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSport, setSelectedSport] = useState<SportDTO | null>(null);

    // Estados para el dialog de confirmación de baja
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingSport, setDeletingSport] = useState<SportDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [createForm, setCreateForm] = useState<CreateSportRequest>({
        name: '',
        description: '',
        max_capacity: 0,
        additional_price: 0,
        requires_medical_certificate: false,
    });

    const [editForm, setEditForm] = useState<UpdateSportRequest>({
        description: '',
        max_capacity: 0,
    });

    const fetchSports = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await sportsService.getAll();
            setSports(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar los deportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSports();
    }, []);

    const openCreateModal = () => {
        setCreateForm({
            name: '',
            description: '',
            max_capacity: 0,
            additional_price: 0,
            requires_medical_certificate: false,
        });
        setIsCreateOpen(true);
    };

    const openEditModal = (sport: SportDTO) => {
        setSelectedSport(sport);
        setEditForm({
            description: sport.description ?? '',
            max_capacity: sport.max_capacity,
        });
        setIsEditOpen(true);
    };

    const openDeleteModal = (sport: SportDTO) => {
        setDeletingSport(sport);
        setIsDeleteOpen(true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (createForm.max_capacity <= 0 || createForm.additional_price < 0) {
            toaster.create({
                title: 'Corrige los errores del formulario',
                type: 'warning',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await sportsService.create(createForm);
            toaster.create({
                title: 'Deporte creado con éxito',
                type: 'success',
            });
            setIsCreateOpen(false);
            fetchSports();
        } catch (err: any) {
            toaster.create({
                title: 'Error al crear el deporte',
                description: err.message,
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSport) return;
        setIsSubmitting(true);
        try {
            await sportsService.update(selectedSport.id, editForm);
            toaster.create({
                title: 'Deporte actualizado con éxito',
                type: 'success',
            });
            setIsEditOpen(false);
            fetchSports();
        } catch (err: any) {
            toaster.create({
                title: 'Error al actualizar el deporte',
                description: err.message,
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingSport) return;
        setIsDeleting(true);
        try {
            await sportsService.delete(deletingSport.id);
            toaster.create({
                title: 'Deporte dado de baja con éxito',
                type: 'success',
            });
            setIsDeleteOpen(false);
            fetchSports();
        } catch (err: any) {
            toaster.create({
                title: 'Error al dar de baja el deporte',
                description: err.message,
                type: 'error',
            });
        } finally {
            setIsDeleting(false);
            setDeletingSport(null);
        }
    };

    return (
        <>
            {/* Dialog de confirmación de baja */}
            <DialogRoot
                open={isDeleteOpen}
                onOpenChange={(e) => setIsDeleteOpen(e.open)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dar de baja deporte</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Text>
                            ¿Estás seguro que querés dar de baja{' '}
                            <strong>{deletingSport?.name}</strong>? Esta acción
                            no se puede deshacer.
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

            {/* Dialog de creación */}
            <DialogRoot
                open={isCreateOpen}
                onOpenChange={(e) => setIsCreateOpen(e.open)}
            >
                <DialogContent>
                    <form onSubmit={handleCreate}>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Deporte</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Nombre" required>
                                    <Input
                                        placeholder="Ej. Fútbol"
                                        value={createForm.name}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                name: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </Field>
                                <Field label="Descripción">
                                    <Input
                                        placeholder="Ej. Fútbol 11 en cancha de césped"
                                        value={createForm.description}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Capacidad Máxima"
                                    required
                                    invalid={createForm.max_capacity <= 0}
                                    errorText="La capacidad máxima debe ser mayor a cero"
                                >
                                    <Input
                                        type="number"
                                        placeholder="Ej. 30"
                                        value={createForm.max_capacity}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                max_capacity: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Precio Adicional"
                                    required
                                    invalid={createForm.additional_price < 0}
                                    errorText="El precio adicional no puede ser negativo"
                                >
                                    <Input
                                        type="number"
                                        placeholder="Ej. 5000"
                                        value={createForm.additional_price}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                additional_price: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
                                </Field>
                                <Field label="¿Requiere Certificado Médico?">
                                    <input
                                        type="checkbox"
                                        checked={
                                            createForm.requires_medical_certificate
                                        }
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                requires_medical_certificate:
                                                    e.target.checked,
                                            })
                                        }
                                    />
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
                                Crear Deporte
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            {/* Dialog de edición */}
            <DialogRoot
                open={isEditOpen}
                onOpenChange={(e) => setIsEditOpen(e.open)}
            >
                <DialogContent>
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>
                                Editar Deporte: {selectedSport?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Descripción">
                                    <Input
                                        placeholder="Ej. Fútbol 11 en cancha de césped"
                                        value={editForm.description}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Capacidad Máxima"
                                    required
                                    invalid={
                                        editForm.max_capacity !== undefined &&
                                        editForm.max_capacity <= 0
                                    }
                                    errorText="La capacidad máxima debe ser mayor a cero"
                                >
                                    <Input
                                        type="number"
                                        placeholder="Ej. 30"
                                        value={editForm.max_capacity}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                max_capacity: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
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
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            <Stack gap="8" maxW="6xl" mx="auto">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">
                            Gestión de Deportes
                        </Heading>
                        <Text color="fg.muted" fontSize="md">
                            Administrá el catálogo de deportes ofrecidos por el
                            club.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button
                            variant="outline"
                            onClick={fetchSports}
                            disabled={loading}
                        >
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button colorPalette="blue" onClick={openCreateModal}>
                            <LuPlus /> Crear Deporte
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
                                    Cargando deportes...
                                </Text>
                            </Stack>
                        </Center>
                    ) : sports.length === 0 ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Text color="fg.muted">
                                    No hay deportes registrados.
                                </Text>
                                <Button
                                    variant="ghost"
                                    onClick={openCreateModal}
                                >
                                    Crear primer deporte
                                </Button>
                            </Stack>
                        </Center>
                    ) : (
                        <Table.Root size="sm">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>
                                        Nombre
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Descripción
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Capacidad
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Precio Adicional
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Cert. Médico
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        Acciones
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {sports.map((sport) => (
                                    <Table.Row key={sport.id}>
                                        <Table.Cell fontWeight="medium">
                                            {sport.name}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted">
                                            {sport.description ?? '—'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {sport.max_capacity}
                                        </Table.Cell>
                                        <Table.Cell>
                                            ${sport.additional_price}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {sport.requires_medical_certificate
                                                ? 'Sí'
                                                : 'No'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <HStack gap="2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        openEditModal(sport)
                                                    }
                                                >
                                                    <LuPencil />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorPalette="red"
                                                    onClick={() =>
                                                        openDeleteModal(sport)
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
