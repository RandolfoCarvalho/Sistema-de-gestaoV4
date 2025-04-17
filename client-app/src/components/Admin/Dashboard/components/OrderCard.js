import React from 'react';
import { Clock, MapPin, Package, Coffee, User, Info } from 'lucide-react';

const OrderCard = ({ order }) => {
  if (!order) return null;

  const formattedDate = order.dataPedido
    ? new Date(order.dataPedido).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Data não disponível';


    console.log("A ordem: ", order)
  const totalItems = order.itens?.length || 0;

  const endereco = order.enderecoEntrega;
  let enderecoFormatado = null;
  
  if (endereco) {
    const partes = [];
    if (endereco.logradouro) partes.push(endereco.logradouro);
    if (endereco.numero) partes.push(endereco.numero);
    if (endereco.bairro) partes.push(endereco.bairro);
    if (endereco.cidade) partes.push(endereco.cidade);
    
    if (partes.length > 0) {
      enderecoFormatado = partes.join(', ');
    }
  }

  // Formatação do valor total para exibir corretamente em reais
  const valorTotalFormatado = order.valorTotal !== null && order.valorTotal !== undefined
    ? `R$ ${Number(order.valorTotal).toFixed(2).replace('.', ',')}`
    : 'R$ 0,00';

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-4 mb-3 transition-all hover:shadow-md cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(order));
        e.currentTarget.classList.add('opacity-50');
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('opacity-50')}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-gray-800">{order.numero || 'Sem número'}</h4>
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {order.status || 'Status desconhecido'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
        <InfoItem icon={Clock}>{formattedDate}</InfoItem>

        <InfoItem icon={Package}>
          {totalItems} {totalItems === 1 ? 'item' : 'itens'}
        </InfoItem>

        {enderecoFormatado && (
          <InfoItem icon={MapPin} className="col-span-2">
            {enderecoFormatado}
          </InfoItem>
        )}

        <InfoItem icon={Info} className="col-span-2">
          Pagamento: {order.formaPagamento || 'Não informado'}
        </InfoItem>

        <InfoItem icon={Info}>
          Total: {valorTotalFormatado}
        </InfoItem>
      </div>

      {totalItems > 0 && (
        <div className="border-t border-gray-100 pt-2 mt-2">
          <p className="text-xs font-medium text-gray-700 mb-1">Itens do pedido:</p>
          <ul className="text-xs space-y-1">
            {order.itens.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-center gap-1">
                <Coffee size={12} />
                <span className="truncate">
                  {item.quantidade}x {item.produtoId ? `Produto #${item.produtoId}` : 'Produto sem ID'}
                </span>
              </li>
            ))}
            {totalItems > 3 && (
              <li className="text-gray-500 italic">+ {totalItems - 3} mais...</li>
            )}
          </ul>
        </div>
      )}

      {order.observacoes && order.observacoes.trim() !== '' && (
        <div className="mt-2 text-xs text-gray-600 italic">
          <p className="truncate">Obs: {order.observacoes}</p>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon: Icon, children, className = '' }) => (
  <div className={`flex items-center gap-1 ${className}`}>
    <Icon size={12} className="text-gray-400" />
    <span className="truncate">{children}</span>
  </div>
);

export default OrderCard;