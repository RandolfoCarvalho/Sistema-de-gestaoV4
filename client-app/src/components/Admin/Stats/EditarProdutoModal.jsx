import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from "@utils/alerts";
import { formatPriceToInvariantBackend } from "@utils/formatters";
import { Loader2 } from 'lucide-react';

// --- COMPONENTES AUXILIARES PARA UM CÓDIGO MAIS LIMPO ---

const commonInputClasses = "w-full rounded-lg border-slate-300 bg-slate-100 shadow-sm text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition";

const FormField = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
        {children}
    </div>
);

const TabButton = ({ label, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-200 ${
            isActive
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
    >
        {label}
    </button>
);

const EditarProdutoModal = ({ produto, modalAberto, setModalAberto, onSave }) => {
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [gruposComplemento, setGruposComplemento] = useState([]);
    const [gruposAdicional, setGruposAdicional] = useState([]);
    const [complementosSelecionados, setComplementosSelecionados] = useState([]);
    const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    useEffect(() => {
        if (!modalAberto) {
            setProdutoEditando(null);
            setActiveTab('info');
            return;
        }

        if (produto) {
            setProdutoEditando({ ...produto });

            const fetchData = async () => {
                try {
                    setLoading(true);
                    const [
                        categoriasRes,
                        gruposComplementoRes, 
                        gruposAdicionalRes,
                        complementosProdutoRes, 
                        adicionaisProdutoRes
                    ] = await Promise.all([
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Categoria/ListarCategoriasPorLojaGestao`),
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Complemento/ListarGrupoComplementos`),
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ListarGrupoAdicionais`),
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Complemento/ObterComplementos/${produto.id}`),
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ObterAdicionais/${produto.id}`)
                    ]);

                    setCategorias(categoriasRes.data || []);
                    setGruposComplemento(gruposComplementoRes.data || []);
                    setGruposAdicional(gruposAdicionalRes.data || []);
                    setComplementosSelecionados(complementosProdutoRes.data || []);
                    setAdicionaisSelecionados(adicionaisProdutoRes.data || []);
                    
                } catch (error) {
                    console.error('Erro ao buscar dados:', error);
                    showError("Erro!", "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
                    setModalAberto(false);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [modalAberto, produto, setModalAberto]);


    // --- FUNÇÕES DE AÇÃO ---
    const handleInputChange = (field, value) => {
        setProdutoEditando(prev => (prev ? { ...prev, [field]: value } : null));
    };

    const salvarEdicao = async () => {
        if (!produtoEditando) return;
        
        try {
            setLoading(true);
            const formData = new FormData();

            formData.append("Id", produtoEditando.id);
            formData.append("Nome", produtoEditando.nome);
            formData.append("PrecoVenda", formatPriceToInvariantBackend(produtoEditando.precoVenda));
            formData.append("PrecoCusto", formatPriceToInvariantBackend(produtoEditando.precoCusto));
            formData.append("Descricao", produtoEditando.descricao || '');
            formData.append("CategoriaId", produtoEditando.categoriaId);
            formData.append("Ativo", produtoEditando.ativo.toString());
            formData.append("EstoqueAtual", produtoEditando.estoqueAtual);
            formData.append("EstoqueMinimo", produtoEditando.estoqueMinimo || 0);
            formData.append("UnidadeMedida", produtoEditando.unidadeMedida || '');

            if (produtoEditando.novaImagem) {
                formData.append("ImagemPrincipalUrl", produtoEditando.novaImagem);
            }
            
            (complementosSelecionados || []).forEach(comp => formData.append('ComplementosIds', comp.id));
            (adicionaisSelecionados || []).forEach(add => formData.append('AdicionaisIds', add.id));

            const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/AtualizarProdutoV2`, formData, { headers: { "Content-Type": "multipart/form-data" } });

            if (onSave) onSave(response.data);
            
            setModalAberto(false);
            showSuccess("Sucesso!", "Produto atualizado com sucesso!");

        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            const errorMessage = error.response?.data?.message || "Ocorreu um erro ao atualizar o produto.";
            showError("Erro!", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!modalAberto || !produtoEditando) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-zoom-in">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Editar Produto</h2>
                    <p className="text-sm text-slate-500 mt-1">{produtoEditando.nome}</p>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <div className="border-b border-slate-200 sticky top-0 bg-white z-10">
                        <div className="px-6 flex items-center space-x-4">
                            <TabButton label="Informações" isActive={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                            <TabButton label="Complementos" isActive={activeTab === 'complementos'} onClick={() => setActiveTab('complementos')} />
                            <TabButton label="Adicionais" isActive={activeTab === 'adicionais'} onClick={() => setActiveTab('adicionais')} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center p-10 h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {activeTab === 'info' && (
                                <div className="space-y-4">
                                    <FormField label="Nome do Produto">
                                        <input type="text" value={produtoEditando.nome} onChange={e => handleInputChange('nome', e.target.value)} className={commonInputClasses} />
                                    </FormField>
                                    
                                    <FormField label="Categoria">
                                        <select
                                            value={produtoEditando.categoriaId}
                                            onChange={e => handleInputChange('categoriaId', parseInt(e.target.value))}
                                            className={commonInputClasses}
                                        >
                                            <option value="">Selecione uma categoria...</option>
                                            {categorias.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                            ))}
                                        </select>
                                    </FormField>

                                    <FormField label="Descrição">
                                        <textarea value={produtoEditando.descricao || ''} onChange={e => handleInputChange('descricao', e.target.value)} rows="3" className={commonInputClasses}></textarea>
                                    </FormField>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField label="Preço de Venda (R$)"><input type="number" step="0.01" value={produtoEditando.precoVenda} onChange={e => handleInputChange('precoVenda', e.target.value)} className={commonInputClasses} /></FormField>
                                        <FormField label="Preço de Custo (R$)"><input type="number" step="0.01" value={produtoEditando.precoCusto} onChange={e => handleInputChange('precoCusto', e.target.value)} className={commonInputClasses} /></FormField>
                                        <FormField label="Estoque Atual"><input type="number" value={produtoEditando.estoqueAtual} onChange={e => handleInputChange('estoqueAtual', parseInt(e.target.value))} className={commonInputClasses} /></FormField>
                                        <FormField label="Estoque Mínimo"><input type="number" value={produtoEditando.estoqueMinimo} onChange={e => handleInputChange('estoqueMinimo', parseInt(e.target.value))} className={commonInputClasses} /></FormField>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-grow"><FormField label="Alterar Imagem"><input type="file" accept="image/*" onChange={e => handleInputChange('novaImagem', e.target.files[0])} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/></FormField></div>
                                        {produtoEditando.imagemPrincipalUrl && <img src={produtoEditando.imagemPrincipalUrl} alt={produtoEditando.nome} className="w-16 h-16 rounded-lg object-cover" />}
                                    </div>

                                    <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer pt-2">
                                        <input type="checkbox" checked={produtoEditando.ativo} onChange={e => handleInputChange('ativo', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Produto Ativo (Visível no cardápio)</span>
                                    </label>
                                </div>
                            )}
                            {/* O restante do conteúdo das abas (complementos/adicionais) será renderizado aqui */}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    <button onClick={() => setModalAberto(false)} disabled={loading} className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">Cancelar</button>
                    <button onClick={salvarEdicao} disabled={loading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors flex items-center">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditarProdutoModal;