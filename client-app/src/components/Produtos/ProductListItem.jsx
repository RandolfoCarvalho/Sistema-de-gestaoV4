import { Link } from 'react-router-dom';

const ProductListItem = ({ produto }) => {
  const { id, nome, descricao, precoVenda, imagemPrincipalUrl } = produto;
  
  return (
    <Link 
      to={`/product/${id}`} 
      className="flex items-stretch p-3 border border-gray-100 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200"
    >
      <div className="flex-1 min-w-0 pr-3">
        <h3 className="text-base font-medium text-gray-900 line-clamp-1">{nome}</h3>
        
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 mb-2">{descricao}</p>
        
        <div className="mt-auto">
          <span className="text-base font-semibold text-black-600">
            R$ {precoVenda.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
      
      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={imagemPrincipalUrl || "/api/placeholder/100/100"}
          alt={nome}
          className="w-full h-full object-cover"
        />
      </div>
    </Link>
  );
};

export default ProductListItem;