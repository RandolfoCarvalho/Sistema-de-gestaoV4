type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

interface Order {
    id: number;
    status: OrderStatus;
}