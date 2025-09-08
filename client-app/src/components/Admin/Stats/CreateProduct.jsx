import React, { useState, useEffect } from 'react';
import { Camera, Package, Tag, Layers, Check, X, Plus, Loader2, Pencil, XCircle } from 'lucide-react';
import axios from 'axios';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
const CreateProductForm = () => {
    const [formData, setFormData] = useState({
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
    const [imagem, setImagem] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // --- ESTADOS DE DADOS (CARREGADOS DA API) ---
    const [categorias, setCategorias] = useState([]);
    const [complementos, setComplementos] = useState([]);
    const [gruposAdicionais, setGruposAdicionais] = useState([]);
    
    // --- ESTADOS DE CONTROLE DA UI ---
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // --- ESTADOS PARA CRIAÇÃO DE CATEGORIA INLINE ---
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [categoryError, setCategoryError] = useState(null);

    // --- ESTADOS PARA EDIÇÃO DE CATEGORIA (MODAL) ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editedCategoryName, setEditedCategoryName] = useState('');
    const [isCategoryUpdateLoading, setIsCategoryUpdateLoading] = useState(false);
    const [categoryUpdateError, setCategoryUpdateError] = useState(null);
    
    // --- TRADUÇÃO DE MENSAGENS DE ERRO ---
    const errorMessages = {
        "The Nome field is required.": "O nome é obrigatório.",
        "The value '' is invalid.": "O valor não pode estar vazio.",
        "The PrecoCusto field is required.": "O preço de custo é obrigatório.",
        "The PrecoVenda field is required.": "O preço de venda é obrigatório.",
        "The CategoriaId field is required.": "A categoria deve ser selecionada.",
        "The EstoqueAtual field is required.": "O estoque atual é obrigatório.",
        "The EstoqueMinimo field is required.": "O estoque mínimo é obrigatório."
    };

    // --- EFEITO PARA CARREGAR DADOS INICIAIS ---
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

    // --- FUNÇÕES DE MANIPULAÇÃO DE IMAGEM ---
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
            reader.onloadend = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };
    
    const removeImage = () => {
        setImagem(null);
        setPreviewUrl('');
    }

    // --- FUNÇÕES DE MANIPULAÇÃO DE CATEGORIA ---
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setCategoryError("O nome da categoria não pode ser vazio.");
            return;
        }
        setIsCategoryLoading(true);
        setCategoryError(null);
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Categoria/CriarCategoria`, { nome: newCategoryName }, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            const novaCategoria = response.data;
            setCategorias(prev => [...prev, novaCategoria]);
            setFormData({ ...formData, categoriaId: novaCategoria.id });
            setIsCreatingCategory(false);
            setNewCategoryName('');
        } catch (err) {
            setCategoryError("Falha ao criar categoria. Talvez já exista.");
        } finally {
            setIsCategoryLoading(false);
        }
    };

    const handleOpenEditModal = () => {
        const categoryToEdit = categorias.find(c => c.id === formData.categoriaId);
        if (categoryToEdit) {
            setEditingCategory(categoryToEdit);
            setEditedCategoryName(categoryToEdit.nome);
            setIsEditModalOpen(true);
            setCategoryUpdateError(null);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editedCategoryName.trim() || !editingCategory) {
            setCategoryUpdateError("O nome não pode ser vazio.");
            return;
        }
        setIsCategoryUpdateLoading(true);
        setCategoryUpdateError(null);
        try {
            const payload = { id: editingCategory.id, nome: editedCategoryName };
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/1.0/Categoria/AtualizarCategoria`, payload, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            const updatedCategory = response.data;
            setCategorias(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
            setIsEditModalOpen(false);
            setEditingCategory(null);
        } catch (err) {
            setCategoryUpdateError("Falha ao atualizar. Tente novamente.");
        } finally {
            setIsCategoryUpdateLoading(false);
        }
    };

    // --- FUNÇÃO DE ENVIO DO FORMULÁRIO PRINCIPAL ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

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
            
            formData.gruposComplementosIds.forEach(id => formDataToSend.append('GruposComplementosIds', id));
            formData.gruposAdicionaisIds.forEach(id => formDataToSend.append('GrupoAdicionalIds', id));
            
            if (imagem) {
                formDataToSend.append('imagemPrincipalUrl', imagem);
            }

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/CriarProduto`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            
            if (response.data) {
                setSuccess('Produto criado com sucesso!');
                // Resetar o formulário
                setFormData({ nome: '', descricao: '', precoCusto: '', precoVenda: '', estoqueAtual: '', estoqueMinimo: '', unidadeMedida: '', categoriaId: '', gruposComplementosIds: [], gruposAdicionaisIds: [] });
                removeImage();
            }
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                let errorMessage = 'Erro ao criar produto:';
                if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(field => {
                        errorData.errors[field].forEach((message) => {
                            errorMessage += `\n- ${errorMessages[message] || message}`;
                        });
                    });
                } else {
                    errorMessage += `\n${JSON.stringify(errorData)}`;
                }
                setError(errorMessage);
            } else {
                setError('Erro ao criar produto. Verifique os dados e tente novamente.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERIZAÇÃO DO MODAL DE EDIÇÃO ---
    const renderEditCategoryModal = () => {
        if (!isEditModalOpen) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Editar Categoria</h3>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Nome da Categoria</label>
                        <input type="text" value={editedCategoryName} onChange={(e) => setEditedCategoryName(e.target.value)} className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200" />
                    </div>
                    {categoryUpdateError && <p className="text-sm text-red-600 mt-2">{categoryUpdateError}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300">Cancelar</button>
                        <button type="button" onClick={handleUpdateCategory} disabled={isCategoryUpdateLoading} className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-blue-300 flex items-center">
                            {isCategoryUpdateLoading && <Loader2 size={16} className="animate-spin mr-2" />} Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- RENDERIZAÇÃO PRINCIPAL ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }
    
    return (
        <>
            {renderEditCategoryModal()}
            <form onSubmit={handleSubmit} className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Novo Item no Cardápio</h1>
                    <p className="text-sm text-gray-500 mt-1">Preencha as informações do produto de forma rápida e organizada.</p>
                </header>

                {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md whitespace-pre-wrap"><p className="font-semibold">Ocorreu um erro</p><p className="text-sm">{error}</p></div>}
                {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md"><p className="font-semibold">{success}</p></div>}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4"><Package size={20} className="inline-block mr-2" />Informações Básicas</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="nome" className="block text-sm font-medium text-gray-600 mb-1">Nome do Produto *</label>
                                    <input type="text" id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Ex: Hambúrguer Artesanal" required />
                                </div>
                                <div>
                                    <label htmlFor="descricao" className="block text-sm font-medium text-gray-600 mb-1">Descrição</label>
                                    <textarea id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows="4" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Descreva os detalhes, ingredientes, etc."></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4"><Tag size={20} className="inline-block mr-2" />Preço e Estoque</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label htmlFor="precoCusto" className="block text-sm font-medium text-gray-600 mb-1">Preço de Custo (R$) *</label>
                                    <input type="number" id="precoCusto" value={formData.precoCusto} onChange={(e) => setFormData({ ...formData, precoCusto: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" step="0.01" required />
                                </div>
                                <div>
                                    <label htmlFor="precoVenda" className="block text-sm font-medium text-gray-600 mb-1">Preço de Venda (R$) *</label>
                                    <input type="number" id="precoVenda" value={formData.precoVenda} onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" step="0.01" required />
                                </div>
                                <div>
                                    <label htmlFor="estoqueAtual" className="block text-sm font-medium text-gray-600 mb-1">Estoque Atual *</label>
                                    <input type="number" id="estoqueAtual" value={formData.estoqueAtual} onChange={(e) => setFormData({ ...formData, estoqueAtual: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" required />
                                </div>
                                <div>
                                    <label htmlFor="estoqueMinimo" className="block text-sm font-medium text-gray-600 mb-1">Estoque Mínimo *</label>
                                    <input type="number" id="estoqueMinimo" value={formData.estoqueMinimo} onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" required />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="unidadeMedida" className="block text-sm font-medium text-gray-600 mb-1">Unidade de Medida</label>
                                    <select id="unidadeMedida" value={formData.unidadeMedida} onChange={(e) => setFormData({ ...formData, unidadeMedida: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                                        <option value="">Selecione...</option><option value="UN">Unidade</option><option value="KG">Quilograma</option><option value="L">Litro</option><option value="CX">Caixa</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4"><Camera size={20} className="inline-block mr-2" />Mídia do Produto</h2>
                            {previewUrl ? (
                                <div className="relative group">
                                    <img src={previewUrl} alt="Prévia" className="w-full h-auto rounded-md object-cover" />
                                    <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XCircle className="h-6 w-6 text-red-600" />
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor="file-upload" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                        <Camera className="w-10 h-10 mb-3 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                        <p className="text-xs text-gray-500">PNG, JPG ou WEBP</p>
                                    </div>
                                    <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImagemChange(e.target.files[0])} />
                                </label>
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4"><Layers size={20} className="inline-block mr-2" />Organização</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-600 mb-1">Categoria *</label>
                                    <select id="categoriaId" value={formData.categoriaId} onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value ? parseInt(e.target.value) : '' })} className="w-full p-2 border border-gray-300 rounded-md bg-white" required>
                                        <option value="" disabled>Selecione...</option>
                                        {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                                    </select>
                                    <div className="mt-2 space-x-4">
                                        {!isCreatingCategory && <button type="button" onClick={() => { setIsCreatingCategory(true); setCategoryError(null); }} className="flex items-center text-sm text-blue-600 hover:text-blue-800"><Plus size={16} className="mr-1" /> Criar nova</button>}
                                        {formData.categoriaId && !isCreatingCategory && <button type="button" onClick={handleOpenEditModal} className="flex items-center text-sm text-gray-600 hover:text-gray-800"><Pencil size={14} className="mr-1" /> Editar</button>}
                                    </div>
                                    {isCreatingCategory && (
                                        <div className="p-3 mt-2 bg-gray-50 rounded-md border border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <input type="text" placeholder="Nome da categoria" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow w-full rounded-md border-gray-300 text-sm" />
                                                <button type="button" onClick={handleCreateCategory} disabled={isCategoryLoading || !newCategoryName} className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300">{isCategoryLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}</button>
                                                <button type="button" onClick={() => setIsCreatingCategory(false)} className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"><X size={16} /></button>
                                            </div>
                                            {categoryError && <p className="text-xs text-red-500 mt-1">{categoryError}</p>}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <MultiSelectDropdown
                                        label="Grupos de Complementos"
                                        items={complementos}
                                        selectedIds={formData.gruposComplementosIds}
                                        onChange={(selectedIds) => 
                                            setFormData(prev => ({ ...prev, gruposComplementosIds: selectedIds }))
                                        }
                                    />
                                </div>

                                <div className="mt-4">
                                    <MultiSelectDropdown
                                        label="Grupos de Adicionais"
                                        items={gruposAdicionais}
                                        selectedIds={formData.gruposAdicionaisIds}
                                        onChange={(selectedIds) => 
                                            setFormData(prev => ({ ...prev, gruposAdicionaisIds: selectedIds }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <footer className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
                    <button type="button" className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Descartar</button>
                    <button type="submit" disabled={isSubmitting} className="py-2 px-8 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                </footer>
            </form>
        </>
    );
};

export default CreateProductForm;