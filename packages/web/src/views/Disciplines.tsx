import {
  Table,
  Button,
  Heading,
  HStack,
  Stack,
  Text,
  Box,
  Flex,
  Spinner,
  Center,
  Input,
  Badge,
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw } from 'react-icons/lu';
import { useEffect, useState, useMemo } from 'react';
import { disciplinesService } from '../services/disciplines';
import { membersService } from '../services/members';
import type { DisciplineDTO, MemberDTO, CreateDisciplineRequest } from '@alentapp/shared';
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
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  createListCollection,
} from '../components/ui/select';
import { toaster } from '../components/ui/toaster';

const suspensionOptions = createListCollection({
  items: [
    { label: 'No', value: 'false' },
    { label: 'Sí', value: 'true' },
  ],
});

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function DisciplinesView() {
  const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateDisciplineRequest>({
    reason: '',
    start_date: '',
    end_date: '',
    is_total_suspension: false,
    member_id: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const membersCollection = useMemo(
    () =>
      createListCollection({
        items: members.map((m) => ({ label: `${m.name} (${m.dni})`, value: m.id })),
      }),
    [members]
  );

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [disciplinesData, membersData] = await Promise.all([
        disciplinesService.getAll(),
        membersService.getAll(),
      ]);
      setDisciplines(disciplinesData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormData({ reason: '', start_date: '', end_date: '', is_total_suspension: false, member_id: '' });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.member_id) errors.member_id = 'Debe seleccionar un socio';
    if (!formData.reason.trim()) errors.reason = 'El motivo es obligatorio';
    if (!formData.start_date) errors.start_date = 'La fecha de inicio es obligatoria';
    if (!formData.end_date) errors.end_date = 'La fecha de fin es obligatoria';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toaster.create({ title: 'Corrija los errores en el formulario', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    try {
      await disciplinesService.create(formData);
      toaster.create({ title: 'Disciplina registrada con éxito', type: 'success' });
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toaster.create({
        title: 'No se pudo registrar la disciplina',
        description: err.message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberName = (member_id: string) => {
    const member = members.find((m) => m.id === member_id);
    return member ? `${member.name} (${member.dni})` : member_id;
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">
              Gestión de Disciplinas
            </Heading>
            <Text color="fg.muted" fontSize="md">
              Registra y consulta las sanciones aplicadas a los socios del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Nueva Disciplina
            </Button>
          </HStack>
        </Flex>

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
                <Text color="fg.muted">Cargando disciplinas...</Text>
              </Stack>
            </Center>
          ) : disciplines.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No hay disciplinas registradas.</Text>
                <Button variant="ghost" onClick={openCreateModal}>
                  Registrar primera disciplina
                </Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Motivo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha inicio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha fin</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Suspensión total</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {disciplines.map((d) => (
                  <Table.Row key={d.id} _hover={{ bg: 'bg.muted/30' }}>
                    <Table.Cell fontWeight="semibold" color="fg.emphasized">
                      {getMemberName(d.member_id)}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{d.reason}</Table.Cell>
                    <Table.Cell color="fg.muted">{formatDate(d.start_date)}</Table.Cell>
                    <Table.Cell color="fg.muted">{formatDate(d.end_date)}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={d.is_total_suspension ? 'red' : 'gray'}>
                        {d.is_total_suspension ? 'Sí' : 'No'}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Nueva Disciplina</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field
                  label="Socio"
                  required
                  invalid={!!formErrors.member_id}
                  errorText={formErrors.member_id}
                >
                  <SelectRoot
                    collection={membersCollection}
                    value={formData.member_id ? [formData.member_id] : []}
                    onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {membersCollection.items.map((m) => (
                        <SelectItem item={m} key={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field
                  label="Motivo"
                  required
                  invalid={!!formErrors.reason}
                  errorText={formErrors.reason}
                >
                  <Input
                    placeholder="Ej. Conducta antideportiva"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </Field>

                <HStack gap="4">
                  <Field
                    label="Fecha de inicio"
                    required
                    invalid={!!formErrors.start_date}
                    errorText={formErrors.start_date}
                  >
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </Field>
                  <Field
                    label="Fecha de fin"
                    required
                    invalid={!!formErrors.end_date}
                    errorText={formErrors.end_date}
                  >
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </Field>
                </HStack>

                <Field label="Suspensión total">
                  <SelectRoot
                    collection={suspensionOptions}
                    value={[String(formData.is_total_suspension)]}
                    onValueChange={(e) =>
                      setFormData({ ...formData, is_total_suspension: e.value[0] === 'true' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValueText />
                    </SelectTrigger>
                    <SelectContent>
                      {suspensionOptions.items.map((opt) => (
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
                Registrar
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </Stack>
    </DialogRoot>
  );
}
