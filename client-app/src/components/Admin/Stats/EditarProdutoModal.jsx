import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const EditarProdutoModal = ({ produto, modalAberto, setModalAberto, onSave }) => {
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [gruposComplemento, setGruposComplemento] = useState([]);
    const [gruposAdicional, setGruposAdicional] = useState([]);
    const [complementosSelecionados, setComplementosSelecionados] = useState([]);
    const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);
    const [salvarMudancas, setSalvarMudancas] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [gruposComplementoRes, gruposAdicionalRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Complemento/ListarGrupoComplementos`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ListarGrupoAdicionais`)
                ]);

                setGruposComplemento(gruposComplementoRes.data);
                setGruposAdicional(gruposAdicionalRes.data);

                // Se o produto tem complementos e adicionais, busque os detalhes
                if (produto) {
                    const [complementosProdutoRes, adicionaisProdutoRes] = await Promise.all([
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Complemento/ObterComplementos/${produto.id}`),
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ObterAdicionais/${produto.id}`)
                    ]);

                    // Certifique-se de obter arrays válidos, mesmo que vazios
                    const complementos = complementosProdutoRes.data || [];
                    const adicionais = adicionaisProdutoRes.data || [];

                    // Limpe os estados antes de definir novos valores
                    setComplementosSelecionados([]);
                    setAdicionaisSelecionados([]);

                    // Atribua os novos valores aos estados
                    setTimeout(() => {
                        setComplementosSelecionados(complementos);
                        setAdicionaisSelecionados(adicionais);
                    }, 0);

                    // Inicializa o estado do produto com todos os valores, incluindo o Ativo
                    setProdutoEditando({
                        ...produto,
                        ativo: produto.ativo
                    });
                }

                setLoading(false);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                Swal.fire({
                    title: 'Erro!',
                    text: 'Ocorreu um erro ao carregar os dados. Por favor, tente novamente.',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
                setLoading(false);
            }
        };

        if (modalAberto && produto) {
            fetchData();
        } else {
            // Limpar estados quando o modal for fechado
            setComplementosSelecionados([]);
            setAdicionaisSelecionados([]);
        }
    }, [modalAberto, produto]);


    const salvarEdicao = async () => {
        try {
            setLoading(true);
            const formData = new FormData();

            // Adiciona as propriedades básicas do produto
            formData.append("Id", produtoEditando.id);
            formData.append("Nome", produtoEditando.nome);
            formData.append("PrecoVenda", produtoEditando.precoVenda);
            formData.append("Descricao", produtoEditando.descricao || '');
            formData.append("CategoriaId", produtoEditando.categoriaId);
            formData.append("Ativo", produtoEditando.ativo.toString());
            formData.append("EstoqueAtual", produtoEditando.estoqueAtual);
            formData.append("EstoqueMinimo", produtoEditando.estoqueMinimo || 0);
            formData.append("UnidadeMedida", produtoEditando.unidadeMedida || '');
            formData.append("PrecoCusto", produtoEditando.precoCusto || 0);

            // Se houver uma nova imagem, adicione-a ao FormData
            if (produtoEditando.novaImagem) {
                formData.append("ImagemPrincipalUrl", produtoEditando.novaImagem);
            }

            // Garante que as variáveis são arrays válidos
            const complementos = Array.isArray(complementosSelecionados) ? complementosSelecionados : [];
            const adicionais = Array.isArray(adicionaisSelecionados) ? adicionaisSelecionados : [];

            // Adicionar flags para controlar a atualização de complementos e adicionais
            const atualizarComplementos = activeTab === 'complementos' || complementos.length > 0;
            formData.append("AtualizarComplementos", atualizarComplementos.toString());

            const atualizarAdicionais = activeTab === 'adicionais' || adicionais.length > 0;
            formData.append("AtualizarAdicionais", atualizarAdicionais.toString());

            // Adicionar IDs dos complementos selecionados
            complementos.forEach((complemento, index) => {
                formData.append(`ComplementosIds[${index}]`, complemento.id);
            });

            // Adicionar IDs dos adicionais selecionados
            adicionais.forEach((adicional, index) => {
                formData.append(`AdicionaisIds[${index}]`, adicional.id);
            });

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/1.0/Produto/AtualizarProdutoV2`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setLoading(false);
            setModalAberto(false);
            if (onSave) {
                onSave(response.data);
            }

            Swal.fire({
                title: "Sucesso!",
                text: "Produto atualizado com sucesso!",
                icon: "success",
                confirmButtonText: "Ok",
            });

        } catch (error) {
            setLoading(false);
            console.error("Erro ao atualizar produto:", error);

            const errorMessage = error.response?.data?.message ||
                "Ocorreu um erro ao atualizar o produto. Por favor, verifique os dados e tente novamente.";

            Swal.fire({
                title: "Erro!",
                text: errorMessage,
                icon: "error",
                confirmButtonText: "Ok",
            });
        }
    };



    /*async function toggleAdicional1(adicionalId) {
        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/1.0/Adicional/toggle/${adicionalId}`,
                null,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (response.status === 200) {
                setAdicionaisSelecionados(prevState => {
                   
                    const isSelected = prevState.some(a => a.id === adicionalId);
                    if (isSelected) {
                        return prevState.filter(a => a.id !== adicionalId);
                    } else {
                        return [...prevState, { id: adicionalId }];
                    }
                });
            } else {
                throw new Error("Erro ao atualizar o adicional");
            }
        } catch (error) {
            console.error(error);
            alert("Falha ao atualizar o adicional.");
        }
    }

    async function toggleAdicional1(adicionalId) {
        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/1.0/Adicional/toggle/${adicionalId}`,
                null,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (response.status === 200) {
                setAdicionaisSelecionados(prevState => {

                    const isSelected = prevState.some(a => a.id === adicionalId);
                    if (isSelected) {
                        return prevState.filter(a => a.id !== adicionalId);
                    } else {
                        return [...prevState, { id: adicionalId }];
                    }
                });
            } else {
                throw new Error("Erro ao atualizar o adicional");
            }
        } catch (error) {
            console.error(error);
            alert("Falha ao atualizar o adicional.");
        }
    }

    async function toggleComplemento(complementoId) {
        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/1.0/Complemento/toggle/${complementoId}`,
                null,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (response.status === 200) {
                setComplementosSelecionados(prevState => {

                    const isSelected = prevState.some(a => a.id === complementoId);
                    if (isSelected) {
                        return prevState.filter(a => a.id !== complementoId);
                    } else {
                        return [...prevState, { id: complementoId }];
                    }
                });
            } else {
                throw new Error("Erro ao atualizar o complemento");
            }
        } catch (error) {
            console.error(error);
            alert("Falha ao atualizar o complemento.");
        }
    }*/


    const isComplementoSelecionado = (complementoId) => {
        return complementosSelecionados.some(c => c.id === complementoId);
    };

   

    if (!modalAberto || !produtoEditando) {
        return null;
    }

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2 style={styles.modalTitle}>Editar Produto: {produtoEditando.nome}</h2>

                {loading ? (
                    <div style={styles.loading}>Carregando...</div>
                ) : (
                    <>
                        <div style={styles.tabs}>
                            <button
                                style={{
                                    ...styles.tabButton,
                                    ...(activeTab === 'info' ? styles.activeTab : {})
                                }}
                                onClick={() => setActiveTab('info')}
                            >
                                Informações Básicas
                            </button>
                            <button
                                style={{
                                    ...styles.tabButton,
                                    ...(activeTab === 'complementos' ? styles.activeTab : {})
                                }}
                                onClick={() => setActiveTab('complementos')}
                            >
                                Complementos
                            </button>
                            <button
                                style={{
                                    ...styles.tabButton,
                                    ...(activeTab === 'adicionais' ? styles.activeTab : {})
                                }}
                                onClick={() => setActiveTab('adicionais')}
                            >
                                Adicionais
                            </button>
                        </div>

                        <div style={styles.tabContent}>
                            {activeTab === 'info' && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Nome:</label>
                                        <input
                                            type="text"
                                            value={produtoEditando.nome || ''}
                                            onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.row}>
                                        <div style={styles.column}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Preço de Venda (R$):</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={produtoEditando.precoVenda || ''}
                                                    onChange={(e) => setProdutoEditando({ ...produtoEditando, precoVenda: parseFloat(e.target.value) })}
                                                    style={styles.input}
                                                />
                                            </div>
                                        </div>
                                        <div style={styles.column}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Preço de Custo (R$):</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={produtoEditando.precoCusto || ''}
                                                    onChange={(e) => setProdutoEditando({ ...produtoEditando, precoCusto: parseFloat(e.target.value) })}
                                                    style={styles.input}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Descrição:</label>
                                        <textarea
                                            value={produtoEditando.descricao || ''}
                                            onChange={(e) => setProdutoEditando({ ...produtoEditando, descricao: e.target.value })}
                                            style={{ ...styles.input, ...styles.textarea }}
                                        />
                                    </div>

                                    <div style={styles.row}>
                                        <div style={styles.column}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Estoque Atual:</label>
                                                <input
                                                    type="number"
                                                    value={produtoEditando.estoqueAtual || 0}
                                                    onChange={(e) => setProdutoEditando({ ...produtoEditando, estoqueAtual: parseInt(e.target.value) })}
                                                    style={styles.input}
                                                />
                                            </div>
                                        </div>
                                        <div style={styles.column}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Estoque Mínimo:</label>
                                                <input
                                                    type="number"
                                                    value={produtoEditando.estoqueMinimo || 0}
                                                    onChange={(e) => setProdutoEditando({ ...produtoEditando, estoqueMinimo: parseInt(e.target.value) })}
                                                    style={styles.input}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Unidade de Medida:</label>
                                        <select
                                            value={produtoEditando.unidadeMedida || ''}
                                            onChange={(e) => setProdutoEditando({ ...produtoEditando, unidadeMedida: e.target.value })}
                                            style={styles.input}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="UN">Unidade (UN)</option>
                                            <option value="KG">Quilograma (KG)</option>
                                            <option value="L">Litro (L)</option>
                                        </select>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Imagem:</label>
                                        <div style={styles.imagePreviewContainer}>
                                            {produtoEditando.imagemPrincipalUrl && (
                                                <img
                                                    src={produtoEditando.imagemPrincipalUrl}
                                                    alt={produtoEditando.nome}
                                                    style={styles.imagePreview}
                                                />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setProdutoEditando({ ...produtoEditando, novaImagem: e.target.files[0] })}
                                                style={styles.fileInput}
                                            />
                                        </div>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={produtoEditando.ativo}
                                                onChange={(e) => setProdutoEditando({ ...produtoEditando, ativo: e.target.checked })}
                                            />
                                            Produto ativo
                                        </label>
                                    </div>
                                </>
                            )}

                        {/*activeTab === 'complementos' && (
                            <div>
                                <h3 style={styles.sectionTitle}>Grupos de Complementos</h3>
                                {gruposComplemento.length === 0 ? (
                                    <p style={styles.emptyMessage}>Nenhum grupo de complementos disponível.</p>
                                ) : (
                                    gruposComplemento.map(grupo => (
                                        <div key={grupo.id} style={styles.grupoCard}>
                                            <div style={styles.grupoHeader}>
                                                <h4>{grupo.nome}</h4>
                                                <p style={styles.grupoMeta}>
                                                    {grupo.obrigatorio ? 'Obrigatório' : 'Opcional'} •
                                                    Min: {grupo.quantidadeMinima || 0} •
                                                    Max: {grupo.quantidadeMaxima || 'Ilimitado'}
                                                </p>
                                            </div>
                                            <div style={styles.itemsList}>
                                                {grupo.complementos?.map(complemento => (
                                                    <div
                                                        key={complemento.id}
                                                        style={{
                                                            ...styles.itemCheck,
                                                            ...(complementosSelecionados.some(c => c.id === complemento.id) ? styles.itemSelected : {}),
                                                            ...(complemento.ativo === false ? { opacity: 0.5 } : {}) // Adiciona opacidade reduzida se não estiver ativo
                                                        }}
                                                        onClick={() => toggleComplemento(complemento.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={complementosSelecionados.some(c => c.id === complemento.id) && complemento.ativo !== false}
                                                            disabled={complemento.ativo === false}
                                                            onChange={() => { }}
                                                            style={styles.checkboxInput}
                                                        />
                                                        <div style={styles.itemDetails}>
                                                            <span style={styles.itemName}>
                                                                {complemento.nome}
                                                                {complemento.ativo === false && " (Inativo)"}
                                                            </span>
                                                            {complemento.preco > 0 && (
                                                                <span style={styles.itemPrice}>R$ {complemento.preco.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                                )}

                                {activeTab === 'adicionais' && (
                                    <div>
                                        <h3 style={styles.sectionTitle}>Grupos de Adicionais</h3>
                                        {gruposAdicional.length === 0 ? (
                                            <p style={styles.emptyMessage}>Nenhum grupo de adicionais disponível.</p>
                                        ) : (
                                            gruposAdicional.map(grupo => (
                                                <div key={grupo.id} style={styles.grupoCard}>
                                                    <div style={styles.grupoHeader}>
                                                        <h4>{grupo.nome}</h4>
                                                        <p style={styles.grupoMeta}>
                                                            Limite de seleção: {grupo.limiteSelecao || 'Ilimitado'}
                                                        </p>
                                                    </div>
                                                    <div style={styles.itemsList}>
                                                        {grupo.adicionais?.map(adicional => (
                                                            <div
                                                                key={adicional.id}
                                                                style={{
                                                                    ...styles.itemCheck,
                                                                    ...(adicionaisSelecionados.some(a => a.id === adicional.id) ? styles.itemSelected : {}),
                                                                    ...(adicional.ativo === false ? { opacity: 0.5 } : {}) // Opacidade reduzida se inativo
                                                                }}
                                                                onClick={() => toggleAdicional1(adicional.id)} // Passando id do adicional
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={adicionaisSelecionados.some(a => a.id === adicional.id) && adicional.ativo !== false}
                                                                    disabled={adicional.ativo === false}
                                                                    onChange={() => { }} // Não é necessário manipular o onChange aqui
                                                                    style={styles.checkboxInput}
                                                                />
                                                                <div style={styles.itemDetails}>
                                                                    <span style={styles.itemName}>
                                                                        {adicional.nome}
                                                                        {adicional.ativo === false && " (Inativo)"}
                                                                    </span>
                                                                    {adicional.precoBase > 0 && (
                                                                        <span style={styles.itemPrice}>R$ {adicional.precoBase.toFixed(2)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )*/}

                        </div>

                        <div style={styles.modalButtons}>
                            <button
                                onClick={salvarEdicao}
                                style={{ ...styles.button, ...styles.saveButton }}
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                                onClick={() => setModalAberto(false)}
                                style={{ ...styles.button, ...styles.cancelButton }}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const styles = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
    },
    modalTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#333',
    },
    tabs: {
        display: 'flex',
        marginBottom: '20px',
        borderBottom: '1px solid #ddd',
    },
    tabButton: {
        padding: '10px 15px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: '#666',
        borderBottom: '3px solid transparent',
    },
    activeTab: {
        color: '#4a90e2',
        borderBottomColor: '#4a90e2',
    },
    tabContent: {
        maxHeight: '60vh',
        overflow: 'auto',
        paddingRight: '10px',
    },
    row: {
        display: 'flex',
        marginBottom: '15px',
        gap: '15px',
    },
    column: {
        flex: 1,
    },
    formGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        color: '#666',
        fontSize: '14px',
    },
    input: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '14px',
    },
    textarea: {
        minHeight: '100px',
        resize: 'vertical',
    },
    checkbox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#666',
        cursor: 'pointer',
    },
    imagePreviewContainer: {
        marginTop: '10px',
    },
    imagePreview: {
        maxWidth: '100%',
        maxHeight: '200px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
    },
    fileInput: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '14px',
    },
    modalButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
    },
    button: {
        padding: '10px 15px',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#999',
    },
    loading: {
        textAlign: 'center',
        padding: '20px',
        fontSize: '16px',
        color: '#666',
    },
    sectionTitle: {
        fontSize: '18px',
        color: '#333',
        marginBottom: '15px',
    },
    grupoCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: '6px',
        padding: '15px',
        marginBottom: '15px',
        border: '1px solid #eee',
    },
    grupoHeader: {
        marginBottom: '10px',
    },
    grupoMeta: {
        fontSize: '12px',
        color: '#666',
        marginTop: '5px',
    },
    itemsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    itemCheck: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 10px',
        backgroundColor: '#fff',
        borderRadius: '4px',
        border: '1px solid #eee',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    itemSelected: {
        backgroundColor: '#e6f7ff',
        borderColor: '#4a90e2',
    },
    checkboxInput: {
        marginRight: '10px',
    },
    itemDetails: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    itemName: {
        fontSize: '14px',
    },
    itemPrice: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    emptyMessage: {
        textAlign: 'center',
        padding: '20px',
        color: '#666',
        fontStyle: 'italic',
    },
};

export default EditarProdutoModal;