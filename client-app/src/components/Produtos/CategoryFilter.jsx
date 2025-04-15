const CategoryFilter = ({ categories, activeCategory, setActiveCategory }) => (
    <div className="flex space-x-2 pt-[130px] pb-3 overflow-x-auto">
        <button
            onClick={() => setActiveCategory('todos')}
            className={`px-4 py-1.5 rounded-full transition-all ${activeCategory === 'todos' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
            Promoções
        </button>
        {categories.map((cat) => (
            <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${activeCategory === cat.id.toString() ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
                {cat.nome}
            </button>
        ))}
    </div>
);

export default CategoryFilter;
