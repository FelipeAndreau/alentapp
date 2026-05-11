import { useEffect, useState, useMemo } from 'react';
import { Box, Heading, VStack, Spinner, Center, Text, Flex, HStack, Button, Stack, Input } from '@chakra-ui/react';
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import type { PaymentDTO, MemberDTO, CreatePaymentRequest } from '@alentapp/shared';
import { paymentsService } from '../services/payments';
import { membersService } from '../services/members';
import { PaymentItem } from '../components/PaymentItem';
import { 
  DialogRoot, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { 
  SelectRoot, 
  SelectTrigger, 
  SelectValueText, 
  SelectContent, 
  SelectItem, 
  createListCollection 
} from "../components/ui/select";

import { toaster } from '../components/ui/toaster';

export function PaymentsView() {
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    member_id: "",
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: new Date().toISOString().split('T')[0],
  });

  const membersCollection = useMemo(() => createListCollection({
    items: members.map(m => ({ label: `${m.name} (${m.dni})`, value: m.id }))
  }), [members]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [paymentsData, membersData] = await Promise.all([
        paymentsService.getAll(),
        membersService.getAll()
      ]);
      setPayments(paymentsData);
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

  const handleUpdate = (updatedPayment: PaymentDTO) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );
  };

  const openCreateModal = () => {
    setFormData({
      member_id: "",
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      due_date: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id) {
      toaster.create({ title: "Por favor seleccione un miembro", type: "warning" });
      return;
    }
    if (formData.amount <= 0) {
      toaster.create({ title: "El monto debe ser mayor a 0", type: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentsService.create(formData);
      toaster.create({ title: "Pago creado con exito", type: "success" });
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toaster.create({ 
        title: "Error al crear el pago", 
        description: err.message, 
        type: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8" maxW="4xl" mx="auto">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Gestion de Pagos</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona el cobro de cuotas y el estado de pagos de los miembros.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Crear Pago
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
          p={payments.length > 0 && !loading ? 6 : 0}
        >
          {loading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando pagos...</Text>
              </Stack>
            </Center>
          ) : payments.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No hay pagos registrados.</Text>
                <Button variant="ghost" onClick={openCreateModal}>Crear primer pago</Button>
              </Stack>
            </Center>
          ) : (
            <VStack align="stretch" gap="4">
              {payments.map((payment) => {
                const member = members.find(m => m.id === payment.member_id);
                return (
                  <Box key={payment.id}>
                    <Text fontSize="sm" color="gray.500" mb={1} fontWeight="bold">
                      Socio: {member ? `${member.name} (${member.dni})` : payment.member_id}
                    </Text>
                    <PaymentItem 
                      payment={payment} 
                      onUpdate={handleUpdate} 
                    />
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Pago</DialogTitle>
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
                <Field label="Monto" required>
                  <Input 
                    type="number"
                    placeholder="Ej. 5000" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                    min={0}
                  />
                </Field>
                <HStack gap="4">
                  <Field label="Mes" required>
                    <Input 
                      type="number" 
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                      required
                      min={1}
                      max={12}
                    />
                  </Field>
                  <Field label="Ano" required>
                    <Input 
                      type="number" 
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      required
                      min={2000}
                      max={2100}
                    />
                  </Field>
                </HStack>
                <Field label="Fecha de Vencimiento" required>
                  <Input 
                    type="date" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Crear Pago
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </Stack>
    </DialogRoot>
  );
}
