import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../Context/StoreContext';
import axios from "axios";
import { useState, useEffect } from "react";
import BottomNav from '../BottomNav';

const OrderDetails = () => {
    const navigate = useNavigate();
    const { numeroPedido } = useParams();
    const location = useLocation(); // Add this import from react-router-dom
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentStore } = useStore();
    const [userPhone, setUserPhone] = useState(localStorage.getItem("FinalUserTelefone"));

    useEffect(() => {
        if (location.state && location.state.orderData) {
            setOrderData(location.state.orderData);
            setLoading(false);
        } else {
            fetchOrderDetails();
        }
    }, [location.state, userPhone]);

    const fetchOrderDetails = async () => {
        try {
            const restauranteResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/BuscarRestauranteIdPorNome/${currentStore}`
            );
            const restauranteId = restauranteResponse.data;
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/1.0/FinalUser/GetPedidosByUser/${userPhone}/${restauranteId}`
            );
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                const order = response.data.find(o => o.id.toString() === numeroPedido);
                setOrderData(order || null);
            } else {
                setOrderData(null);
            }
        } catch (error) {
            console.error("Erro ao buscar detalhes do pedido:", error);
        } finally {
            setLoading(false);
        }
    };
    const goBack = () => {
        navigate(-1);
    };
    const repeatOrder = () => {
        // Implementar funcionalidade de repetir pedido
    };

    // Função para formatar data
    const formatDate = (dateString) => {
        if (!dateString) return { date: "N/A", time: "N/A" };
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Função para mapear status numérico para texto
    const getStatusText = (statusCode) => {
        const statusMap = {
            0: "Pendente",
            1: "Em preparo",
            2: "Saiu para entrega",
            3: "Entregue",
            4: "Cancelado"
        };
        return statusMap[statusCode] || "Desconhecido";
    };

    // Timeline baseada no status
    const generateTimeline = (status) => {
        const timeline = [
            { time: formatDate(orderData?.dataPedido).time, status: "Pedido recebido" }
        ];

        if (status >= 1) {
            timeline.push({ time: "", status: "Em preparo" });
        }
        if (status >= 2) {
            timeline.push({ time: "", status: "Saiu para entrega" });
        }
        if (status >= 3) {
            timeline.push({ time: "", status: "Entregue" });
        }

        return timeline;
    };

    if (loading) {
        return <div className="p-4 text-center">Carregando detalhes do pedido...</div>;
    }

    if (!orderData) {
        return <div className="p-4 text-center">Pedido não encontrado</div>;
    }

    const { date, time } = formatDate(orderData?.dataPedido);
    const timeline = generateTimeline(orderData?.status || 0);

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm p-4 flex items-center">
                <button onClick={goBack} className="mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <h1 className="text-xl font-medium">Detalhes do pedido</h1>
            </div>

            {/* Order Info */}
            <div className="p-4 pb-20 flex-1 overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold">Pedido {orderData.numero}</h2>
                        <p className="text-sm text-gray-600">Em {date} às {time}</p>
                    </div>
                    <button
                        onClick={repeatOrder}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm"
                    >
                        Repetir pedido
                    </button>
                </div>

                {/* Status Timeline */}
                <div className="bg-white p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">Status</h3>
                        <span className="bg-gray-500 text-white px-2 py-1 rounded text-sm">{getStatusText(orderData.status)}</span>
                    </div>

                    <div className="relative pl-6">
                        {timeline.map((step, index) => (
                            <div key={index} className="relative mb-4">
                                <div className="absolute left-0 mt-1 -ml-6 w-3 h-3 bg-blue-500 rounded-full"></div>
                                {index < timeline.length - 1 && (
                                    <div className="absolute left-0 top-4 -ml-5 w-1 h-full bg-blue-500"></div>
                                )}
                                <p className="text-sm font-medium">{step.time} - {step.status}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-200 p-4 rounded-lg mb-4">
                    <h3 className="font-bold mb-3">Informações do cliente</h3>
                    <p className="font-medium mb-1">Nome: {orderData.finalUserName}</p>
                    <p>Telefone: {orderData.finalUserTelefone}</p>
                </div>

                {/* Delivery Info */}
                <div className="bg-gray-200 p-4 rounded-lg mb-4">
                    <h3 className="font-bold mb-3">Forma de entrega</h3>
                    <p className="font-medium mb-1">Endereço de entrega 1</p>
                    {orderData?.enderecoEntrega ? (
                        <>
                            <p>{orderData.enderecoEntrega.logradouro}, {orderData.enderecoEntrega.numero}</p>
                            <p>{orderData.enderecoEntrega.complemento}</p>
                            <p>{orderData.enderecoEntrega.bairro}, {orderData.enderecoEntrega.cidade}</p>
                            <p>CEP: {orderData.enderecoEntrega.cep}</p>
                        </>
                    ) : (
                        <p>Endereço não disponível</p>
                    )}
                </div>
                {/* Payment Info */}
                <div className="bg-gray-200 p-4 rounded-lg mb-4">
                    <h3 className="font-bold mb-3">Forma de pagamento</h3>
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <div>
                            <p className="font-medium">{orderData.pagamento.formaPagamento}</p>
                            <p className="text-sm text-gray-600">{orderData.observacoes ? `(${orderData.observacoes})` : ''}</p>
                            <p className="text-sm text-gray-600">
                                {orderData.pagamento.pagamentoAprovado ? 'Pagamento aprovado' : 'Aguardando pagamento'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-200 p-4 rounded-lg">
                    <h3 className="font-bold mb-3">Itens do pedido</h3>

                    {orderData?.itens && orderData.itens.length > 0 ? (
                        orderData.itens.map((item, index) => (
                            <div key={index} className="flex mb-4">
                                <div className="w-16 h-16 bg-gray-300 rounded mr-3 flex items-center justify-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="font-medium">{item.quantidade}x {item.nomeProduto || "Produto"}</p>
                                        <p className="font-medium text-blue-500">
                                            R$ {(item.precoUnitario * item.quantidade).toFixed(2).replace('.', ',')}
                                        </p>
                                    </div>

                                    {item.opcoesExtras && item.opcoesExtras.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-700">Acompanhamentos</p>
                                            {item.opcoesExtras.map((extra, idx) => (
                                                <p key={idx} className="text-sm text-gray-600">{extra.quantidade}x {extra.nome}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Nenhum item disponível</p>
                    )}

                    <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between mb-2">
                            <p>Subtotal</p>
                            <p>R$ {orderData.pagamento.subTotal.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="flex justify-between mb-2">
                            <p>Taxa de entrega</p>
                            <p>R$ {orderData.pagamento.taxaEntrega.toFixed(2).replace('.', ',')}</p>
                        </div>
                        {orderData.pagamento.desconto > 0 && (
                            <div className="flex justify-between mb-2 text-green-600">
                                <p>Desconto</p>
                                <p>-R$ {orderData.pagamento.desconto.toFixed(2).replace('.', ',')}</p>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg mt-2">
                            <p>Total</p>
                            <p>R$ {orderData.pagamento.valorTotal.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default OrderDetails;