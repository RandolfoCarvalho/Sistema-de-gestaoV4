import ProductGridItem from './ProductGridItem';

const FeaturedProducts = ({ products }) => {
  if (!products?.length) return null;
  
  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Os mais pedidos</h2>
        <span className="text-sm text-blue-600 hover:underline cursor-pointer">Ver todos</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {products.slice(0, 6).map((produto) => (
          <ProductGridItem key={produto.id} produto={produto} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;