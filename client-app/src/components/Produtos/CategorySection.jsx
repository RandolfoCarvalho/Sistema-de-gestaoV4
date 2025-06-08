import ProductListItem from './ProductListItem';

const CategorySection = ({ categoryName, products }) => (
    <div className="mb-1 px-1">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">{categoryName}</h3>
        <div className="space-y-2">
            {products.map((produto) => (
                <ProductListItem key={produto.id} produto={produto} />
            ))}
        </div>
    </div>
);

export default CategorySection;
