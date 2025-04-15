const OrderDetailsModal = ({ order, isOpen, onClose }) => {
    const downloadAsXML = () => {
        const createXML = (order) => {
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
            <pedido>
              <id>${order.id}</id>
              <numero>${order.numero}</numero>
              <cliente>${order.nomeCliente}</cliente>
              <status>${order.status}</status>
              <dataCriacao>${order.dataPedido}</dataCriacao>
              <enderecoEntrega>
                <rua>${order.enderecoEntrega}</rua>
                <bairro>${order.bairro}</bairro>
                <cidade>${order.cidade}</cidade>
                <cep>${order.cep}</cep>
                <complemento>${order.complemento}</complemento>
              </enderecoEntrega>
              <formaPagamento>${order.formaPagamento}</formaPagamento>
              <observacoes>${order.observacoes}</observacoes>
              <itens>
                ${order.itens?.map(item => `
                  <item>
                    <nome>${item.nome}</nome>
                    <quantidade>${item.quantidade}</quantidade>
                    <preco>${item.valorTotal}</preco>
                  </item>
                `).join('')}
              </itens>
              <subTotal>${order.subTotal}</subTotal>
              <taxaEntrega>${order.taxaEntrega}</taxaEntrega>
              <valorTotal>${order.valorTotal}</valorTotal>
            </pedido>`;

            const blob = new Blob([xmlContent], { type: 'application/xml' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pedido-${order.numero}.xml`;
            a.click();
            window.URL.revokeObjectURL(url);
        };

        createXML(order);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Pedido #{order.numero}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold">Cliente</h3>
                            <p>{order.nomeCliente}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Status</h3>
                            <p>{order.status}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Telefone</h3>
                            <p>{order.telefoneCliente}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Forma de Pagamento</h3>
                            <p>{order.formaPagamento}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Data do Pedido</h3>
                            <p>{new Date(order.dataPedido).toLocaleString()}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Endereço de Entrega</h3>
                            <p>{order.enderecoEntrega}, {order.bairro}, {order.cidade} - {order.cep}</p>
                            <p>Complemento: {order.complemento}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Itens do Pedido</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-2 text-left">Item</th>
                                    <th className="p-2 text-left">Quantidade</th>
                                    <th className="p-2 text-left">Preço</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.itens?.map((item, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-2">{item.nome}</td>
                                        <td className="p-2">{item.quantidade}</td>
                                        <td className="p-2">R$ {item.valorTotal.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end mt-4">
                        <button
                            onClick={downloadAsXML}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Gerar nota fiscal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
