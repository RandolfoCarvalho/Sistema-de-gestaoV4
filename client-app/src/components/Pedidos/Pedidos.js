import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../BottomNav';
import axios from 'axios';
import { useStore } from '../Context/StoreContext';
import FinalUserModal from '../Modals/FinalUserModal';

const OrderHistory = () => {
    const { currentStore } = useStore();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [userPhone, setUserPhone] = useState(localStorage.getItem("FinalUserTelefone"));

    useEffect(() => {
        if (userPhone) {
            fetchOrders(userPhone);
        } else {
            setShowModal(true);
        }
    }, [userPhone]);
    
    const fetchOrders = async (phone) => {
        try {
            const restauranteResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/BuscarRestauranteIdPorNome/${currentStore}`
            );
            const restauranteId = restauranteResponse.data;
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/1.0/FinalUser/GetPedidosByUser/${phone}/${restauranteId}`
            );
            setOrders(Array.isArray(response.data) ? response.data : []);
            console.log("Pedidos: ", response.data);
            console.log("Phone: ", userPhone);
            console.log("restauranteId: ", restauranteId);
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const viewOrderDetails = (order) => {
        navigate(`/pedidos/${order.id}`, { state: { orderData: order } });
    };

    const repeatOrder = (orderId) => {
        console.log("Repetir pedido", orderId);
    };

    const formatDate = (dateString) => {
        if (!dateString) return { date: "N/A", time: "N/A" };
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getStatusInfo = (statusCode) => {
        const statusMap = {
            0: { text: "Pendente", color: "bg-yellow-500" },
            1: { text: "Em preparo", color: "bg-orange-500" },
            2: { text: "Saiu para entrega", color: "bg-blue-500" },
            3: { text: "Entregue", color: "bg-green-500" },
            4: { text: "Cancelado", color: "bg-red-500" }
        };
        return statusMap[statusCode] || { text: "Desconhecido", color: "bg-gray-500" };
    };

    const formatOrderNumber = (numero) => {
        return numero && numero.startsWith("PED: ")
            ? numero.substring(5)
            : numero || "N/A";
    };

    const formatCurrency = (value) => {
        const amount = parseFloat(value);
        return !isNaN(amount)
            ? `R$ ${amount.toFixed(2).replace('.', ',')}`
            : 'R$ 0,00';
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
                                        className="border border-blue-500 text-blue-500 py-3 rounded-lg font-medium"
                                    >
                                        Detalhes
                                    </button>
                                    <button
                                        onClick={() => repeatOrder(order.id)}
                                        className="bg-blue-500 text-white py-3 rounded-lg font-medium"
                                    >
                                        Repetir pedido
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Modal de telefone */}
            {showModal && (
                <FinalUserModal onClose={() => setShowModal(false)} />
            )}
        </div>
    );
};

export default OrderHistory;
