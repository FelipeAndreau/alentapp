import {
    Table,
    Button,
    Heading,
    HStack,
    IconButton,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Input,
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { lockersService } from "../services/lockers";
import type { LockerDTO, CreateLockerRequest, UpdateLockerRequest, LockerStatus } from "@alentapp/shared";
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    createListCollection,
} from "../components/ui/select";

const statusOptions = createListCollection({
    items: [
        { label: "Available", value: "Available" },
        { label: "Occupied", value: "Occupied" },
        { label: "Maintenance", value: "Maintenance" },
    ],
});

export function LockersView() {
    const [lockers, setLockers] = useState<LockerDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingLockerId, setEditingLockerId] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateLockerRequest & { status?: LockerStatus }>({
        number: 0,
        location: "",
        status: "Available",
    });

    const fetchLockers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await lockersService.getAll();
            setLockers(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar los casilleros");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingLockerId(null);
        setFormData({ number: 0, location: "", status: "Available" });
        setIsDialogOpen(true);
    };

    const openEditModal = (locker: LockerDTO) => {
        setEditingLockerId(locker.id);
        setFormData({
            number: locker.number,
            location: locker.location,
            status: locker.status,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingLockerId) {
                await lockersService.update(editingLockerId, formData as UpdateLockerRequest);
            } else {
                await lockersService.create(formData as CreateLockerRequest);
            }
            setIsDialogOpen(false);
            fetchLockers();
        } catch (err: any) {
            alert(err.message || "Error al guardar el casillero");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLocker = async (id: string, number: number) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el casillero #${number}? Esta acción no se puede deshacer.`)) {
            try {
                await lockersService.delete(id);
                fetchLockers();
            } catch (err: any) {
                alert(err.message || "Error al eliminar el casillero");
            }
        }
    };

    useEffect(() => {
        fetchLockers();
    }, []);

    const getStatusColor = (status: string) => {
        if (status === 'Available') return { bg: 'green.50', color: 'green.700' };
        if (status === 'Occupied') return { bg: 'blue.50', color: 'blue.700' };
        return { bg: 'orange.50', color: 'orange.700' };
    };

    return (
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
            <Stack gap="8">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">Administración de Casilleros</Heading>
                        <Text color="fg.muted" fontSize="md">
                            Gestiona los casilleros del vestuario del club.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button variant="outline" onClick={fetchLockers} disabled={isLoading}>
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button colorPalette="blue" size="md" onClick={openCreateModal}>
                            <LuPlus /> Agregar Casillero
                        </Button>
                    </HStack>
                </Flex>

                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingLockerId ? "Editar Casillero" : "Agregar Nuevo Casillero"}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Número" required>
                                    <Input
                                        type="number"
                                        placeholder="Ej. 1"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                                        required
                                        min={1}
                                        disabled={!!editingLockerId}
                                    />
                                </Field>
                                <Field label="Ubicación" required>
                                    <Input
                                        placeholder="Ej. Vestuario Masculino"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Estado" required>
                                    <SelectRoot
                                        collection={statusOptions}
                                        value={[formData.status ?? "Available"]}
                                        onValueChange={(e) => setFormData({ ...formData, status: e.value[0] as LockerStatus })}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Seleccione un estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.items.map((opt) => (
                                                <SelectItem item={opt} key={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                {editingLockerId ? "Guardar Cambios" : "Crear Casillero"}
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>

                {error && (
                    <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
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
                    position="relative"
                >
                    {isLoading ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Spinner size="xl" color="blue.500" />
                                <Text color="fg.muted">Cargando casilleros...</Text>
                            </Stack>
                        </Center>
                    ) : lockers.length === 0 ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Text color="fg.muted">No se encontraron casilleros.</Text>
                                <Button variant="ghost" onClick={fetchLockers}>Reintentar</Button>
                            </Stack>
                        </Center>
                    ) : (
                        <Table.Root size="md" variant="line" interactive>
                            <Table.Header>
                                <Table.Row bg="bg.muted/50">
                                    <Table.ColumnHeader py="4">Número</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Ubicación</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Socio Asignado</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {lockers.map((locker) => {
                                    const statusColor = getStatusColor(locker.status);
                                    return (
                                        <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                                            <Table.Cell fontWeight="semibold" color="fg.emphasized">
                                                #{locker.number}
                                            </Table.Cell>
                                            <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                                            <Table.Cell>
                                                <Box
                                                    display="inline-block"
                                                    px="2"
                                                    py="0.5"
                                                    borderRadius="md"
                                                    bg={statusColor.bg}
                                                    color={statusColor.color}
                                                    fontSize="xs"
                                                    fontWeight="bold"
                                                >
                                                    {locker.status}
                                                </Box>
                                            </Table.Cell>
                                            <Table.Cell color="fg.muted">
                                                {locker.member_id ?? "—"}
                                            </Table.Cell>
                                            <Table.Cell textAlign="end">
                                                <HStack gap="2" justify="flex-end">
                                                    <IconButton
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Editar casillero"
                                                        onClick={() => openEditModal(locker)}
                                                    >
                                                        <LuPencil />
                                                    </IconButton>
                                                    <IconButton
                                                        variant="ghost"
                                                        size="sm"
                                                        colorPalette="red"
                                                        aria-label="Eliminar casillero"
                                                        onClick={() => handleDeleteLocker(locker.id, locker.number)}
                                                    >
                                                        <LuTrash2 />
                                                    </IconButton>
                                                </HStack>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    )}
                </Box>
            </Stack>
        </DialogRoot>
    );
}