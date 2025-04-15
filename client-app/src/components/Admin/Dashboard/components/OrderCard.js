import React from 'react';
import { Clock, Package, MapPin, Coffee, DollarSign, User } from 'react-feather';

const OrderCard = ({ order }) => {
    if (!order) return null; // Garante que o pedido existe antes de tentar renderizar.

    // Formatar a data do pedido
    const formattedDate = order.dataPedido
        ? new Date(order.dataPedido).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Data não disponível';

    // Contar itens no pedido
    const totalItems = order.itens?.length || 0;

    // Exibir endereço formatado corretamente
    const endereco = order.enderecoEntrega
        ? `${order.enderecoEntrega.logradouro}, ${order.enderecoEntrega.numero} - ${order.enderecoEntrega.bairro}, ${order.enderecoEntrega.cidade}`
        : 'Endereço não informado';

    return (
        <div
            className="bg-white rounded-lg shadow-sm p-4 mb-3 transition-all hover:shadow-md cursor-grab active:cursor-grabbing"
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(order));
                e.currentTarget.classList.add('opacity-50');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('opacity-50');
            }}
        >
            {/* Número do Pedido e Valor Total */}
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-800">Pedido #{order.numero}</h4>
                {order.pagamento?.valorTotal && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        R$ {order.pagamento.valorTotal.toFixed(2)}
                    </span>
                )}
            </div>

            {/* Informações gerais do pedido */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Package size={14} />
                    <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
                </div>

                {/* Exibir endereço de entrega caso esteja disponível */}
                {order.enderecoEntrega && (
                    <div className="flex items-center gap-1 col-span-2">
                        <MapPin size={14} />
                        <span className="truncate">{endereco}</span>
                    </div>
                )}

                {/* Exibir informações do cliente */}
                {order.finalUserName && (
                    <div className="flex items-center gap-1 col-span-2">
                        <User size={14} />
                        <span className="truncate">{order.finalUserName} - {order.finalUserTelefone || 'Telefone não informado'}</span>
                    </div>
                )}
            </div>

            {/* Lista de Itens do Pedido */}
            {order.itens && order.itens.length > 0 && (
                <div className="border-t border-gray-100 pt-2 mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Itens do pedido:</p>
                    <ul className="text-xs space-y-1">
                        {order.itens.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex items-center gap-1">
                                <Coffee size={12} />
                                <span className="truncate">{item.quantidade}x {item.produtoId}</span>
                            </li>
                        ))}
                        {order.itens.length > 3 && (
                            <li className="text-gray-500 italic">+ {order.itens.length - 3} mais...</li>
                        )}
                    </ul>
                </div>
            )}

            {/* Observações do pedido */}
            {order.observacoes && (
                <div className="mt-2 text-xs text-gray-600 italic">
                    <p className="truncate">{order.observacoes}</p>
                </div>
            )}
        </div>
    );
};

export default OrderCard;
