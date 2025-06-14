import React, { useState, useEffect } from 'react';
import { confirmAction, showSuccess, showError } from '@utils/alerts'; // Ajuste o caminho se necessário
import api from '../../../axiosConfig'; // Ajuste o caminho se necessário
import { Plus, Trash2, Save, X, Loader2, List, ChevronsRight, Edit, Info, AlertTriangle } from 'lucide-react';

const GerenciamentoComplementos = () => {
    // --- ESTADOS GERAIS ---
    const [gruposComplementos, setGruposComplementos] = useState([]);
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
        descricao: '',
        ativo: true,
        obrigatorio: false, // Campo crucial
        multiplaEscolha: false,
        complementos: []
    });
    const [novoComplemento, setNovoComplemento] = useState({ nome: '', preco: '', descricao: '', maximoPorProduto: '', estoqueAtual: '', ativo: true });

    // --- FUNÇÕES DE API E DADOS ---
    const buscarGruposComplementos = async () => {
        setIsLoadingList(true);
        setError(null);
        try {
            const response = await api.get('/api/1.0/Complemento/ListarGrupoComplementosAtivosEInativos');
            setGruposComplementos(response.data || []);
        } catch (err) {
            console.error('Erro ao buscar grupos:', err);
            setError('Falha ao carregar os grupos de complementos.');
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
            const response = await api.get(`/api/1.0/Complemento/ListarGrupoComplementos/${id}`);
            const grupo = response.data;
            setFormData({
                id: grupo.id,
                nome: grupo.nome || '',
                descricao: grupo.descricao || '',
                ativo: grupo.ativo,
                obrigatorio: grupo.obrigatorio,
                multiplaEscolha: grupo.multiplaEscolha,
                complementos: grupo.complementos.map(comp => ({
                    id: comp.id,
                    nome: comp.nome || '',
                    preco: comp.preco.toString(),
                    descricao: comp.descricao || '',
                    maximoPorProduto: comp.maximoPorProduto ? comp.maximoPorProduto.toString() : '',
                    estoqueAtual: comp.estoqueAtual ? comp.estoqueAtual.toString() : '',
                    ativo: comp.ativo
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
        buscarGruposComplementos();
    }, []);

    useEffect(() => {
        if (grupoSelecionadoId) {
            buscarDetalhesDoGrupo(grupoSelecionadoId);
        }
    }, [grupoSelecionadoId]);

    // --- HANDLERS E MANIPULAÇÃO DO FORMULÁRIO ---
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleComplementoChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const novosComplementos = [...formData.complementos];
        novosComplementos[index][name] = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, complementos: novosComplementos }));
    };

    const handleNovoComplementoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNovoComplemento(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const adicionarItemComplemento = () => {
        if (novoComplemento.nome && novoComplemento.preco) {
            setFormData(prev => ({
                ...prev,
                complementos: [...prev.complementos, { ...novoComplemento, id: 0 }]
            }));
            setNovoComplemento({ nome: '', preco: '', descricao: '', maximoPorProduto: '', estoqueAtual: '', ativo: true });
        } else {
            showError("Campos incompletos", "Preencha ao menos Nome e Preço para adicionar um item.");
        }
    };
    
    const removerItemComplementoLocal = (index) => {
        setFormData(prev => ({
            ...prev,
            complementos: prev.complementos.filter((_, i) => i !== index)
        }));
    };

    const iniciarCriacao = () => {
        setGrupoSelecionadoId(null);
        setIsCreating(true);
        setFormData({ id: null, nome: '', descricao: '', ativo: true, obrigatorio: false, multiplaEscolha: false, complementos: [] });
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

        // O payload agora não inclui mais os campos de quantidade mínima/máxima a nível de grupo
        const payload = {
            Id: formData.id || 0,
            Nome: formData.nome.trim(),
            Descricao: formData.descricao.trim(),
            Ativo: formData.ativo,
            Obrigatorio: formData.obrigatorio, // Campo corrigido
            MultiplaEscolha: formData.multiplaEscolha,
            Complementos: formData.complementos.map(comp => ({
                Id: comp.id || 0,
                Nome: comp.nome.trim(),
                Descricao: comp.descricao.trim(),
                Preco: comp.preco ? parseFloat(comp.preco) : 0,
                Ativo: comp.ativo,
                MaximoPorProduto: comp.maximoPorProduto === '' ? null : parseInt(comp.maximoPorProduto),
                EstoqueAtual: comp.estoqueAtual === '' ? null : parseInt(comp.estoqueAtual)
            }))
        };
        try {
            if (isCreating) {
                await api.post('/api/1.0/Complemento/CriarGrupoComplemento', payload);
                showSuccess('Sucesso!', 'Grupo criado com sucesso!');
            } else {
                await api.put('/api/1.0/Complemento/AtualizarGrupoComplemento', payload);
                showSuccess('Sucesso!', 'Grupo atualizado com sucesso!');
            }
            cancelarEdicao();
            await buscarGruposComplementos();
        } catch (err) {
            console.error('Erro ao salvar grupo:', err);
            showError('Erro ao Salvar', err.response?.data || 'Ocorreu um erro ao salvar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGrupo = async (id) => {
        const result = await confirmAction("Tem certeza?", "Esta ação excluirá o grupo e todos os seus complementos. Não pode ser desfeita!");
        if (result.isConfirmed) {
            setIsSubmitting(true);
            try {
                await api.delete(`/api/1.0/Complemento/DeletarGrupoComplemento/${id}`);
                showSuccess("Excluído!", "Grupo de complementos excluído com sucesso!");
                if (grupoSelecionadoId === id) {
                    cancelarEdicao();
                }
                await buscarGruposComplementos();
            } catch (err) {
                showError("Erro!", err.response?.data || "Não foi possível excluir o grupo.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    const handleDeleteComplementoPermanently = async (complementoId) => {
        if (!formData.id || !complementoId) return;
        const result = await confirmAction("Excluir permanentemente?", "Este item será removido do banco de dados.");
        if (result.isConfirmed) {
            setIsSubmitting(true);
            try {
                await api.delete(`/api/1.0/Complemento/ExcluirComplementoDeGrupo/${formData.id}/${complementoId}`);
                showSuccess('Item Excluído', 'O complemento foi removido permanentemente.');
                await buscarDetalhesDoGrupo(formData.id);
            } catch (err) {
                showError("Erro ao excluir", err.response?.data || "Não foi possível remover o item.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="h-screen w-full bg-gray-100 flex flex-col font-sans">
            <header className="p-4 bg-white border-b border-gray-200 shrink-0">
                <h1 className="text-xl font-bold text-gray-800">Gerenciamento de Complementos</h1>
                {error && <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-md flex items-center"><AlertTriangle size={16} className="mr-2" />{error}</div>}
            </header>

            <main className="flex-grow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 min-h-0">
                <aside className="md:col-span-1 lg:col-span-1 h-full min-h-0 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-bold text-gray-800 flex items-center"><List size={20} className="mr-2" />Grupos</h2></div>
                    <div className="p-4"><button onClick={iniciarCriacao} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"><Plus size={16} className="mr-2" /> Criar Novo Grupo</button></div>
                    <div className="flex-grow overflow-y-auto px-2 pb-2">
                        {isLoadingList ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
                            : gruposComplementos.length === 0 ? <div className="p-4 text-center text-sm text-gray-500">Nenhum grupo encontrado.</div>
                            : <ul className="space-y-1">{gruposComplementos.map(grupo => (<li key={grupo.id}><button onClick={() => setGrupoSelecionadoId(grupo.id)} className={`w-full text-left p-3 rounded-md flex justify-between items-center transition-colors ${grupoSelecionadoId === grupo.id ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}`}><span className="flex items-center"><span className={`w-2 h-2 rounded-full mr-3 shrink-0 ${grupo.ativo ? 'bg-green-500' : 'bg-red-500'}`}></span>{grupo.nome}</span><ChevronsRight size={16} className={`transition-transform ${grupoSelecionadoId === grupo.id ? 'translate-x-1' : ''}`} /></button></li>))}</ul>}
                    </div>
                </aside>

                <section className="md:col-span-2 lg:col-span-3 h-full min-h-0 bg-gray-50">
                    {isLoadingDetails ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                    : !isCreating && !grupoSelecionadoId ? <div className="flex flex-col justify-center items-center h-full text-center text-gray-500 p-8"><Info size={48} className="mb-4 text-gray-400" /><h3 className="text-xl font-semibold text-gray-700">Gerenciador de Complementos</h3><p className="mt-2 max-w-md">Selecione um grupo à esquerda para editar, ou clique em "Criar Novo Grupo" para começar.</p></div>
                    : (
                        <form onSubmit={handleSubmit} className="h-full flex flex-col">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center"><Edit size={20} className="mr-2" />{isCreating ? 'Criando Novo Grupo' : `Editando: ${formData.nome}`}</h2>
                                {!isCreating && <button type="button" onClick={() => handleDeleteGrupo(formData.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Excluir Grupo"><Trash2 size={18} /></button>}
                            </div>
                            
                            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="font-semibold text-gray-700 mb-4">Regras do Grupo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><label htmlFor="nome" className="block text-sm font-medium text-gray-600 mb-1">Nome do Grupo *</label><input type="text" id="nome" name="nome" value={formData.nome} onChange={handleFormChange} required className="w-full p-2 border border-gray-300 rounded-md" /></div>
                                        <div className="lg:col-span-2"><label htmlFor="descricao" className="block text-sm font-medium text-gray-600 mb-1">Descrição</label><input type="text" id="descricao" name="descricao" value={formData.descricao} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md" /></div>
                                        <div className="flex flex-col justify-end space-y-2 pt-2 md:col-span-3">
                                            <div className="flex items-center"><input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={handleFormChange} className="h-4 w-4 rounded" /><label htmlFor="ativo" className="ml-2 text-sm">Grupo Ativo</label></div>
                                            <div className="flex items-center"><input type="checkbox" id="obrigatorio" name="obrigatorio" checked={formData.obrigatorio} onChange={handleFormChange} className="h-4 w-4 rounded" /><label htmlFor="obrigatorio" className="ml-2 text-sm">Obrigatório</label></div>
                                            <div className="flex items-center"><input type="checkbox" id="multiplaEscolha" name="multiplaEscolha" checked={formData.multiplaEscolha} onChange={handleFormChange} className="h-4 w-4 rounded" /><label htmlFor="multiplaEscolha" className="ml-2 text-sm">Múltipla Escolha</label></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="font-semibold text-gray-700 mb-4">Itens do Complemento ({formData.complementos.length})</h3>
                                    <div className="space-y-3">
                                        {formData.complementos.length > 0 ? formData.complementos.map((complemento, index) => (
                                            <div key={complemento.id || `new-${index}`} className="p-3 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    <div><label className="text-xs font-medium text-gray-500">Nome *</label><input type="text" name="nome" value={complemento.nome} onChange={e => handleComplementoChange(index, e)} required className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"/></div>
                                                    <div><label className="text-xs font-medium text-gray-500">Preço *</label><input type="number" name="preco" value={complemento.preco} onChange={e => handleComplementoChange(index, e)} required step="0.01" className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"/></div>
                                                    <div><label className="text-xs font-medium text-gray-500">Máx. por Produto</label><input type="number" name="maximoPorProduto" value={complemento.maximoPorProduto} onChange={e => handleComplementoChange(index, e)} placeholder="Opcional" min="1" className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"/></div>
                                                    <div><label className="text-xs font-medium text-gray-500">Estoque Atual</label><input type="number" name="estoqueAtual" value={complemento.estoqueAtual} onChange={e => handleComplementoChange(index, e)} placeholder="Ilimitado" min="0" className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"/></div>
                                                </div>
                                                <div><label className="text-xs font-medium text-gray-500">Descrição</label><textarea name="descricao" value={complemento.descricao} onChange={e => handleComplementoChange(index, e)} rows="2" className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm"></textarea></div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <div className="flex items-center"><input type="checkbox" id={`complemento-ativo-${index}`} name="ativo" checked={complemento.ativo} onChange={e => handleComplementoChange(index, e)} className="h-4 w-4 rounded"/><label htmlFor={`complemento-ativo-${index}`} className="ml-2 text-sm">Ativo</label></div>
                                                    <div className="flex gap-2">
                                                        {complemento.id > 0 && <button type="button" onClick={() => handleDeleteComplementoPermanently(complemento.id)} className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Excluir Perm.</button>}
                                                        <button type="button" onClick={() => removerItemComplementoLocal(index)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Remover</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <p className="text-sm text-gray-500 text-center py-4">Nenhum item adicionado. Adicione um abaixo.</p>}
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                                     <h3 className="font-semibold text-gray-700 mb-2">Adicionar Novo Item</h3>
                                     <div className="space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input type="text" name="nome" value={novoComplemento.nome} onChange={handleNovoComplementoChange} placeholder="Nome do item *" className="p-2 border border-gray-300 rounded-md text-sm"/><input type="number" name="preco" value={novoComplemento.preco} onChange={handleNovoComplementoChange} placeholder="Preço *" step="0.01" className="p-2 border border-gray-300 rounded-md text-sm"/></div>
                                        <textarea name="descricao" value={novoComplemento.descricao} onChange={handleNovoComplementoChange} placeholder="Descrição" rows="2" className="w-full p-2 border border-gray-300 rounded-md text-sm"></textarea>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input type="number" name="maximoPorProduto" value={novoComplemento.maximoPorProduto} onChange={handleNovoComplementoChange} placeholder="Máximo por produto (opcional)" min="1" className="p-2 border border-gray-300 rounded-md text-sm"/>
                                            <input type="number" name="estoqueAtual" value={novoComplemento.estoqueAtual} onChange={handleNovoComplementoChange} placeholder="Estoque atual (opcional)" min="0" className="p-2 border border-gray-300 rounded-md text-sm"/>
                                        </div>
                                        <button type="button" onClick={adicionarItemComplemento} disabled={!novoComplemento.nome || !novoComplemento.preco} className="w-full mt-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"><Plus size={16} className="mr-2"/> Adicionar à Lista</button>
                                     </div>
                                </div>
                            </div>
                            
                            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-4 shrink-0">
                                <button type="button" onClick={cancelarEdicao} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
                                <button type="submit" disabled={isSubmitting || formData.complementos.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2">
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

export default GerenciamentoComplementos;