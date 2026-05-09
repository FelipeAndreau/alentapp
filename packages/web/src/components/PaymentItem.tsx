import { Box, Text, Badge, Button, Flex } from '@chakra-ui/react';
import type { PaymentDTO } from '@alentapp/shared';
import { paymentsService } from '../services/payments';

interface PaymentItemProps {
  payment: PaymentDTO;
  onUpdate: (updatedPayment: PaymentDTO) => void;
}

export function PaymentItem({ payment, onUpdate }: PaymentItemProps) {
  const handlePay = async () => {
    try {
      const updated = await paymentsService.pay(payment.id);
      onUpdate(updated);
      alert('Cobro exitoso: La cuota se ha marcado como pagada.');
    } catch (error: any) {
      alert('No se pudo cobrar: ' + error.message);
    }
  };

  const handleCancel = async () => {
    try {
      const updated = await paymentsService.cancel(payment.id);
      onUpdate(updated);
      alert('Anulacion exitosa: La cuota ha sido anulada.');
    } catch (error: any) {
      alert('Error al anular: ' + error.message);
    }
  };

  const colorPalette = payment.status === 'Paid' ? 'green' : payment.status === 'Canceled' ? 'red' : 'yellow';

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" mb={4} boxShadow="sm">
      <Flex justifyContent="space-between" alignItems="center">
        <Box>
          <Text fontWeight="bold" fontSize="lg">Cuota {payment.month}/{payment.year}</Text>
          <Text color="gray.500">Monto: ${payment.amount}</Text>
          <Text color="gray.500" fontSize="sm">Vence el: {new Date(payment.due_date + 'T00:00:00').toLocaleDateString()}</Text>
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
            isDisabled={payment.status !== 'Pending'}
          >
            Cobrar
          </Button>
          <Button 
            colorPalette="red" 
            variant="outline"
            size="sm" 
            onClick={handleCancel}
            isDisabled={payment.status !== 'Pending'}
          >
            Anular
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
