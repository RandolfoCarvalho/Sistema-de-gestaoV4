import { Link } from 'react-router-dom';

const ProductListItem = ({ produto }) => (
  <Link key={produto.id} to={`/product/${produto.id}`} className="block border border-gray-200 rounded-lg p-2 mb-2 bg-white hover:shadow-md">
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <h3 className="text-base font-medium text-gray-700">{produto.nome}</h3>
        <p className="text-xs text-gray-500 mt-1">{produto.descricao}</p>
        <p className="text-base font-medium text-gray-700 mt-2">R$ {produto.precoVenda.toFixed(2)}</p>
      </div>
      <div className="w-24 h-24 flex-shrink-0">
        <img
          src={produto.imagemPrincipalUrl || "/api/placeholder/100/100"}
          alt={produto.nome}
          className="w-full h-full object-cover rounded-xl"
        />
      </div>
    </div>
  </Link>
);
export default ProductListItem;
