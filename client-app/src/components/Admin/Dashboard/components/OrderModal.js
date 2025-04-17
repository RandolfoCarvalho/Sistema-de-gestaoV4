import React from 'react';

const OrderModal = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Detalhes do Pedido #{order.id}</h2>

                {/* Detalhes do cliente */}
                <div className="mb-4">
                    <p><strong>Cliente:</strong> {order.finalUser?.nome}</p>
                    <p><strong>Email:</strong> {order.finalUser?.email}</p>
                    <p><strong>Telefone:</strong> {order.finalUser?.telefone}</p>
                </div>

                {/* Detalhes do pedido */}
                <div className="mb-4">
                    <p><strong>Status do Pedido:</strong> {order.status}</p>
                    <p><strong>Total:</strong> R$ {order.total}</p>
                    <p><strong>Data do Pedido:</strong> {new Date(order.dataPedido).toLocaleDateString()}</p>
                </div>

                {/* Itens do pedido */}
                <div className="mb-4">
                    <h3 className="font-semibold">Itens do Pedido</h3>
                    <ul>
                        {order.itens.map((item) => (
                            <li key={item.id} className="flex justify-between">
                                <span>{item.produto?.nome}</span>
                                <span>{item.quantidade} x R$ {item.precoUnitario}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Endereço de entrega */}
                <div className="mb-4">
                    <h3 className="font-semibold">Endereço de Entrega</h3>
                    <p><strong>Rua:</strong> {order.enderecoEntrega?.rua}</p>
                    <p><strong>Bairro:</strong> {order.enderecoEntrega?.bairro}</p>
                    <p><strong>Cidade:</strong> {order.enderecoEntrega?.cidade}</p>
                    <p><strong>CEP:</strong> {order.enderecoEntrega?.cep}</p>
                </div>

                {/* Informações de pagamento */}
                <div className="mb-4">
                    <h3 className="font-semibold">Pagamento</h3>
                    <p><strong>Forma de Pagamento:</strong> {order.pagamento?.formaPagamento}</p>
                    <p><strong>Status do Pagamento:</strong> {order.pagamento?.status}</p>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button
                        onClick={() => alert("Imprimindo nota fiscal...")}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Imprimir Nota Fiscal
                    </button>
                    <button
                        onClick={() => alert("Cancelando pedido...")}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Cancelar Pedido
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderModal;
