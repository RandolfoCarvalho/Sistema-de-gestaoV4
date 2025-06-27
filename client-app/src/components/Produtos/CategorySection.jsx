import ProductCard from './ProductCard';

const CategorySection = ({ categoryName, products }) => {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        {categoryName}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;