const CategoryFilter = ({ categories, activeCategory, setActiveCategory }) => (
    <div
        className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-3 px-4 md:px-6"
    >
        {/* Botão Fixo para "Promoções" ou "Todos" */}
        <FilterButton
            label="Promoções"
            isActive={activeCategory === 'todos'}
            onClick={() => setActiveCategory('todos')}
        />

        {/* Mapeia as categorias recebidas */}
        {categories.map((cat) => (
            <FilterButton
                key={cat.id}
                label={cat.nome}
                isActive={activeCategory === cat.id.toString()}
                onClick={() => setActiveCategory(cat.id.toString())}
            />
        ))}
    </div>
);

// Componente auxiliar para o botão, mantendo o código principal limpo (DRY)
const FilterButton = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`
            shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold 
            transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:ring-opacity-50
            ${isActive
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
            }
        `}
    >
        {label}
    </button>
);

export default CategoryFilter;