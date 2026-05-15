import { useState } from 'react';
import { Box, Text, Badge, Button, Flex } from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import type { PaymentDTO } from '@alentapp/shared';
import { paymentsService } from '../services/payments';

interface PaymentItemProps {
  payment: PaymentDTO;
  onUpdate: (updatedPayment: PaymentDTO) => void;
}

export function PaymentItem({ payment, onUpdate }: PaymentItemProps) {
  const [loadingPay, setLoadingPay] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const handlePay = async () => {
    setLoadingPay(true);
    try {
      const updated = await paymentsService.pay(payment.id);
      onUpdate(updated);
      toaster.create({
        title: 'Cobro exitoso',
        description: 'La cuota se ha marcado como pagada.',
        type: 'success',
      });
    } catch (error: any) {
      toaster.create({
        title: 'No se pudo cobrar',
        description: error.message,
        type: 'error',
      });
    } finally {
      setLoadingPay(false);
    }
  };

  const handleCancel = async () => {
    setLoadingCancel(true);
    try {
      const updated = await paymentsService.cancel(payment.id);
      onUpdate(updated);
      toaster.create({
        title: 'Anulacion exitosa',
        description: 'La cuota ha sido anulada.',
        type: 'info',
      });
    } catch (error: any) {
      toaster.create({
        title: 'Error al anular',
        description: error.message,
        type: 'error',
      });
    } finally {
      setLoadingCancel(false);
    }
  };

  const colorPalette = payment.status === 'Paid' ? 'green' : payment.status === 'Canceled' ? 'red' : 'yellow';

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" mb={4} boxShadow="sm">
      <Flex justifyContent="space-between" alignItems="center">
        <Box>
          <Text fontWeight="bold" fontSize="lg">Cuota {payment.month}/{payment.year}</Text>
          <Text color="gray.500">Monto: ${payment.amount}</Text>
          {payment.payment_date && <Text fontSize="sm">Fecha de cobro: {new Date(payment.payment_date).toLocaleDateString()}</Text>}
        </Box>

        <Flex alignItems="center" gap={4}>
          <Badge colorPalette={colorPalette} fontSize="md" p={1} borderRadius="md">
            {payment.status}
          </Badge>

          <Button
            colorPalette="green"
            size="sm"
            onClick={handlePay}
            loading={loadingPay}
            disabled={payment.status !== 'Pending' || loadingCancel}
          >
            Cobrar
          </Button>
          <Button
            colorPalette="red"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            loading={loadingCancel}
            disabled={payment.status !== 'Pending' || loadingPay}
          >
            Anular
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
