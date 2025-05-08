import { Link } from 'react-router-dom';

const ProductGridItem = ({ produto }) => (
    <Link key={produto.id} to={`/product/${produto.id}`} className="block">
        <div className="bg-white rounded-lg overflow-hidden">
            <img
                src={produto.imagemPrincipalUrl || "/api/placeholder/200/200"}
                alt={produto.nome}
                className="w-full h-32 object-cover rounded-xl"
            />
            <div className="p-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">{produto.nome}</h3>
                <p className="text-blue-600 font-bold mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.precoVenda)}
                    </p>
            </div>
        </div>
    </Link>
);

export default ProductGridItem;
