import React, { useState, useEffect } from 'react';
import { confirmAction, showSuccess, showError } from '@utils/alerts';
import api from '../../../axiosConfig';

const GerenciamentoComplementos = () => {
    // Estados para o modo atual (criar ou editar)
    const [modo, setModo] = useState('listar'); // 'listar', 'criar', 'editar'
    const [gruposComplementos, setGruposComplementos] = useState([]);
    const [grupoAtual, setGrupoAtual] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    // Estados para formulário de criar/editar grupo
    const [grupoNome, setGrupoNome] = useState('');
    const [grupoDescricao, setGrupoDescricao] = useState('');
    const [grupoAtivo, setGrupoAtivo] = useState(true);
    const [grupoObrigatorio, setGrupoObrigatorio] = useState(false);
    const [quantidadeMinima, setQuantidadeMinima] = useState('');
    const [multiplaEscolha, setMultiplaEscolha] = useState(false);

    const [quantidadeMaxima, setQuantidadeMaxima] = useState('');
    const [complementos, setComplementos] = useState([]);
    const [novoComplemento, setNovoComplemento] = useState({
        nome: '',
        preco: '',
        descricao: '',
        maximoPorProduto: '',
        estoqueAtual: '',
        ativo: true
    });
    // Função para buscar todos os grupos de complementos
    const buscarGruposComplementos = async () => {
        setCarregando(true);
        setErro('');
        try {
            const response = await api.get('/api/1.0/Complemento/ListarGrupoComplementosAtivosEInativos');
            setGruposComplementos(response.data);
            console.log("Grupos", response.data);
        } catch (error) {
            console.error('Erro ao buscar grupos de complementos:', error);
            setErro('Falha ao carregar os grupos de complementos. Por favor, tente novamente.');
        } finally {
            setCarregando(false);
        }
    };


    // Manipulador para o checkbox de múltipla escolha
    const handleMultiplaEscolhaChange = (e) => {
        setMultiplaEscolha(e.target.checked);
    };

    // Função para buscar um grupo específico pelo ID
    const [modalAberto, setModalAberto] = useState(false);

    const buscarGrupoComplementoPorId = async (id) => {
        setCarregando(true);
        setErro('');
        try {
            const response = await api.get(`/api/1.0/Complemento/ListarGrupoComplementos/${id}`);
            const grupo = response.data;
            console.log("Grupo por ID", response.data);
            setGrupoAtual(grupo);
            setGrupoNome(grupo.nome);
            setGrupoDescricao(grupo.descricao || '');
            setGrupoAtivo(grupo.ativo);
            setGrupoObrigatorio(grupo.obrigatorio);
            setQuantidadeMinima(grupo.quantidadeMinima || '');
            setQuantidadeMaxima(grupo.quantidadeMaxima || '');
            setMultiplaEscolha(grupo.multiplaEscolha);
            setComplementos(grupo.complementos.map(complemento => ({
                id: complemento.id,
                nome: complemento.nome,
                preco: complemento.preco.toString(),
                descricao: complemento.descricao,
                maximoPorProduto: complemento.maximoPorProduto ? complemento.maximoPorProduto.toString() : '',
                estoqueAtual: complemento.estoqueAtual ? complemento.estoqueAtual.toString() : '',
                ativo: complemento.ativo
            })));

            setModo('editar');
            setModalAberto(true);
        } catch (error) {
            console.error('Erro ao buscar grupo de complementos:', error);
            setErro('Falha ao carregar o grupo de complementos. Por favor, tente novamente.');
        } finally {
            setCarregando(false);
        }
    };

    // Carregar grupos de complementos ao montar o componente
    useEffect(() => {
        buscarGruposComplementos();
    }, []);

    // Handlers para manipular o formulário
    const handleGrupoNomeChange = (e) => {
        setGrupoNome(e.target.value);
    };

    const handleGrupoDescricaoChange = (e) => {
        setGrupoDescricao(e.target.value);
    };

    const handleGrupoAtivoChange = (e) => {
        setGrupoAtivo(e.target.checked);
    };

    const handleGrupoObrigatorioChange = (e) => {
        setGrupoObrigatorio(e.target.checked);
    };

    const handleQuantidadeMinimaChange = (e) => {
        setQuantidadeMinima(e.target.value);
    };

    const handleQuantidadeMaximaChange = (e) => {
        setQuantidadeMaxima(e.target.value);
    };

    const handleNovoComplementoChange = (e) => {
        const { name, value, type, checked } = e.target;

        const novoValor = type === 'checkbox'
            ? checked
            : (name === 'maximoPorProduto' && value === '')
                ? ''
                : value;

        setNovoComplemento({ ...novoComplemento, [name]: novoValor });
    };

    const handleComplementoChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const novosComplementos = [...complementos];

        novosComplementos[index][name] = type === 'checkbox'
            ? checked
            : value;

        setComplementos(novosComplementos);
    };

    const adicionarComplemento = () => {
        if (novoComplemento.nome && novoComplemento.preco && novoComplemento.descricao) {
            setComplementos([...complementos, novoComplemento]);
            setNovoComplemento({
                nome: '',
                preco: '',
                descricao: '',
                maximoPorProduto: '',
                estoqueAtual: '',
                ativo: true
            });
        }
    };
    const removerComplemento = async (id, index) => {
        try {
            await api.delete(`/api/1.0/Complemento/DeletarComplemento/${id}`);
            // Se a API deletar com sucesso, removemos do estado local
            const novosComplementos = complementos.filter((_, i) => i !== index);
            setComplementos(novosComplementos);
        } catch (error) {
            console.error("Erro ao deletar complemento:", error);
            alert("Erro ao deletar complemento!");
        }
    };

    const limparFormulario = () => {
        setGrupoNome('');
        setGrupoDescricao('');
        setGrupoAtivo(true);
        setGrupoObrigatorio(false);
        setQuantidadeMinima('');
        setQuantidadeMaxima('');
        setComplementos([]);
        setGrupoAtual(null);
    };

    const iniciarCriacaoGrupo = () => {
        limparFormulario();
        setModo('criar');
    };

    const voltarParaLista = () => {
        setModo('listar');
        limparFormulario();
    };

    // Função para salvar (criar ou atualizar) um grupo de complementos
    const handleSubmit = async (e) => {
        e.preventDefault();
        setCarregando(true);
        setErro('');

        try {
            const payload = {
                Nome: grupoNome?.trim() || "Grupo sem nome",
                Descricao: grupoDescricao?.trim() || "",
                Ativo: grupoAtivo,
                Obrigatorio: grupoObrigatorio,
                QuantidadeMinima: quantidadeMinima === '' ? null : parseInt(quantidadeMinima),
                QuantidadeMaxima: quantidadeMaxima === '' ? null : parseInt(quantidadeMaxima),
                MultiplaEscolha: multiplaEscolha,
                Complementos: complementos.map(complemento => ({
                    Id: complemento.id || 0,
                    Nome: complemento.nome?.trim() || "Complemento sem nome",
                    Descricao: complemento.descricao?.trim() || "Sem descrição",
                    Preco: complemento.preco ? parseFloat(complemento.preco) : 0,
                    Ativo: complemento.ativo,
                    MaximoPorProduto: complemento.maximoPorProduto === '' ? null : parseInt(complemento.maximoPorProduto),
                    EstoqueAtual: complemento.estoqueAtual === '' ? null : parseInt(complemento.estoqueAtual)
                }))
            };

            let response;

            if (modo === 'criar') {
                response = await api.post('/api/1.0/Complemento/CriarGrupoComplemento', payload);

                if (response.status === 200) {
                    await showSuccess('Sucesso!', 'Grupo e complementos criados com sucesso!');
                    voltarParaLista();
                    buscarGruposComplementos();
                }
            } else if (modo === 'editar' && grupoAtual) {
                payload.Id = grupoAtual.id;

                response = await api.put('/api/1.0/Complemento/AtualizarGrupoComplemento', payload);

                if (response.status === 200) {
                    await showSuccess('Sucesso!', 'Grupo e complementos atualizados com sucesso!');
                    voltarParaLista();
                    buscarGruposComplementos();
                }
            }
        } catch (error) {
            console.error('Erro ao salvar grupo de complementos:', error.response?.data || error.message);
            const errorMsg = error.response?.data || 'Erro ao salvar grupo de complementos. Por favor, tente novamente.';
            setErro(errorMsg);
            showError('Erro!', errorMsg);
        } finally {
            setCarregando(false);
        }
    };

    const excluirGrupo = async (id) => {
        const result = await confirmAction(
            "Tem certeza?",
            "Esta ação não pode ser desfeita!"
        );

        if (result.isConfirmed) {
            setCarregando(true);
            setErro('');

            try {
                const response = await api.delete(`/api/1.0/Complemento/DeletarGrupoComplemento/${id}`);

                if (response.status === 200) {
                    await showSuccess("Excluído!", "Grupo de complementos excluído com sucesso!");
                    buscarGruposComplementos();
                }
            } catch (error) {
                console.error('Erro ao excluir grupo de complementos:', error.response?.data || error.message);
                const errorMsg = error.response?.data || 'Erro ao excluir grupo de complementos. Por favor, tente novamente.';
                setErro(errorMsg);
                showError("Erro!", errorMsg);
            } finally {
                setCarregando(false);
            }
        }
    };

    // Função para excluir um complemento específico (apenas na edição)
    const excluirComplemento = async (grupoId, complementoId) => {
        if (window.confirm("Tem certeza que deseja excluir este complemento?")) {
            setCarregando(true);
            setErro('');
            try {
                const response = await api.delete(`/api/1.0/Complemento/ExcluirComplementoDeGrupo/${grupoId}/${complementoId}`);
                if (response.status === 200) {
                    alert('Complemento excluído com sucesso!');
                    // Atualizar o grupo atual para refletir a exclusão
                    buscarGrupoComplementoPorId(grupoId);
                }
            } catch (error) {
                console.error('Erro ao excluir complemento:', error.response?.data || error.message);
                setErro(error.response?.data || 'Erro ao excluir complemento. Por favor, tente novamente.');
            } finally {
                setCarregando(false);
            }
        }
    };
    // Renderização da lista de grupos de complementos
    const renderizarListaGrupos = () => {
        // Estado de carregamento
        if (carregando && gruposComplementos.length === 0) {
            return (
                <div className="flex items-center justify-center py-6">
                    <div className="h-6 w-6 border-t-2 border-blue-500 rounded-full animate-spin mr-2"></div>
                    <p className="text-blue-600 text-sm font-medium">Carregando grupos...</p>
                </div>
            );
        }

        // Estado de erro
        if (erro && gruposComplementos.length === 0) {
            return (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{erro}</p>
                    </div>
                </div>
            );
        }
        // Estado vazio
        if (gruposComplementos.length === 0) {
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center">
                    <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 font-medium text-sm mb-3">Nenhum grupo de complementos encontrado.</p>
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                        Criar Novo Grupo
                    </button>
                </div>
            );
        }
        // Lista de grupos
        return (
            <div className="space-y-3">
                {gruposComplementos.map(grupo => (
                    <div key={grupo.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow">
                        {/* Cabeçalho do grupo */}
                        <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-blue-50 to-white border-b">
                            <div className="flex items-center">
                                <div className="bg-white rounded-md p-1 shadow-sm mr-2">
                                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">
                                        {grupo.nome || "Grupo sem nome"}
                                    </h3>
                                    {grupo.descricao && (
                                        <p className="text-xs text-gray-500">{grupo.descricao}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => buscarGrupoComplementoPorId(grupo.id)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Editar grupo"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => excluirGrupo(grupo.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Excluir grupo"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        {/* Listagem de complementos */}
                        <div className="p-2 bg-gray-50">
                            {grupo.complementos && grupo.complementos.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                    {grupo.complementos.map(complemento => (
                                        <div
                                            key={complemento.id}
                                            className="relative p-2 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col h-full"
                                        >
                                            {!complemento.ativo && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium text-xs">
                                                    Inativo
                                                </span>
                                            )}
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-medium text-gray-800 text-xs">{complemento.nome}</h4>
                                                <span className="text-blue-600 font-semibold text-xs">
                                                    R$ {complemento.preco.toFixed(2)}
                                                </span>
                                            </div>

                                            {complemento.descricao && (
                                                <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                                                    {complemento.descricao}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-1 mt-auto">
                                                {complemento.maximoPorProduto && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                                        Máx: {complemento.maximoPorProduto}
                                                    </span>
                                                )}
                                                {complemento.estoqueAtual !== null && complemento.estoqueAtual !== undefined && (
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded ${complemento.estoqueAtual > 10
                                                            ? 'bg-green-50 text-green-700'
                                                            : complemento.estoqueAtual > 0
                                                                ? 'bg-yellow-50 text-yellow-700'
                                                                : 'bg-red-50 text-red-700'
                                                        }`}>
                                                        Est: {complemento.estoqueAtual}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-3 bg-white rounded-md border border-gray-100">
                                    <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs text-gray-500">Sem complementos</span>
                                    <button className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center">
                                        <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Adicionar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    // Renderização do formulário para criar/editar grupo de complementos
    const renderizarFormularioGrupo = () => {
        return (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="grupoNome" className="block text-sm font-medium text-gray-700">
                        Nome do Grupo
                    </label>
                    <input
                        type="text"
                        id="grupoNome"
                        value={grupoNome}
                        onChange={handleGrupoNomeChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                </div>

                <div>
                    <label htmlFor="grupoDescricao" className="block text-sm font-medium text-gray-700">
                        Descrição do Grupo
                    </label>
                    <textarea
                        id="grupoDescricao"
                        value={grupoDescricao}
                        onChange={handleGrupoDescricaoChange}
                        rows="2"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="grupoAtivo"
                                checked={grupoAtivo}
                                onChange={handleGrupoAtivoChange}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="grupoAtivo" className="ml-2 block text-sm text-gray-700">
                                Ativo
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="grupoObrigatorio"
                                checked={grupoObrigatorio}
                                onChange={handleGrupoObrigatorioChange}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="grupoObrigatorio" className="ml-2 block text-sm text-gray-700">
                                Obrigatório
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="multiplaEscolha" className="block text-sm font-medium text-gray-700">
                                Múltipla escolha de adicionais
                            </label>
                            <input
                                type="checkbox"
                                id="multiplaEscolha"
                                checked={multiplaEscolha}
                                onChange={handleMultiplaEscolhaChange}
                                className="mt-1"
                            />
                            <span className="ml-2 text-sm">Mutiplos Complementos</span>
                        </div>

                        <div>
                            <label htmlFor="quantidadeMaxima" className="block text-sm font-medium text-gray-700">
                                Quantidade Máxima
                            </label>
                            <input
                                type="number"
                                id="quantidadeMaxima"
                                value={quantidadeMaxima}
                                onChange={handleQuantidadeMaximaChange}
                                min="1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Complementos</h3>

                    {complementos.length > 0 ? (
                        <div className="space-y-2 mb-4">
                            {complementos.map((complemento, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Nome</label>
                                            <input
                                                type="text"
                                                name="nome"
                                                value={complemento.nome}
                                                onChange={(e) => handleComplementoChange(index, e)}
                                                required
                                                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Preço</label>
                                            <input
                                                type="number"
                                                name="preco"
                                                value={complemento.preco}
                                                onChange={(e) => handleComplementoChange(index, e)}
                                                required
                                                step="0.01"
                                                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="block text-xs font-medium text-gray-700">Descrição</label>
                                        <textarea
                                            name="descricao"
                                            value={complemento.descricao}
                                            onChange={(e) => handleComplementoChange(index, e)}
                                            required
                                            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            rows="2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Máximo por Produto</label>
                                            <input
                                                type="number"
                                                name="maximoPorProduto"
                                                value={complemento.maximoPorProduto}
                                                onChange={(e) => handleComplementoChange(index, e)}
                                                min="1"
                                                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Estoque Atual</label>
                                            <input
                                                type="number"
                                                name="estoqueAtual"
                                                value={complemento.estoqueAtual}
                                                onChange={(e) => handleComplementoChange(index, e)}
                                                min="0"
                                                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="ativo"
                                                    id={`complemento-ativo-${index}`}
                                                    checked={complemento.ativo}
                                                    onChange={(e) => handleComplementoChange(index, e)}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <label htmlFor={`complemento-ativo-${index}`} className="ml-2 block text-sm text-gray-700">
                                                    Ativo
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removerComplemento(complemento.id, index)}
                                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                        >
                                            Remover
                                        </button>
                                        {/* Botão de excluir aparece apenas para complementos já existentes com ID */}
                                        {modo === 'editar' && complemento.id && (
                                            <button
                                                type="button"
                                                onClick={() => excluirComplemento(grupoAtual.id, complemento.id)}
                                                className="ml-2 px-2 py-1 bg-red-700 text-white rounded hover:bg-red-800 text-sm"
                                            >
                                                Excluir Permanentemente
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 mb-4">Nenhum complemento adicionado. Adicione pelo menos um complemento.</p>
                    )}

                    <div className="p-3 bg-gray-100 rounded border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Novo Complemento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div>
                                <input
                                    type="text"
                                    name="nome"
                                    value={novoComplemento.nome}
                                    onChange={handleNovoComplementoChange}
                                    placeholder="Nome do Complemento"
                                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    name="preco"
                                    value={novoComplemento.preco}
                                    onChange={handleNovoComplementoChange}
                                    placeholder="Preço do Complemento"
                                    step="0.01"
                                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                            </div>
                        </div>

                        <div className="mb-2">
                            <textarea
                                name="descricao"
                                value={novoComplemento.descricao}
                                onChange={handleNovoComplementoChange}
                                placeholder="Descrição do Complemento"
                                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                rows="2"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                            <div>
                                <input
                                    type="number"
                                    name="maximoPorProduto"
                                    value={novoComplemento.maximoPorProduto}
                                    onChange={handleNovoComplementoChange}
                                    placeholder="Máximo por produto (opcional)"
                                    min="1"
                                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    name="estoqueAtual"
                                    value={novoComplemento.estoqueAtual}
                                    onChange={handleNovoComplementoChange}
                                    placeholder="Estoque atual (opcional)"
                                    min="0"
                                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="ativo"
                                    id="novoComplementoAtivo"
                                    checked={novoComplemento.ativo}
                                    onChange={handleNovoComplementoChange}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="novoComplementoAtivo" className="ml-2 block text-sm text-gray-700">
                                    Ativo
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={adicionarComplemento}
                                disabled={!novoComplemento.nome || !novoComplemento.preco || !novoComplemento.descricao}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Adicionar Complemento
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={voltarParaLista}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={complementos.length === 0 || carregando}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {carregando ? 'Salvando...' : modo === 'criar' ? 'Criar Grupo de Complementos' : 'Atualizar Grupo de Complementos'}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div className="p-2">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">
                            Gerenciamento de Complementos
                        </h2>
                        {modo === 'listar' && (
                            <button
                                onClick={iniciarCriacaoGrupo}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Criar Novo Grupo
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-4">
                    {modo === 'listar' && renderizarListaGrupos()}
                    {(modo === 'criar' || modo === 'editar') && renderizarFormularioGrupo()}
                </div>
            </div>
        </div>
    );
};

export default GerenciamentoComplementos;