import { React, useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Camera, Package, Tag, Layers, Check, X, Plus, Loader2, Pencil  } from 'lucide-react';
import { formatPriceToInvariantBackend } from '@utils/formatters';
import axios from 'axios';

const CreateProductForm = () => {
    // ... (estados existentes)
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        precoCusto: '',
        precoVenda: '',
        estoqueAtual: '',
        estoqueMinimo: '',
        unidadeMedida: '',
        categoriaId: '',
        gruposComplementosIds: [], // Inicializado para evitar `undefined`
        gruposAdicionaisIds: [] // Inicializado para evitar `undefined`
    });


    // 1. Estilos centralizados para todos os inputs, textareas e selects
    const commonInputClasses = "w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50";

    const FormField = ({ label, name, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </label>
        {React.cloneElement(children, { id: name, name: name, className: children.props.className || commonInputClasses })}
    </div>
    );

    const [imagem, setImagem] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [complementos, setComplementos] = useState([]);
    const [gruposAdicionais, setGruposAdicionais] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // --- NOVOS ESTADOS PARA CRIAÇÃO DE CATEGORIA ---
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [categoryError, setCategoryError] = useState(null);


    // --- NOVO: ESTADOS PARA EDIÇÃO DE CATEGORIA (MODAL) ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // Guarda {id, nome} da categoria em edição
    const [editedCategoryName, setEditedCategoryName] = useState(''); // Guarda o valor do input no modal
    const [isCategoryUpdateLoading, setIsCategoryUpdateLoading] = useState(false);
    const [categoryUpdateError, setCategoryUpdateError] = useState(null);

    // ---------------------------------------------

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [categoriasResponse, complementosResponse, gruposAdicionaisResponse] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Categoria/ListarCategoriasPorLojaGestao`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Complemento/ListarGrupoComplementos`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ListarGrupoAdicionais`)
                ]);
                setCategorias(categoriasResponse.data || []);
                setComplementos(complementosResponse.data || []);
                setGruposAdicionais(gruposAdicionaisResponse.data || []);
            } catch (error) {
                setError('Erro ao carregar dados. Por favor, tente novamente.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const steps = [
        { number: 1, title: "Informações Básicas", icon: Package },
        { number: 2, title: "Preços e Estoque", icon: Tag },
        { number: 3, title: "Categoria e Extras", icon: Layers },
        { number: 4, title: "Confirmação", icon: Check }
    ];

    // ... (funções handleDrag, handleDrop, handleImagemChange, errorMessages existentes)
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImagemChange(e.dataTransfer.files[0]);
        }
    };

    const handleImagemChange = (file) => {
        if (file) {
            setImagem(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const errorMessages = {
        "The Nome field is required.": "O nome é obrigatório.",
        "The value '' is invalid.": "O valor não pode estar vazio.",
        "The PrecoCusto field is required.": "O preço de custo é obrigatório.",
        "The PrecoVenda field is required.": "O preço de venda é obrigatório.",
        "The CategoriaId field is required.": "A categoria deve ser selecionada.",
        "The EstoqueAtual field is required.": "O estoque atual é obrigatório.",
        "The EstoqueMinimo field is required.": "O estoque mínimo é obrigatório."
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('nome', formData.nome);
            formDataToSend.append('descricao', formData.descricao || '');
            formDataToSend.append('categoriaId', formData.categoriaId);
            formDataToSend.append('precoCusto', parseFloat(formData.precoCusto).toFixed(2));
            formDataToSend.append('precoVenda', parseFloat(formData.precoVenda).toFixed(2));
            formDataToSend.append('estoqueAtual', formData.estoqueAtual);
            formDataToSend.append('estoqueMinimo', formData.estoqueMinimo);
            formDataToSend.append('unidadeMedida', formData.unidadeMedida || '');

            // Grupos são opcionais. Se o array estiver vazio, o backend deve aceitar.
            // O `|| []` garante que um array vazio seja enviado se nada for selecionado.
            formData.gruposComplementosIds.forEach(id => {
                formDataToSend.append('GruposComplementosIds', id);
            });
            
            formData.gruposAdicionaisIds.forEach(id => {
                formDataToSend.append('GrupoAdicionalIds', id);
            });
            
            if (imagem) {
                formDataToSend.append('imagemPrincipalUrl', imagem);
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/Produto/CriarProduto`,
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            if (response.data) {
                setSuccess('Produto criado com sucesso!');
                setFormData({
                    nome: '',
                    descricao: '',
                    precoCusto: '',
                    precoVenda: '',
                    estoqueAtual: '',
                    estoqueMinimo: '',
                    unidadeMedida: '',
                    categoriaId: '',
                    gruposComplementosIds: [],
                    gruposAdicionaisIds: []
                });
                setImagem(null);
                setPreviewUrl('');
                setCurrentStep(1); // Opcional: voltar para o início após o sucesso
            }
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                let errorMessage = 'Erro ao criar produto:';
                if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(field => {
                        const fieldErrors = errorData.errors[field];
                        fieldErrors.forEach((message) => {
                            const translatedMessage = errorMessages[message] || message;
                            errorMessage += `\n- ${field}: ${translatedMessage}`;
                        });
                    });
                } else {
                    errorMessage += `\n${JSON.stringify(errorData)}`;
                }
                errorMessage += '\nSolucione os erros e tente novamente!';
                setError(errorMessage);
            } else {
                setError('Erro ao criar produto. Por favor, verifique os dados e tente novamente.');
            }
        }
    };
    
    // --- NOVA FUNÇÃO PARA CRIAR CATEGORIA ---
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setCategoryError("O nome da categoria não pode ser vazio.");
            return;
        }

        setIsCategoryLoading(true);
        setCategoryError(null);

        try {
            // Assumindo que o endpoint e o payload são estes. Ajuste se necessário.
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/Categoria/CriarCategoria`,
                { nome: newCategoryName },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const novaCategoria = response.data; // Espera-se que a API retorne a nova categoria { id, nome }
            
            // Adiciona a nova categoria à lista existente
            setCategorias(prevCategorias => [...prevCategorias, novaCategoria]);
            
            // Seleciona automaticamente a categoria recém-criada
            setFormData({ ...formData, categoriaId: novaCategoria.id });
            
            // Reseta os campos do formulário de nova categoria
            setIsCreatingCategory(false);
            setNewCategoryName('');

        } catch (err) {
            setCategoryError("Falha ao criar categoria. Talvez já exista.");
            console.error("Erro ao criar categoria:", err);
        } finally {
            setIsCategoryLoading(false);
        }
    };

    // --- NOVO: FUNÇÃO PARA ABRIR O MODAL DE EDIÇÃO ---
    const handleOpenEditModal = () => {
        const categoryToEdit = categorias.find(c => c.id === formData.categoriaId);
        if (categoryToEdit) {
            setEditingCategory(categoryToEdit);
            setEditedCategoryName(categoryToEdit.nome);
            setIsEditModalOpen(true);
            setCategoryUpdateError(null); 
        }
    };

    // --- NOVO: FUNÇÃO PARA ATUALIZAR A CATEGORIA ---
    const handleUpdateCategory = async () => {
        if (!editedCategoryName.trim() || !editingCategory) {
            setCategoryUpdateError("O nome não pode ser vazio.");
            return;
        }

        setIsCategoryUpdateLoading(true);
        setCategoryUpdateError(null);

        try {
            const payload = {
                id: editingCategory.id,
                nome: editedCategoryName
            };
            
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/1.0/Categoria/AtualizarCategoria`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const updatedCategory = response.data;

            // Atualiza a lista de categorias no estado
            setCategorias(prevCategorias =>
                prevCategorias.map(cat =>
                    cat.id === updatedCategory.id ? updatedCategory : cat
                )
            );
            
            // Fecha o modal e reseta os estados
            setIsEditModalOpen(false);
            setEditingCategory(null);

        } catch (err) {
            setCategoryUpdateError("Falha ao atualizar. Tente novamente.");
            console.error("Erro ao atualizar categoria:", err);
        } finally {
            setIsCategoryUpdateLoading(false);
        }
    };

    // --- NOVO: COMPONENTE DO MODAL DE EDIÇÃO ---
    const renderEditCategoryModal = () => {
        if (!isEditModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Editar Categoria</h3>
                    
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Nome da Categoria
                        </label>
                        <input
                            type="text"
                            value={editedCategoryName}
                            onChange={(e) => setEditedCategoryName(e.target.value)}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                        />
                    </div>
                    
                    {categoryUpdateError && (
                        <p className="text-sm text-red-600 mt-2">{categoryUpdateError}</p>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateCategory}
                            disabled={isCategoryUpdateLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-blue-300 flex items-center"
                        >
                            {isCategoryUpdateLoading && <Loader2 size={16} className="animate-spin mr-2" />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    const renderStep1 = () => (
        // ... (código do renderStep1 sem alterações)
        <div className="space-y-4">
        <div className="relative">
            <div
                className={`border border-dashed rounded-md p-6 text-center ${
                    dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                } transition-colors duration-200 ease-in-out`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {previewUrl ? (
                    <div className="relative inline-block">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-40 w-auto rounded-md mx-auto"
                        />
                        <button
                            onClick={() => {
                                setImagem(null);
                                setPreviewUrl('');
                            }}
                            className="absolute -top-2 -right-2 bg-red-400 text-white rounded-full p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div>
                        <Camera className="mx-auto h-10 w-10 text-gray-300" />
                        <div className="mt-2">
                            <label className="cursor-pointer">
                                <span className="text-sm text-gray-500">
                                    Arraste uma imagem ou clique para selecionar
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImagemChange(e.target.files[0])}
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="grid gap-4">
            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Nome do Produto
                </label>
                <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                    placeholder="Ex: Hambúrguer Artesanal"
                />
            </div>

            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Descrição
                </label>
                <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                    placeholder="Descreva os detalhes do seu produto..."
                />
            </div>
        </div>
    </div>
    );
    
    const renderStep2 = () => (
        // ... (código do renderStep2 sem alterações)
        <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Preços</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Preço de Custo (R$)
          </label>
          <input
            type="number"
            name="precoCusto"
            value={formData.precoCusto}
            onChange={(e) =>
              setFormData({
                ...formData,
                precoCusto: formatPriceToInvariantBackend(e.target.value),
              })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Preço de Venda (R$)
          </label>
          <input
            type="number"
            name="precoVenda"
            value={formData.precoVenda}
            onChange={(e) =>
              setFormData({
                ...formData,
                precoVenda: formatPriceToInvariantBackend(e.target.value),
              })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
            step="0.01"
          />
          {formData.precoCusto && formData.precoVenda && (
            <div className="mt-1 text-xs">
              <span
                className={`font-medium ${
                  formData.precoVenda - formData.precoCusto > 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                Margem:{' '}
                {(
                  ((formData.precoVenda - formData.precoCusto) /
                    formData.precoCusto) *
                  100
                ).toFixed(2)}
                %
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Estoque</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Estoque Atual
          </label>
          <input
            type="number"
            name="estoqueAtual"
            value={formData.estoqueAtual}
            onChange={(e) =>
              setFormData({ ...formData, estoqueAtual: e.target.value })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Estoque Mínimo
          </label>
          <input
            type="number"
            name="estoqueMinimo"
            value={formData.estoqueMinimo}
            onChange={(e) =>
              setFormData({ ...formData, estoqueMinimo: e.target.value })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Unidade de Medida
          </label>
          <select
            name="unidadeMedida"
            value={formData.unidadeMedida}
            onChange={(e) =>
              setFormData({ ...formData, unidadeMedida: e.target.value })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
          >
            <option value="">Selecione...</option>
            <option value="UN">Unidade</option>
            <option value="KG">Quilograma</option>
            <option value="L">Litro</option>
            <option value="CX">Caixa</option>
          </select>
        </div>
      </div>
    </div>
  </div>
    );
    
    // --- renderStep3 MODIFICADO ---
    const renderStep3 = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Categoria
                </label>
                <select
                    name="categoriaId"
                    value={formData.categoriaId}
                    onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : '';
                        setFormData({ ...formData, categoriaId: value });
                    }}
                    className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                >
                    <option value="">Selecione uma categoria...</option>
                    {categorias.map(categoria => (
                        <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                        </option>
                    ))}
                </select>

                <div className="mt-2">
                    {!isCreatingCategory ? (
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => { setIsCreatingCategory(true); setCategoryError(null); }}
                                className="flex items-center text-sm text-blue-500 hover:text-blue-700"
                            >
                                <Plus size={16} className="mr-1" />
                                Criar nova categoria
                            </button>

                            {/* --- NOVO: Botão de editar --- */}
                            {formData.categoriaId && (
                                <button
                                    type="button"
                                    onClick={handleOpenEditModal}
                                    className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                                >
                                    <Pencil size={14} className="mr-1" />
                                    Editar categoria
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Nome da nova categoria"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="flex-grow w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateCategory}
                                    disabled={isCategoryLoading || !newCategoryName}
                                    className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300"
                                >
                                    {isCategoryLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingCategory(false)}
                                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            {categoryError && <p className="text-xs text-red-500 mt-1">{categoryError}</p>}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">
                        Grupos de Complementos (Opcional)
                    </label>
                    <div className="border border-gray-100 rounded-md max-h-40 overflow-y-auto">
                        {complementos.map(grupo => (
                            <div key={grupo.id}>
                                <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={formData.gruposComplementosIds.includes(grupo.id)}
                                        onChange={(e) => {
                                            const newGrupos = e.target.checked
                                                ? [...formData.gruposComplementosIds, grupo.id]
                                                : formData.gruposComplementosIds.filter(id => id !== grupo.id);
                                            setFormData({ ...formData, gruposComplementosIds: newGrupos });
                                        }}
                                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-400 mr-2"
                                    />
                                    <span>{grupo.nome}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">
                        Grupos de Adicionais (Opcional)
                    </label>
                    <div className="border border-gray-100 rounded-md max-h-40 overflow-y-auto">
                        {gruposAdicionais.map(grupo => (
                            <label
                                key={grupo.id}
                                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.gruposAdicionaisIds.includes(grupo.id)}
                                    onChange={(e) => {
                                        const newGrupos = e.target.checked
                                            ? [...formData.gruposAdicionaisIds, grupo.id]
                                            : formData.gruposAdicionaisIds.filter(id => id !== grupo.id);
                                        setFormData({ ...formData, gruposAdicionaisIds: newGrupos });
                                    }}
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-400 mr-2"
                                />
                                <span>{grupo.nome} {grupo.limiteSelecao ? `(Limite: ${grupo.limiteSelecao})` : ''}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
    // ... (código do renderStep4 com uma pequena correção para encontrar a categoria)
     <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-blue-700 mb-1">Revisão do Produto</h3>
            <p className="text-xs text-blue-600">Confira todas as informações antes de finalizar</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400">Informações Básicas</h4>
                    <p className="text-base font-medium">{formData.nome || "—"}</p>
                    <p className="text-xs text-gray-500 mt-1">{formData.descricao || "Sem descrição"}</p>
                </div>
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400">Preços</h4>
                    <p className="text-sm">Custo: R$ {formData.precoCusto || "0,00"}</p>
                    <p className="text-sm">Venda: R$ {formData.precoVenda || "0,00"}</p>
                </div>
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400">Estoque</h4>
                    <p className="text-sm">Atual: {formData.estoqueAtual || "0"} {formData.unidadeMedida || ""}</p>
                    <p className="text-sm">Mínimo: {formData.estoqueMinimo || "0"} {formData.unidadeMedida || ""}</p>
                </div>
            </div>
            <div className="space-y-3">
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400">Categoria</h4>
                    <p className="text-sm">{categorias.find(c => c.id === formData.categoriaId)?.nome || "Não selecionada"}</p>
                </div>
                {formData.gruposComplementosIds?.length > 0 && (
                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-gray-400">Grupos de Complementos</h4>
                        <ul className="text-sm space-y-1 mt-1">
                            {formData.gruposComplementosIds.map(id => (
                                <li key={id} className="flex items-center">
                                    <div className="h-1 w-1 bg-gray-400 rounded-full mr-2"></div>
                                    {complementos.find(g => g.id === id)?.nome}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {formData.gruposAdicionaisIds?.length > 0 && (
                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-gray-400">Grupos de Adicionais</h4>
                        <ul className="text-sm space-y-1 mt-1">
                            {formData.gruposAdicionaisIds.map(id => (
                                <li key={id} className="flex items-center">
                                    <div className="h-1 w-1 bg-gray-400 rounded-full mr-2"></div>
                                    {gruposAdicionais.find(g => g.id === id)?.nome}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
        {/* Botão Criar Produto */}
        <div className="mt-6 flex justify-end">
            <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 text-sm"
            >
                Criar Produto
            </button>
        </div>
    </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    // ... (Restante do componente JSX sem alterações)
    return (
    <div className=" my-6 px-4">
        {/* --- NOVO: Renderiza o modal de edição aqui --- */}
            {renderEditCategoryModal()}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100">
                <h2 className="text-xl font-medium text-gray-800">Novo Item no Cardápio</h2>
                <p className="mt-1 text-xs text-gray-400">
                    Preencha as informações do produto em etapas simples
                </p>
            </div>

            {/* Progress Steps */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <div key={step.number} className="flex items-center">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full 
                                    ${currentStep >= step.number
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-400'}`}
                            >
                                <step.icon size={16} />
                            </div>
                            <div className="ml-2 hidden sm:block">
                                <p className="text-xs font-medium text-gray-700">{step.title}</p>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="mx-2 hidden sm:block">
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <form className="p-5" onSubmit={handleSubmit}>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-md text-sm">
                        <p className="text-red-600 whitespace-pre-wrap">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-md text-sm">
                        <div className="flex">
                            <Check className="h-4 w-4 text-green-500" />
                            <p className="ml-2 text-green-600">{success}</p>
                        </div>
                    </div>
                )}
                <div className="space-y-4">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                </div>

                <div className="mt-6 flex justify-between">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                            Voltar
                        </button>
                    )}

                    {currentStep < 4 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep((prevStep) => prevStep + 1)}
                            className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                        >
                            Próximo
                        </button>
                    )}
                </div>
            </form>
        </div>
    </div>
    )
}

export default CreateProductForm;