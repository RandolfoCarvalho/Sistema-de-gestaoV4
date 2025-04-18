import { MdError as AlertCircle, MdAutorenew as ProcessIcon, MdCheckCircle as CheckCircleIcon } from 'react-icons/md';
import { Package, Clock, Truck, CheckCircle, XIcon } from 'lucide-react';


const statusConfig = {
    'pedido-recebido': {
        title: 'Novos Pedidos',
        icon: Package,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    'pedido-em-producao': {
        title: 'Em Produção',
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        headerBg: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    },
    'saiu-para-entrega': {
        title: 'Em Entrega',
        icon: Truck,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        headerBg: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    'completo': {
        title: 'Completos',
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        headerBg: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    'Cancelado': {
        title: 'Cancelados',
        icon: XIcon,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        headerBg: 'bg-gradient-to-r from-red-500 to-red-600'
    }
};

export default statusConfig;