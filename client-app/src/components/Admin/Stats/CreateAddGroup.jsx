import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { confirmAction, showSuccess, showError } from '@utils/alerts'; // Ajuste o caminho se necessário
import api from '../../../axiosConfig'; // Ajuste o caminho se necessário
import { Plus, Trash2, Save, X, Loader2, List, ChevronsRight, Edit, Info, AlertTriangle } from 'lucide-react';

const GerenciamentoAdicionais = () => {
    // --- ESTADOS GERAIS ---
    const [gruposAdicionais, setGruposAdicionais] = useState([]);
    const [grupoSelecionadoId, setGrupoSelecionadoId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // --- ESTADOS DE CONTROLE DE UI ---
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // --- ESTADOS DO FORMULÁRIO UNIFICADO ---
    const [formData, setFormData] = useState({
        id: null,
        nome: '',
        ativo: true,
        limiteSelecao: '',
        adicionais: []
    });
    const [novoAdicional, setNovoAdicional] = useState({ nome: '', precoBase: '', descricao: '', maximoPorProduto: '', ativo: true });

    // --- FUNÇÕES DE API E DADOS ---
    const buscarGruposAdicionais = async () => {
        setIsLoadingList(true);
        setError(null);
        try {
            const response = await api.get('/api/1.0/Adicional/ListarGrupoAdicionaisAtivosEInativos');
            setGruposAdicionais(response.data || []);
        } catch (err) {
            console.error('Erro ao buscar grupos:', err);
            setError('Falha ao carregar os grupos de adicionais.');
        } finally {
            setIsLoadingList(false);
        }
    };

    const buscarDetalhesDoGrupo = async (id) => {
        if (!id) return;
        setIsLoadingDetails(true);
        setError(null);
        setIsCreating(false);
        try {
            const response = await api.get(`/api/1.0/Adicional/ListarGrupoAdicionais/${id}`);
            const grupo = response.data;
            setFormData({
                id: grupo.id,
                nome: grupo.nome || '',
                ativo: grupo.ativo,
                limiteSelecao: grupo.limiteSelecao || '',
                adicionais: grupo.adicionais.map(ad => ({
                    id: ad.id,
                    nome: ad.nome || '',
                    precoBase: ad.precoBase.toString(),
                    descricao: ad.descricao || '',
                    maximoPorProduto: ad.maximoPorProduto ? ad.maximoPorProduto.toString() : '',
                    ativo: ad.ativo
                })) || []
            });
        } catch (err) {
            console.error('Erro ao buscar detalhes do grupo:', err);
            showError("Erro", "Falha ao carregar os detalhes do grupo.");
            setGrupoSelecionadoId(null);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    useEffect(() => {
        buscarGruposAdicionais();
    }, []);

    useEffect(() => {
        if (grupoSelecionadoId) {
            buscarDetalhesDoGrupo(grupoSelecionadoId);
        } else {
            // Limpa o formulário se nada estiver selecionado
            setFormData({ id: null, nome: '', ativo: true, limiteSelecao: '', adicionais: [] });
        }
    }, [grupoSelecionadoId]);

    // --- HANDLERS E MANIPULAÇÃO DO FORMULÁRIO ---
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAdicionalChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const novosAdicionais = [...formData.adicionais];
        novosAdicionais[index][name] = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, adicionais: novosAdicionais }));
    };

    const handleNovoAdicionalChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNovoAdicional(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const adicionarItemAdicional = () => {
        if (novoAdicional.nome && novoAdicional.precoBase) {
            setFormData(prev => ({
                ...prev,
                adicionais: [...prev.adicionais, { ...novoAdicional, id: 0 }]
            }));
            setNovoAdicional({ nome: '', precoBase: '', descricao: '', maximoPorProduto: '', ativo: true });
        } else {
            showError("Campos incompletos", "Preencha Nome e Preço para adicionar um item.");
        }
    };
    
    const removerItemAdicionalLocal = (index) => {
        setFormData(prev => ({
            ...prev,
            adicionais: prev.adicionais.filter((_, i) => i !== index)
        }));
    };

    const iniciarCriacao = () => {
        setGrupoSelecionadoId(null);
        setIsCreating(true);
        setFormData({ id: null, nome: '', ativo: true, limiteSelecao: '', adicionais: [] });
    };
    
    const cancelarEdicao = () => {
        setIsCreating(false);
        setGrupoSelecionadoId(null);
    };

    // --- FUNÇÕES DE AÇÃO (CRUD) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome.trim()) {
            showError("Nome obrigatório", "O nome do grupo não pode ser vazio.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        const payload = {
            Id: formData.id || 0,
            Nome: formData.nome.trim(),
            Ativo: formData.ativo,
            LimiteSelecao: formData.limiteSelecao === '' ? null : parseInt(formData.limiteSelecao),
            Adicionais: formData.adicionais.map(ad => ({
                Id: ad.id || 0,
                Nome: ad.nome.trim(),
                Descricao: ad.descricao.trim(),
                PrecoBase: ad.precoBase ? parseFloat(ad.precoBase) : 0,
                Ativo: ad.ativo,
                MaximoPorProduto: ad.maximoPorProduto === '' ? null : parseInt(ad.maximoPorProduto)
            }))
        };
        try {
            if (isCreating) {
                await api.post('/api/1.0/Adicional/CriarGrupoAdicional', payload);
                showSuccess('Sucesso!', 'Grupo criado com sucesso!');
            } else {
                await api.put('/api/1.0/Adicional/AtualizarGrupoAdicional', payload);
                showSuccess('Sucesso!', 'Grupo atualizado com sucesso!');
            }
            cancelarEdicao();
            buscarGruposAdicionais();
        } catch (err) {
            console.error('Erro ao salvar grupo:', err);
            const errorMsg = err.response?.data || 'Ocorreu um erro ao salvar.';
            showError('Erro ao Salvar', errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGrupo = async (id) => {
        const result = await confirmAction("Tem certeza?", "Esta ação excluirá o grupo e todos os seus adicionais. Não pode ser desfeita!");
        if (result.isConfirmed) {
            setIsSubmitting(true);
            try {
                await api.delete(`/api/1.0/Adicional/DeletarGrupoAdicional/${id}`);
                showSuccess("Excluído!", "Grupo de adicionais excluído com sucesso!");
                if (grupoSelecionadoId === id) {
                    cancelarEdicao();
                }
                buscarGruposAdicionais();
            } catch (err) {
                showError("Erro!", err.response?.data || "Não foi possível excluir o grupo.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    // FUNCIONALIDADE RESTAURADA: Excluir um adicional específico da base de dados.
    const handleDeleteAdicionalPermanently = async (adicionalId) => {
        if (!formData.id || !adicionalId) return;

        const result = await confirmAction("Excluir permanentemente?", "Este item será removido do banco de dados.");
        if (result.isConfirmed) {
            setIsSubmitting(true);
            try {
                await api.delete(`/api/1.0/Adicional/ExcluirAdicionalDeGrupo/${formData.id}/${adicionalId}`);
                showSuccess('Item Excluído', 'O adicional foi removido permanentemente.');
                // Recarrega os dados do grupo para atualizar a lista de adicionais
                buscarDetalhesDoGrupo(formData.id);
            } catch (err) {
                showError("Erro ao excluir", err.response?.data || "Não foi possível remover o item.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // --- RENDERIZAÇÃO ---
    return (
        <div className="h-screen w-full bg-gray-100 flex flex-col font-sans">
            <header className="p-4 bg-white border-b border-gray-200 shrink-0">
                <h1 className="text-xl font-bold text-gray-800">Gerenciamento de Adicionais</h1>
                {error && <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-md flex items-center"><AlertTriangle size={16} className="mr-2" />{error}</div>}
            </header>

            <main className="flex-grow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 min-h-0">
                {/* COLUNA DA ESQUERDA: LISTA DE GRUPOS */}
                <aside className="md:col-span-1 lg:col-span-1 h-full min-h-0 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center"><List size={20} className="mr-2" />Grupos</h2>
                    </div>
                    <div className="p-4">
                        <button onClick={iniciarCriacao} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
                            <Plus size={16} className="mr-2" /> Criar Novo Grupo
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto px-2 pb-2">
                        {isLoadingList ? (
                            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
                        ) : gruposAdicionais.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Nenhum grupo encontrado.</div>
                        ) : (
                            <ul className="space-y-1">
                                {gruposAdicionais.map(grupo => (
                                    <li key={grupo.id}>
                                        <button onClick={() => setGrupoSelecionadoId(grupo.id)} className={`w-full text-left p-3 rounded-md flex justify-between items-center transition-colors ${grupoSelecionadoId === grupo.id ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}`}>
                                            <span className="flex items-center"><span className={`w-2 h-2 rounded-full mr-3 shrink-0 ${grupo.ativo ? 'bg-green-500' : 'bg-red-500'}`}></span>{grupo.nome}</span>
                                            <ChevronsRight size={16} className={`transition-transform ${grupoSelecionadoId === grupo.id ? 'translate-x-1' : ''}`} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* COLUNA DA DIREITA: CONTEÚDO */}
                <section className="md:col-span-2 lg:col-span-3 h-full min-h-0 bg-gray-50">
                    {isLoadingDetails ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                    ) : !isCreating && !grupoSelecionadoId ? (
                        <div className="flex flex-col justify-center items-center h-full text-center text-gray-500 p-8">
                            <Info size={48} className="mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-700">Gerenciador de Adicionais</h3>
                            <p className="mt-2 max-w-md">Selecione um grupo na lista à esquerda para editar, ou clique em "Criar Novo Grupo" para começar.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="h-full flex flex-col">
                            {/* Cabeçalho do Formulário */}
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center"><Edit size={20} className="mr-2" />{isCreating ? 'Criando Novo Grupo' : `Editando: ${formData.nome}`}</h2>
                                {!isCreating && (
                                    <button type="button" onClick={() => handleDeleteGrupo(formData.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Excluir Grupo"><Trash2 size={18} /></button>
                                )}
                            </div>
                            
                            {/* Corpo do Formulário (com scroll) */}
                            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="font-semibold text-gray-700 mb-4">Detalhes do Grupo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="nome" className="block text-sm font-medium text-gray-600 mb-1">Nome do Grupo *</label>
                                            <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleFormChange} required className="w-full p-2 border border-gray-300 rounded-md" />
                                        </div>
                                        <div className="md:col-span-2 flex items-center"><input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" /><label htmlFor="ativo" className="ml-2 text-sm font-medium text-gray-700">Grupo Ativo</label></div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="font-semibold text-gray-700 mb-4">Itens Adicionais ({formData.adicionais.length})</h3>
                                    <div className="space-y-3">
                                        {formData.adicionais.length > 0 ? formData.adicionais.map((adicional, index) => (
                                            <div key={adicional.id || `new-${index}`} className="p-3 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    <div><label className="text-xs font-medium text-gray-500">Nome</label><input type="text" name="nome" value={adicional.nome} onChange={e => handleAdicionalChange(index, e)} required className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"/></div>
                                                    <div><label className="text-xs font-medium text-gray-500">Preço</label><input type="number" name="precoBase" value={adicional.precoBase} onChange={e => handleAdicionalChange(index, e)} required step="0.01" className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"/></div>
                                                    <div><label className="text-xs font-medium text-gray-500">Máx. por Produto</label><input type="number" name="maximoPorProduto" value={adicional.maximoPorProduto} onChange={e => handleAdicionalChange(index, e)} placeholder="Opcional" min="1" className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"/></div>
                                                </div>
                                                <div><label className="text-xs font-medium text-gray-500">Descrição</label><textarea name="descricao" value={adicional.descricao} onChange={e => handleAdicionalChange(index, e)} rows="2" className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"></textarea></div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <div className="flex items-center"><input type="checkbox" id={`adicional-ativo-${index}`} name="ativo" checked={adicional.ativo} onChange={e => handleAdicionalChange(index, e)} className="h-4 w-4 rounded border-gray-300"/><label htmlFor={`adicional-ativo-${index}`} className="ml-2 text-sm text-gray-700">Ativo</label></div>
                                                    <div className="flex gap-2">
                                                        {adicional.id > 0 && <button type="button" onClick={() => handleDeleteAdicionalPermanently(adicional.id)} className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Excluir Perm.</button>}
                                                        <button type="button" onClick={() => removerItemAdicionalLocal(index)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Remover</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <p className="text-sm text-gray-500 text-center py-4">Nenhum item adicionado. Adicione um abaixo.</p>}
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                                    <h3 className="font-semibold text-gray-700 mb-2">Adicionar Novo Item</h3>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input type="text" name="nome" value={novoAdicional.nome} onChange={handleNovoAdicionalChange} placeholder="Nome do item *" className="p-2 border border-gray-300 rounded-md text-sm"/><input type="number" name="precoBase" value={novoAdicional.precoBase} onChange={handleNovoAdicionalChange} placeholder="Preço *" step="0.01" className="p-2 border border-gray-300 rounded-md text-sm"/></div>
                                        <textarea name="descricao" value={novoAdicional.descricao} onChange={handleNovoAdicionalChange} placeholder="Descrição" rows="2" className="w-full p-2 border border-gray-300 rounded-md text-sm"></textarea>
                                        <button type="button" onClick={adicionarItemAdicional} className="w-full mt-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"><Plus size={16} className="mr-2"/> Adicionar à Lista</button>
                                    </div>
                                </div>
                            </div>

                            {/* Rodapé Fixo */}
                            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-4 shrink-0">
                                <button type="button" onClick={cancelarEdicao} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
};

export default GerenciamentoAdicionais;