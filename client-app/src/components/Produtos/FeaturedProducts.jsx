import ProductGridItem from './ProductGridItem';

const FeaturedProducts = ({ products }) => (
    <div className="my-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Os mais pedidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {products.slice(0, 4).map((produto) => (
                <ProductGridItem key={produto.id} produto={produto} />
            ))}
        </div>
    </div>
);

export default FeaturedProducts;
