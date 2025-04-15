/*import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Truck, CheckCircle, Package, AlertCircle, Timer, Search, Filter, RefreshCcw, BarChart2, Bell, Users, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSignalR } from '../../../services/SignalRContext'
import MetricsCard from '../../ui/MetricsCard';
import OrderDetailsModal from '../../Modals/OrderDetailsModal';
import axios from 'axios';

//Colunas de pedido
const statusConfig = {
    'pedido-recebido': {
        title: 'Novos Pedidos',
        icon: Package,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600searchTerm'
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
    }
};
const calcularPedidosPorMes = (orders) => {
    // Inicializa um array com todos os meses zerados
    const orderTrends = [
        { name: 'Janeiro', pedidos: 0 },
        { name: 'Fevereiro', pedidos: 0 },
        { name: 'Março', pedidos: 0 },
        { name: 'Abril', pedidos: 0 },
        { name: 'Maio', pedidos: 0 },
        { name: 'Junho', pedidos: 0 },
        { name: 'Julho', pedidos: 0 },
        { name: 'Agosto', pedidos: 0 },
        { name: 'Setembro', pedidos: 0 },
        { name: 'Outubro', pedidos: 0 },
        { name: 'Novembro', pedidos: 0 },
        { name: 'Dezembro', pedidos: 0 }
    ];

    // Itera sobre todos os pedidos
    Object.values(orders).flat().forEach(order => {
        const data = new Date(order.createdAt);
        const mes = data.getMonth(); // retorna 0-11
        orderTrends[mes].pedidos += 1;
    });

    return orderTrends;
};

const OrderCard = ({ order }) => {
    const [timeElapsed, setTimeElapsed] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userData, setUserData] = useState('');

    useEffect(() => {
        const updateTimeElapsed = () => {
            const created = new Date(order.createdAt);
            const now = new Date();
            const diff = now - created;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) {
                setTimeElapsed(`${hours}h ${minutes % 60}m`);
            } else {
                setTimeElapsed(`${minutes}m`);
            }
        };
        updateTimeElapsed();
        const interval = setInterval(updateTimeElapsed, 60000);
        return () => clearInterval(interval);
    }, [order.createdAt]);

    useEffect(() => {
        if (order.finalUserId) {
            fetch(`${process.env.REACT_APP_API_URL}/api/1.0/FinalUser/getUserInfoById/${order.finalUserId}`)
                .then((res) => res.json())
                .then((data) => {
                    console.log("Dados retornados pelo backend:", data);
                    setUserData(data);
                })
                .catch((error) => console.error("Erro ao buscar usuário:", error));
        }
    }, [order.finalUserId]);


    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(order));
        e.target.classList.add('opacity-50', 'scale-105');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50', 'scale-105');
    };

    const handleClick = (e) => {
        // Previne que o clique interfira com o drag and drop
        if (e.target === e.currentTarget || e.target.closest('.order-card-content')) {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <div
                draggable="true"
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
                className="bg-white p-4 mb-3 rounded-xl shadow-sm hover:shadow-md 
                         border-l-4 cursor-pointer relative group
                         transition-all duration-200 ease-in-out
                         active:cursor-grabbing
                         hover:scale-[1.02]"
                style={{
                    borderLeftColor: order.isPriority ? '#EF4444' : '#3B82F6'
                }}
            >
                <div className="order-card-content">
                    <div className="absolute top-2 right-2 flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-full">
                        <Timer size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">{timeElapsed}</span>
                    </div>
                    <div className="flex justify-between items-start mt-4">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                #{order.numero || order.id}
                                {order.isPriority && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse">
                                        Prioritário
                                    </span>
                                )}
                            </h4>
                            {userData.nome && (
                                <p className="text-sm text-gray-600 font-medium">Cliente: {userData.nome}</p>
                            )}
                            {userData.telefone && (
                                <p className="text-sm text-gray-600 font-medium"> Telefone: {userData.telefone}</p>
                            )}
                        </div>
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                            R$ {order.valorTotal?.toFixed(2) || '0.00'}
                        </span>
                    </div>
                    {order.enderecoEntrega && (
                        <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                            <p className="truncate">{order.enderecoEntrega}</p>
                        </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {order.formaPagamento && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                {order.formaPagamento}
                            </span>
                        )}
                        {order.createdAt && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                {new Date(order.createdAt).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes do Pedido *//*}
<OrderDetailsModal
    order={order}
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
/>
        </>
    );
};

// Componente Modal (pode ficar em um arquivo separado)


{*//*quadro kanban*//* }
const StatusColumn = ({ id, title, orders, config, onDrop }) => {
    const Icon = config.icon;
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'scale-[1.01]');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'scale-[1.01]');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'scale-[1.01]');
        try {
            const order = JSON.parse(e.dataTransfer.getData('application/json'));
            onDrop(order, id);
        } catch (error) {
            console.error('Erro ao processar drop:', error);
        }
    };

    return (
        <div
            className={`${config.bg} rounded-xl shadow-lg transition-all duration-200 flex-1 min-w-[300px] max-w-md mx-2`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`p-4 ${config.headerBg} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="text-white" size={20} />
                        <h3 className="font-semibold text-white">
                            {title}
                        </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700">
                        {orders.length}
                    </span>
                </div>
            </div>

            <div className="p-4 h-[calc(100vh-400px)] overflow-y-auto">
                {orders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                    />
                ))}
                {orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                        <AlertCircle size={24} />
                        <p className="mt-2 text-sm">Nenhum pedido neste status.</p>
                    </div>
                )}

            </div>
        </div>
    );
};
{*//*End quadro kanban*//* }



{*//*Estrutura para gerenciar pedidos*//* }
const OrderManagementPanel = () => {
    const { connection, isConnected } = useSignalR();
    const [orders, setOrders] = useState({
        'pedido-recebido': [],
        'pedido-em-producao': [],
        'saiu-para-entrega': [],
        'completo': []
    });

    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [notifications, setNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showMetrics, setShowMetrics] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    {*//*grafico de pedidos por mes*//* }
    const orderTrends = calcularPedidosPorMes(orders);
    {*//*Status dos pedidos*//* }
    const STATUS = {
        RECEBIDO: {
            numero: 0,
            chave: 'pedido-recebido',
            titulo: 'Pedido Recebido'
        },
        EM_PRODUCAO: {
            numero: 1,
            chave: 'pedido-em-producao',
            titulo: 'Em Produção'
        },
        EM_ENTREGA: {
            numero: 2,
            chave: 'saiu-para-entrega',
            titulo: 'Saiu para Entrega'
        },
        COMPLETO: {
            numero: 3,
            chave: 'completo',
            titulo: 'Completo'
        },
        // Funções auxiliares
        porNumero: function (numero) {
            return Object.values(this).find(status =>
                status.numero === numero && typeof status === 'object'
            ) || this.RECEBIDO;
        },
        porChave: function (chave) {
            return Object.values(this).find(status =>
                status.chave === chave && typeof status === 'object'
            ) || this.RECEBIDO;
        }
    };

    // Função para buscar pedidos
    const fetchOrders = useCallback(async () => {
        if (!connection || !isConnected) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/ObterRestauranteIdDoUsuarioAutenticado/`);
            const restauranteId = response.data;

            // Passar o restauranteId para o método RequestAllOrders no Hub
            await connection.invoke("RequestAllOrders", restauranteId);
            //await connection.invoke("RequestAllOrders");
        } catch (error) {
            setError("Erro ao carregar pedidos. Por favor, tente novamente.");
        } finally {
            setLoading(false);
        }
    }, [connection, isConnected]);




    const processOrders = useCallback((data) => {
        // Verifica se data não é um array ou está vazio
        if (!Array.isArray(data) || !data.length) {
            return {
                'pedido-recebido': [],
                'pedido-em-producao': [],
                'saiu-para-entrega': [],
                'completo': []
            };
        }

        const newOrders = {
            'pedido-recebido': [],
            'pedido-em-producao': [],
            'saiu-para-entrega': [],
            'completo': []
        };

        data.forEach(order => {
            // Converter o status para número, removendo possíveis espaços
            const status = Number(order.status.toString().trim());
            // Obter o objeto de status
            const statusObj = STATUS.porNumero(status);
            // Obter a chave do status
            const statusKey = statusObj.chave;
            const processedOrder = {
                ...order,
                id: order.id || order.numero,
                numero: order.numero || order.id,
                createdAt: order.dataPedido || order.createdAt || new Date().toISOString(),
                valorTotal: order.valorTotal || 0,
                nomeCliente: order.nomeCliente || 'Cliente não identificado',
                status: status // Garantir que o status seja salvo como número
            };

            if (statusKey in newOrders) {
                newOrders[statusKey].push(processedOrder);
            } else {
                console.warn(`Chave de status '${statusKey}' não encontrada para o pedido ${processedOrder.numero}`);
            }
        });

        // Ordenação por data de criação
        Object.keys(newOrders).forEach(key => {
            newOrders[key].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
        return newOrders;
    }, []);

    const initializeListeners = useCallback(() => {
        if (!connection) {
            return;
        }
        connection.on("ReceiveOrderNotification", async (pedido) => {
            const notification = {
                id: pedido.orderId,
                message: `Voce recebeu um novo pedido!`,
                timestamp: new Date()
            };
            setNotifications(prev => [notification, ...prev].slice(0, 1));
            await fetchOrders();
        });
        connection.on("ReceiveAllOrders", (orders) => {
            console.log(orders);
            const processedOrders = processOrders(orders);
            setOrders(processedOrders);
            setLastUpdate(new Date());
        });
        connection.on("ReceiveOrderStatusUpdate", (statusUpdate) => {
            setOrders(prev => {
                const updatedOrders = { ...prev };
                let orderToMove;
                // Encontrar o pedido no status atual
                Object.keys(updatedOrders).forEach(statusKey => {
                    const orderIndex = updatedOrders[statusKey].findIndex(o => o.id === statusUpdate.orderId);
                    if (orderIndex !== -1) {
                        [orderToMove] = updatedOrders[statusKey].splice(orderIndex, 1);
                    }
                });

                if (orderToMove) {
                    const oldStatus = STATUS.porNumero(statusUpdate.oldStatus);
                    const novoStatus = STATUS.porNumero(statusUpdate.newStatus);

                    // Atualizar o status do pedido
                    orderToMove.status = statusUpdate.newStatus;

                    // Adicionar ao novo status
                    if (novoStatus.chave in updatedOrders) {
                        updatedOrders[novoStatus.chave].push(orderToMove);
                        updatedOrders[novoStatus.chave].sort((a, b) =>
                            new Date(b.createdAt) - new Date(a.createdAt)
                        );

                        // Criar a notificação com os status corretos
                        const notification = {
                            id: statusUpdate.orderId,
                            message: `Pedido #${statusUpdate.orderNumber} movido de ${oldStatus.titulo} para ${novoStatus.titulo}`,
                            timestamp: new Date()
                        };
                        setNotifications(prev => [notification, ...prev].slice(0, 1));
                    }
                }

                return updatedOrders;
            });
            setLastUpdate(new Date());
        });
    }, [connection, processOrders]);

    useEffect(() => {
        if (connection && isConnected) {
            initializeListeners();
            fetchOrders();
        }
        return () => {
            if (connection) {
                connection.off("ReceiveAllOrders");
                connection.off("ReceiveOrderStatusUpdate");
            }
        };
    }, [connection, isConnected, initializeListeners, fetchOrders]);

    // Função para o handleDrop
    const handleDrop = async (order, newStatusChave) => {
        try {
            if (connection) {
                const novoStatus = STATUS.porChave(newStatusChave);
                // Otimistic update
                setOrders(prev => {
                    const updatedOrders = { ...prev };
                    Object.keys(updatedOrders).forEach(status => {
                        updatedOrders[status] = updatedOrders[status].filter(o => o.id !== order.id);
                    });
                    updatedOrders[newStatusChave] = [
                        ...updatedOrders[newStatusChave],
                        { ...order, status: novoStatus.numero }
                    ];
                    return updatedOrders;
                });

                await connection.invoke("UpdateOrderStatus", order.id, novoStatus.numero);
                toast.success('Status do pedido atualizado com sucesso.');
            }
        } catch (error) {
            toast.error('Erro ao atualizar status do pedido. Tente novamente.');
            await connection.invoke("RequestAllOrders");
        }
    };
    const totalOrders = Object.values(orders).flat().length;
    const totalRevenue = Object.values(orders).flat().reduce((sum, order) => sum + (order.valorTotal || 0), 0);
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    {*//*End estrutura para gerenciar pedidos*//* }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-6">

                        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Pedidos</h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <button className="p-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                                    <Filter size={18} />
                                </button>
                                <div className="relative">
                                    <button
                                        className="p-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 relative"
                                        onClick={() => setNotifications([])} // Limpar notificações ao clicar
                                    >
                                        <Bell size={18} />
                                        {notifications.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                                                {notifications.length}
                                            </span>
                                        )}
                                    </button>
                                    {notifications.length > 0 && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                            <div className="p-2">
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notificações</h3>
                                                {notifications.map((notification, index) => (
                                                    <div key={index} className="p-2 hover:bg-gray-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">{notification.message}</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(notification.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-2 rounded-lg shadow-sm">
                                <Clock size={16} />
                                Última atualização: {lastUpdate.toLocaleTimeString()}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-gray-600">
                                    {isConnected ? 'Conectado' : 'Desconectado'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {showMetrics && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <MetricsCard
                                    icon={Package}
                                    title="Total de Pedidos"
                                    value={totalOrders}
                                    trend={+12}
                                    description="Nas últimas 24 horas"
                                />
                                <MetricsCard
                                    icon={DollarSign}
                                    title="Receita Total"
                                    value={`R$ ${totalRevenue.toFixed(2)}`}
                                    trend={+8}
                                    description="Comparado a ontem"
                                />
                                <MetricsCard
                                    icon={Users}
                                    title="Média por Pedido"
                                    value={`R$ ${averageOrderValue.toFixed(2)}`}
                                    trend={-3}
                                    description="Valor médio dos pedidos"
                                />
                                <MetricsCard
                                    icon={Clock}
                                    title="Tempo Médio"
                                    value="28 min"
                                    trend={+5}
                                    description="Tempo de processamento"
                                />
                            </div>
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Tendência de Pedidos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={orderTrends}>
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line
                                                    type="monotone"
                                                    dataKey="pedidos"
                                                    stroke="#2563eb"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#2563eb' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar pedidos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={() => setShowMetrics(!showMetrics)}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <BarChart2 size={18} />
                                {showMetrics ? 'Ocultar Métricas' : 'Mostrar Métricas'}
                            </button>
                        </div>

                    </div>
                </div>
                <div className="flex space-x-4 overflow-x-auto pb-4">
                    {Object.entries(statusConfig).map(([status, config]) => (
                        <StatusColumn
                            key={status}
                            id={status}
                            title={config.title}
                            orders={orders[status]?.filter(order =>
                                searchTerm === '' ||
                                order.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                order.id?.toString().includes(searchTerm) ||
                                order.numero?.toString().includes(searchTerm)
                            ) || []}
                            config={config}
                            onDrop={handleDrop}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
export default OrderManagementPanel;*/