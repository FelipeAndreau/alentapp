import { useEffect, useState, useMemo } from 'react';
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
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw, LuGavel } from 'react-icons/lu';
import type { DisciplineDTO, MemberDTO, CreateDisciplineRequest } from '@alentapp/shared';
import { disciplinesService } from '../services/disciplines';
import { membersService } from '../services/members';
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

export function DisciplinesView() {
  const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
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

  const membersCollection = useMemo(
    () =>
      createListCollection({
        items: members.map((m) => ({ label: `${m.name} (${m.dni})`, value: m.id })),
      }),
    [members],
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [disciplinesData, membersData] = await Promise.all([
        disciplinesService.getAll(),
        membersService.getAll(),
      ]);
      setDisciplines(disciplinesData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormData({
      reason: '',
      start_date: '',
      end_date: '',
      is_total_suspension: false,
      member_id: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await disciplinesService.create(formData);
      toaster.create({ title: 'Disciplina creada con éxito', type: 'success' });
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toaster.create({
        title: 'No se pudo crear la disciplina',
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

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">
              Administración de Disciplinas
            </Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona las sanciones aplicadas a los socios del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Disciplina
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Disciplina</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <SelectRoot
                    collection={membersCollection}
                    value={formData.member_id ? [formData.member_id] : []}
                    onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {membersCollection.items.map((member) => (
                        <SelectItem item={member} key={member.value}>
                          {member.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
                <Field label="Motivo" required>
                  <Input
                    placeholder="Ej. Conducta inapropiada"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </Field>
                <HStack gap="4">
                  <Field label="Fecha de inicio" required>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Fecha de fin" required>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </Field>
                </HStack>
                <Field label="¿Suspensión total?">
                  <SelectRoot
                    collection={suspensionOptions}
                    value={[formData.is_total_suspension ? 'true' : 'false']}
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
                Crear Disciplina
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

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
          position="relative"
        >
          {loading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando disciplinas...</Text>
              </Stack>
            </Center>
          ) : disciplines.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <LuGavel size={40} color="gray" />
                <Text color="fg.muted">No hay disciplinas registradas.</Text>
                <Button variant="ghost" onClick={openCreateModal}>
                  Agregar primera disciplina
                </Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Motivo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Inicio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fin</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Suspensión total</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {disciplines.map((discipline) => (
                  <Table.Row key={discipline.id} _hover={{ bg: 'bg.muted/30' }}>
                    <Table.Cell fontWeight="semibold" color="fg.emphasized">
                      {getMemberName(discipline.member_id)}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{discipline.reason}</Table.Cell>
                    <Table.Cell color="fg.muted">{formatDate(discipline.start_date)}</Table.Cell>
                    <Table.Cell color="fg.muted">{formatDate(discipline.end_date)}</Table.Cell>
                    <Table.Cell>
                      <Box
                        display="inline-block"
                        px="2"
                        py="0.5"
                        borderRadius="md"
                        bg={discipline.is_total_suspension ? 'red.50' : 'green.50'}
                        color={discipline.is_total_suspension ? 'red.700' : 'green.700'}
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {discipline.is_total_suspension ? 'Sí' : 'No'}
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}
