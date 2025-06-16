import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/ui/BottomNav';
import axios from 'axios';
import { useStore } from '../Context/StoreContext';
import FinalUserModal from '../Modals/FinalUserModal';

// Interface para definir a estrutura de um objeto de pedido
interface Order {
  id: number | string;
  dataPedido: string;
  status: number;
  numero: string;
  finalUserName?: string;
  observacoes?: string;
  pagamento?: {
    valorTotal: number;
  };
  itens?: any[]; // Pode ser tipado de forma mais específica se necessário
}

// Interface para os dados do usuário retornados no sucesso do login
interface UserData {
    FinalUserTelefone: string;
    // Adicione outras propriedades do usuário que você recebe
}

const OrderHistory: React.FC = () => {
    const { currentStore, storeInfo } = useStore();
    const navigate = useNavigate();

    // Tipagem explícita para os estados
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [userPhone, setUserPhone] = useState<string | null>(localStorage.getItem("FinalUserTelefone"));

    useEffect(() => {
        if (userPhone) {
            fetchOrders(userPhone);
        } else {
            setShowModal(true);
        }
    }, [userPhone]);
    
    // Tipando o argumento da função
    const fetchOrders = async (phone: string) => {
        try {
            const restauranteResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/BuscarRestauranteIdPorNome/${currentStore}`
            );
            const restauranteId = restauranteResponse.data;
            // Informa ao Axios o tipo de dado esperado na resposta
            const response = await axios.get<Order[]>(
                `${process.env.REACT_APP_API_URL}/api/1.0/FinalUser/GetPedidosByUser/${phone}/${restauranteId}`
            );
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Tipando o argumento da função
    const viewOrderDetails = (order: Order) => {
        navigate(`/pedidos/${order.id}`, { state: { orderData: order } });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return { date: "N/A", time: "N/A" };
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getStatusInfo = (statusCode: number) => {
        // Tipando o mapa de status para maior segurança
        const statusMap: { [key: number]: { text: string; color: string } } = {
            0: { text: "Pendente", color: "bg-yellow-500" },
            1: { text: "Em preparo", color: "bg-orange-500" },
            2: { text: "Saiu para entrega", color: "bg-blue-500" },
            3: { text: "Entregue", color: "bg-green-500" },
            4: { text: "Cancelado", color: "bg-red-500" }
        };
        return statusMap[statusCode] || { text: "Desconhecido", color: "bg-gray-500" };
    };

    const formatOrderNumber = (numero: string | null | undefined): string => {
        return numero && numero.startsWith("PED: ")
            ? numero.substring(5)
            : numero || "N/A";
    };

    const formatCurrency = (value: number | null | undefined): string => {
        const amount = parseFloat(String(value));
        return !isNaN(amount)
            ? `R$ ${amount.toFixed(2).replace('.', ',')}`
            : 'R$ 0,00';
    };

    // Função para lidar com o sucesso do login no modal
    const handleLoginSuccess = (userData: UserData) => {
        setUserPhone(userData.FinalUserTelefone);
        setShowModal(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm p-4 flex items-center z-10">
                <button className="mr-3" onClick={() => navigate(-1)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <h1 className="text-xl font-medium">Meus pedidos</h1>
            </div>

            {/* Orders List */}
            <div className="p-4 flex-1 overflow-auto">
                {loading ? (
                    <div className="text-center py-10">
                        <p className="text-gray-600">Carregando pedidos...</p>
                    </div>
                ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-600">Você ainda não tem pedidos</p>
                        <button
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => navigate(`/loja/${currentStore}`)}
                        >
                            Fazer meu primeiro pedido
                        </button>
                    </div>
                ) : (
                    orders.map(order => {
                        const { date, time } = formatDate(order.dataPedido);
                        const statusInfo = getStatusInfo(order.status);
                        const orderNumber = formatOrderNumber(order.numero);

                        return (
                            <div key={order.id} className="bg-white rounded-lg shadow mb-4 p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-lg font-bold">Pedido #{orderNumber}</h2>
                                    <span className={`${statusInfo.color} text-white px-2 py-1 rounded text-sm`}>
                                        {statusInfo.text}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-3">Em {date} às {time}</p>

                                {order.finalUserName && (
                                    <p className="text-sm text-gray-700 mb-2">
                                        <span className="font-medium">Cliente:</span> {order.finalUserName}
                                    </p>
                                )}

                                {order.observacoes && (
                                    <div className="bg-gray-50 p-3 mb-3 rounded">
                                        <p className="font-medium mb-1">Observações:</p>
                                        <p className="text-gray-700">{order.observacoes}</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Valor total:</p>
                                        <p className="font-bold text-lg">
                                            {formatCurrency(order.pagamento?.valorTotal)}
                                        </p>
                                    </div>

                                    {order.itens && order.itens.length > 0 && (
                                        <p className="text-sm text-gray-600">
                                            {order.itens.length} {order.itens.length === 1 ? 'item' : 'itens'}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => viewOrderDetails(order)}
                                        className="border border-blue-500 text-blue-500 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                                    >
                                        Detalhes
                                    </button>
                                    
                                    {storeInfo?.phoneNumber && (
                                        <a
                                            href={`https://wa.me/55${storeInfo.phoneNumber}?text=Acompanhar pedido número ${orderNumber}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-500 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 text-base"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 9.172a4 4 0 105.656 5.656M15 12a3 3 0 01-3 3" />
                                            </svg>
                                            <span className="leading-none">Acompanhar pedido</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Modal de telefone com todas as props obrigatórias */}
            {showModal && (
                <FinalUserModal 
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleLoginSuccess}
                />
            )}
        </div>
    );
};

export default OrderHistory;