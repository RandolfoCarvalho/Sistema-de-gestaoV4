import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import api from '../../../axiosConfig'

const GerenciamentoAdicionais = () => {
    // Estados para o modo atual (criar ou editar)
    const [modo, setModo] = useState('listar');
    const [gruposAdicionais, setGruposAdicionais] = useState([]);
    const [grupoAtual, setGrupoAtual] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    // Estados para formulário de criar/editar grupo
    const [grupoNome, setGrupoNome] = useState('');
    const [grupoAtivo, setGrupoAtivo] = useState(true);
    const [limiteSelecao, setLimiteSelecao] = useState('');
    const [adicionais, setAdicionais] = useState([]);
    const [novoAdicional, setNovoAdicional] = useState({
        nome: '',
        precoBase: '',
        descricao: '',
        maximoPorProduto: '',
        ativo: true
    });

    // Função para buscar todos os grupos de adicionais
    const buscarGruposAdicionais = async () => {
        setCarregando(true);
        setErro('');
        try {
            const response = await api.get('/api/1.0/Adicional/ListarGrupoAdicionaisAtivosEInativos'
            );
            setGruposAdicionais(response.data);
        } catch (error) {
            console.error('Erro ao buscar grupos de adicionais:', error);
            setErro('Falha ao carregar os grupos de adicionais. Por favor, tente novamente.');
        } finally {
            setCarregando(false);
        }
    };

    // Função para buscar um grupo específico pelo ID
    const [modalAberto, setModalAberto] = useState(false);

    const buscarGrupoAdicionalPorId = async (id) => {
        setCarregando(true);
        setErro('');
        try {
            const response = await api.get(`/api/1.0/Adicional/ListarGrupoAdicionais/${id}`
            );

            const grupo = response.data;
            setGrupoAtual(grupo);
            setGrupoNome(grupo.nome);
            setGrupoAtivo(grupo.ativo);
            setLimiteSelecao(grupo.limiteSelecao || '');

            setAdicionais(grupo.adicionais.map(adicional => ({
                id: adicional.id,
                nome: adicional.nome,
                preco: adicional.precoBase.toString(),
                descricao: adicional.descricao,
                maximoPorProduto: adicional.maximoPorProduto ? adicional.maximoPorProduto.toString() : '',
                ativo: adicional.ativo
            })));

            setModo('editar');
            setModalAberto(true);
        } catch (error) {
            console.error('Erro ao buscar grupo de adicionais:', error);
            setErro('Falha ao carregar o grupo de adicionais. Por favor, tente novamente.');
        } finally {
            setCarregando(false);
        }
    };
    // Carregar grupos de adicionais ao montar o componente
    useEffect(() => {
        buscarGruposAdicionais();
    }, []);
    // Handlers para manipular o formulário
    const handleGrupoNomeChange = (e) => {
        setGrupoNome(e.target.value);
    };
    const handleGrupoAtivoChange = (e) => {
        setGrupoAtivo(e.target.checked);
    };
    const handleLimiteSelecaoChange = (e) => {
        setLimiteSelecao(e.target.value);
    };
    const handleNovoAdicionalChange = (e) => {
        const { name, value, type, checked } = e.target;

        const novoValor = type === 'checkbox'
            ? checked
            : (name === 'maximoPorProduto' && value === ''
                ? ''
                : value);

        setNovoAdicional({ ...novoAdicional, [name]: novoValor });
    };

    const handleAdicionalChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const novosAdicionais = [...adicionais];

        novosAdicionais[index][name] = type === 'checkbox'
            ? checked
            : value;

        setAdicionais(novosAdicionais);
    };
    const adicionarAdicional = () => {
        if (novoAdicional.nome && novoAdicional.preco && novoAdicional.descricao) {
            setAdicionais([...adicionais, novoAdicional]);
            setNovoAdicional({
                nome: '',
                precoBase: '',
                descricao: '',
                maximoPorProduto: '',
                ativo: true
            });
        }
    };
    const removerAdicional = (index) => {
        const novosAdicionais = adicionais.filter((_, i) => i !== index);
        setAdicionais(novosAdicionais);
    };
    const limparFormulario = () => {
        setGrupoNome('');
        setGrupoAtivo(true);
        setLimiteSelecao('');
        setAdicionais([]);
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
    // Função para salvar (criar ou atualizar) um grupo de adicionais
    const handleSubmit = async (e) => {
        e.preventDefault();
        setCarregando(true);
        setErro('');
        try {
            const payload = {
                Nome: grupoNome?.trim() || "Grupo sem nome",
                Ativo: grupoAtivo,
                LimiteSelecao: limiteSelecao === '' ? null : parseInt(limiteSelecao),
                Adicionais: adicionais.map(adicional => ({
                    Id: adicional.id || 0, // Se for um novo adicional, Id será 0
                    Nome: adicional.nome?.trim() || "Adicional sem nome",
                    Descricao: adicional.descricao?.trim() || "Sem descrição",
                    PrecoBase: adicional.preco ? parseFloat(adicional.preco) : 0,
                    Ativo: adicional.ativo,
                    MaximoPorProduto: adicional.maximoPorProduto === '' ? null : parseInt(adicional.maximoPorProduto)
                }))
            };
            let response;
            if (modo === 'criar') {
                response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/1.0/Adicional/CriarGrupoAdicional`,
                    payload
                );

                if (response.status === 200) {
                    Swal.fire({
                        title: 'Sucesso!',
                        text: 'Grupo e adicionais criados com sucesso!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        voltarParaLista();
                        buscarGruposAdicionais();
                    });
                }
            } else if (modo === 'editar' && grupoAtual) {
                payload.Id = grupoAtual.id;

                response = await axios.put(
                    `${process.env.REACT_APP_API_URL}/api/1.0/Adicional/AtualizarGrupoAdicional`,
                    payload
                );

                if (response.status === 200) {
                    Swal.fire({
                        title: 'Sucesso!',
                        text: 'Grupo e adicionais atualizados com sucesso!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        voltarParaLista();
                        buscarGruposAdicionais();
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao salvar grupo de adicionais:', error.response?.data || error.message);
            setErro(error.response?.data || 'Erro ao salvar grupo de adicionais. Por favor, tente novamente.');

            Swal.fire({
                title: 'Erro!',
                text: error.response?.data || 'Erro ao salvar grupo de adicionais. Por favor, tente novamente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setCarregando(false);
        }
    };
    const excluirGrupo = async (id) => {
        Swal.fire({
            title: "Tem certeza?",
            text: "Esta ação não pode ser desfeita!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sim, excluir!",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed) {
                setCarregando(true);
                setErro('');
                try {
                    const response = await axios.delete(
                        `${process.env.REACT_APP_API_URL}/api/1.0/Adicional/DeletarGrupoAdicional/${id}`
                    );
                    if (response.status === 200) {
                        Swal.fire({
                            title: "Excluído!",
                            text: "Grupo de adicionais excluído com sucesso!",
                            icon: "success",
                            confirmButtonText: "OK"
                        });
                    }
                    buscarGruposAdicionais();
                } catch (error) {
                    console.error('Erro ao excluir grupo de adicionais:', error.response?.data || error.message);
                    setErro(error.response?.data || 'Erro ao excluir grupo de adicionais. Por favor, tente novamente.');

                    Swal.fire({
                        title: "Erro!",
                        text: error.response?.data || "Erro ao excluir grupo de adicionais. Por favor, tente novamente.",
                        icon: "error",
                        confirmButtonText: "OK"
                    });
                } finally {
                    setCarregando(false);
                }
            }
        });
    };
    // Função para excluir um adicional específico (apenas na edição)
    const excluirAdicional = async (grupoId, adicionalId) => {
        if (window.confirm("Tem certeza que deseja excluir este adicional?")) {
            setCarregando(true);
            setErro('');
            try {
                const response = await axios.delete(
                    `${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ExcluirAdicionalDeGrupo/${grupoId}/${adicionalId}`
                );

                if (response.status === 200) {
                    alert('Adicional excluído com sucesso!');
                    // Atualizar o grupo atual para refletir a exclusão
                    buscarGrupoAdicionalPorId(grupoId);
                }
            } catch (error) {
                console.error('Erro ao excluir adicional:', error.response?.data || error.message);
                setErro(error.response?.data || 'Erro ao excluir adicional. Por favor, tente novamente.');
            } finally {
                setCarregando(false);
            }
        }
    };

    // Renderização da lista de grupos de adicionais
    const renderizarListaGrupos = () => {
        // Configurações dinâmicas para estados
        const states = {
            loading: {
                render: () => (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mr-3" />
                        <p className="text-indigo-600 font-medium">Carregando grupos...</p>
                    </div>
                ),
                condition: carregando && gruposAdicionais.length === 0,
            },
            error: {
                render: () => (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-2">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700">{erro}</p>
                        </div>
                    </div>
                ),
                condition: erro && gruposAdicionais.length === 0,
            },
            empty: {
                render: () => (
                    <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">Nenhum grupo encontrado</h3>
                        <p className="text-gray-500 text-sm mb-3">Crie seu primeiro grupo de adicionais</p>
                        <button
                            onClick={iniciarCriacaoGrupo}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg shadow hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all duration-300"
                        >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Criar Primeiro Grupo
                        </button>
                    </div>
                ),
                condition: gruposAdicionais.length === 0,
            },
        };

        // Verifica e renderiza estado correspondente
        const activeState = Object.values(states).find(state => state.condition);
        if (activeState) return activeState.render();

        // Componentes reutilizáveis
        const StatusBadge = ({ ativo }) => (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {ativo ? 'Ativo' : 'Inativo'}
            </span>
        );

        const AdicionalCard = ({ adicional }) => (
            <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm hover:shadow hover:border-indigo-200 transition-all duration-200 flex flex-col h-full">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-800 truncate text-sm">{adicional.nome}</h4>
                    <span className="text-indigo-600 font-bold text-sm">
                        R$ {adicional.precoBase.toFixed(2).replace('.', ',')}
                    </span>
                </div>
                <p className="mt-1 text-xs text-gray-600 line-clamp-1">{adicional.descricao}</p>
                <div className="flex justify-between items-center mt-1">
                    {adicional.maximoPorProduto && (
                        <div className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            <span className="text-xs">Máx: {adicional.maximoPorProduto}</span>
                        </div>
                    )}
                    {!adicional.ativo && <StatusBadge ativo={false} />}
                </div>
            </div>
        );

        return (
            <div className="space-y-3">
                {gruposAdicionais.map(grupo => (
                    <div key={grupo.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow transition-all duration-300">
                        <div className="p-3 flex justify-between items-center border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white p-1.5 rounded-md shadow-sm">
                                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="flex items-center">
                                        <h3 className="font-bold text-gray-800">{grupo.nome}</h3>
                                        <StatusBadge ativo={grupo.ativo} />
                                    </div>
                                    <span className="text-xs text-gray-500">{grupo.adicionais?.length || 0} itens</span>
                                </div>
                            </div>

                            <div className="flex space-x-1">
                                <button
                                    onClick={() => buscarGrupoAdicionalPorId(grupo.id)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                    title="Editar"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => excluirGrupo(grupo.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Excluir"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-2 bg-gray-50">
                            {grupo.adicionais?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {grupo.adicionais.map(adicional => (
                                        <AdicionalCard key={adicional.id} adicional={adicional} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Sem adicionais</span>
                                    <button
                                        onClick={() => buscarGrupoAdicionalPorId(grupo.id)}
                                        className="ml-2 inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
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
    // Renderização do formulário para criar/editar grupo de adicionais
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

                <div className="flex space-x-4">
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
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Adicionais</h3>

                    {adicionais.length > 0 ? (
                        <div className="space-y-2 mb-4">
                            {adicionais.map((adicional, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Nome</label>
                                            <input
                                                type="text"
                                                name="nome"
                                                value={adicional.nome}
                                                onChange={(e) => handleAdicionalChange(index, e)}
                                                required
                                                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Preço</label>
                                            <input
                                                type="number"
                                                name="preco"
                                                value={adicional.preco}
                                                onChange={(e) => handleAdicionalChange(index, e)}
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
                                            value={adicional.descricao}
                                            onChange={(e) => handleAdicionalChange(index, e)}
                                            required
                                            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            rows="2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Máximo por Produto</label>
                                            <input
                                                type="number"
                                                name="maximoPorProduto"
                                                value={adicional.maximoPorProduto}
                                                onChange={(e) => handleAdicionalChange(index, e)}
                                                min="1"
                                                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                placeholder="Sem limite"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="ativo"
                                                    id={`adicional-ativo-${index}`}
                                                    checked={adicional.ativo}
                                                    onChange={(e) => handleAdicionalChange(index, e)}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <label htmlFor={`adicional-ativo-${index}`} className="ml-2 block text-sm text-gray-700">
                                                    Ativo
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removerAdicional(index)}
                                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                        >
                                            Remover
                                        </button>
                                        {/* Botão de excluir aparece apenas para adicionais já existentes com ID */}
                                        {modo === 'editar' && adicional.id && (
                                            <button
                                                type="button"
                                                onClick={() => excluirAdicional(grupoAtual.id, adicional.id)}
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
                        <p className="text-gray-500 mb-4">Nenhum adicional adicionado. Adicione pelo menos um adicional.</p>
                    )}
                    <div className="p-3 bg-gray-100 rounded border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Novo Adicional</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div>
                                <input
                                    type="text"
                                    name="nome"
                                    value={novoAdicional.nome}
                                    onChange={handleNovoAdicionalChange}
                                    placeholder="Nome do Adicional"
                                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    name="preco"
                                    value={novoAdicional.preco}
                                    onChange={handleNovoAdicionalChange}
                                    placeholder="Preço do Adicional"
                                    step="0.01"
                                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                            </div>
                        </div>
                        <div className="mb-2">
                            <textarea
                                name="descricao"
                                value={novoAdicional.descricao}
                                onChange={handleNovoAdicionalChange}
                                placeholder="Descrição do Adicional"
                                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                rows="2"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div>
                                <input
                                    type="number"
                                    name="maximoPorProduto"
                                    value={novoAdicional.maximoPorProduto}
                                    onChange={handleNovoAdicionalChange}
                                    placeholder="Máximo por produto (opcional)"
                                    min="1"
                                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <span className="text-xs text-gray-500 mt-1 block">
                                    Deixe em branco para não definir limite
                                </span>
                            </div>
                            <div className="flex items-end">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="ativo"
                                        id="novo-adicional-ativo"
                                        checked={novoAdicional.ativo}
                                        onChange={handleNovoAdicionalChange}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="novo-adicional-ativo" className="ml-2 block text-sm text-gray-700">
                                        Ativo
                                    </label>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={adicionarAdicional}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Adicionar Adicional
                        </button>
                    </div>
                </div>
                {erro && <p className="text-red-600">{erro}</p>}
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={voltarParaLista}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={carregando}
                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                    >
                        {carregando ? 'Salvando...' : (modo === 'criar' ? 'Criar Grupo' : 'Atualizar Grupo')}
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
                            {modo === 'listar' ? 'Gerenciamento de Adicionais' :
                                modo === 'criar' ? 'Criar Grupo de Adicionais' : 'Editar Grupo de Adicionais'}
                        </h2>
                        {modo === 'listar' && (
                            <button
                                onClick={iniciarCriacaoGrupo}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Criar Novo Grupo de Adicionais
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4">
                    {modo === 'listar' && renderizarListaGrupos()}
                    {(modo === 'criar' || modo === 'editar') && renderizarFormularioGrupo()}
                </div>
            </div>

            {/* Indicador de carregamento */}
            {carregando && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <p className="text-gray-700">Processando...</p>
                    </div>
                </div>
            )}
        </div>
    );

};
export default GerenciamentoAdicionais;