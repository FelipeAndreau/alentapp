import { Box, Text, Badge, Button, Flex, useToast } from '@chakra-ui/react';
import { PaymentDTO } from '@alentapp/shared';
import { paymentsService } from '../services/payments';

interface PaymentItemProps {
  payment: PaymentDTO;
  onUpdate: (updatedPayment: PaymentDTO) => void;
}

export function PaymentItem({ payment, onUpdate }: PaymentItemProps) {
  const toast = useToast();

  const handlePay = async () => {
    try {
      const updated = await paymentsService.pay(payment.id);
      onUpdate(updated);
      toast({
        title: 'Cobro exitoso',
        description: 'La cuota se ha marcado como pagada.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'No se pudo cobrar',
        description: error.message, // Mostrará "No se puede cobrar un pago que ha sido anulado", etc.
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancel = async () => {
    try {
      const updated = await paymentsService.cancel(payment.id);
      onUpdate(updated);
      toast({
        title: 'Anulación exitosa',
        description: 'La cuota ha sido anulada.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error al anular',
        description: error.message, // Mostrará "No se puede anular un pago que ya fue cobrado", etc.
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const colorScheme = payment.status === 'Paid' ? 'green' : payment.status === 'Canceled' ? 'red' : 'yellow';

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" mb={4} boxShadow="sm">
      <Flex justifyContent="space-between" alignItems="center">
        <Box>
          <Text fontWeight="bold" fontSize="lg">Cuota {payment.month}/{payment.year}</Text>
          <Text color="gray.500">Monto: ${payment.amount}</Text>
          {payment.payment_date && <Text fontSize="sm">Fecha de cobro: {new Date(payment.payment_date).toLocaleDateString()}</Text>}
        </Box>
        
        <Flex alignItems="center" gap={4}>
          <Badge colorScheme={colorScheme} fontSize="md" p={1} borderRadius="md">
            {payment.status}
          </Badge>
          
          <Button 
            colorScheme="green" 
            size="sm" 
            onClick={handlePay}
            isDisabled={payment.status !== 'Pending'}
          >
            Cobrar
          </Button>
          <Button 
            colorScheme="red" 
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
