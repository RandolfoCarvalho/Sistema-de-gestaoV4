const CategoryPillsFilter = ({ categorias, categoriaSelecionada, onSelectCategory }) => {
    
    const basePillClasses = "px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105";
    const activePillClasses = "bg-sky-600 text-white border-sky-600 shadow-md";
    const inactivePillClasses = "bg-white text-slate-700 border-slate-300 hover:bg-sky-50 hover:border-sky-400 focus:ring-sky-500";

    return (
        <div className="mb-8 sm:mb-10 flex justify-center items-center flex-wrap gap-2 sm:gap-3 px-4">
            <button
                onClick={() => onSelectCategory('todas')}
                className={`${basePillClasses} ${categoriaSelecionada === 'todas' ? activePillClasses : inactivePillClasses}`}
                aria-pressed={categoriaSelecionada === 'todas'}
            >
                Todas as Categorias
            </button>
            {categorias.map(categoria => (
                <button
                    key={categoria.id}
                    onClick={() => onSelectCategory(String(categoria.id))}
                    className={`${basePillClasses} ${
                        String(categoria.id) === categoriaSelecionada ? activePillClasses : inactivePillClasses
                    }`}
                    aria-pressed={String(categoria.id) === categoriaSelecionada}
                >
                    {categoria.nome}
                </button>
            ))}
        </div>
    );
};

export default CategoryPillsFilter;