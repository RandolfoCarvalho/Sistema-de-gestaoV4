import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from "@utils/alerts";
import { formatPriceToInvariantBackend } from "@utils/formatters";

const EditarProdutoModal = ({ produto, modalAberto, setModalAberto, onSave }) => {
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [gruposComplemento, setGruposComplemento] = useState([]);
    const [gruposAdicional, setGruposAdicional] = useState([]);
    const [complementosSelecionados, setComplementosSelecionados] = useState([]);
    const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);
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

                if (produto) {
                    const [complementosProdutoRes, adicionaisProdutoRes] = await Promise.all([
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Complemento/ObterComplementos/${produto.id}`),
                        axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ObterAdicionais/${produto.id}`)
                    ]);

                    const complementos = complementosProdutoRes.data || [];
                    const adicionais = adicionaisProdutoRes.data || [];

                    setComplementosSelecionados([]);
                    setAdicionaisSelecionados([]);

                    setTimeout(() => {
                        setComplementosSelecionados(complementos);
                        setAdicionaisSelecionados(adicionais);
                    }, 0);

                    setProdutoEditando({
                        ...produto,
                        ativo: produto.ativo
                    });
                }

                setLoading(false);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                showError("Erro!", "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
                setLoading(false);
            }
        };

        if (modalAberto && produto) {
            fetchData();
        } else {
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
            formData.append("PrecoVenda", formatPriceToInvariantBackend(produtoEditando.precoVenda));
            formData.append("PrecoCusto", formatPriceToInvariantBackend(produtoEditando.precoCusto));
            formData.append("Descricao", produtoEditando.descricao || '');
            formData.append("CategoriaId", produtoEditando.categoriaId);
            formData.append("Ativo", produtoEditando.ativo.toString());
            formData.append("EstoqueAtual", produtoEditando.estoqueAtual);
            formData.append("EstoqueMinimo", produtoEditando.estoqueMinimo || 0);
            formData.append("UnidadeMedida", produtoEditando.unidadeMedida || '');

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
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            setLoading(false);
            setModalAberto(false);
            if (onSave) {
            onSave(response.data);
            }

            showSuccess("Sucesso!", "Produto atualizado com sucesso!");
        } catch (error) {
            setLoading(false);
            console.error("Erro ao atualizar produto:", error);
            const errorMessage =
            error.response?.data?.message ||
            "Ocorreu um erro ao atualizar o produto. Por favor, verifique os dados e tente novamente.";

            showError("Erro!", errorMessage);
        }
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
                                                    type="text"
                                                    value={produtoEditando.precoVenda || ''}
                                                    onChange={(e) =>
                                                        setProdutoEditando({ ...produtoEditando, precoVenda: e.target.value })
                                                    }
                                                    style={styles.input}
                                                />
                                            </div>
                                        </div>
                                        <div style={styles.column}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Preço de Custo (R$):</label>
                                                <input
                                                    type="text"
                                                    step="0.01"
                                                    value={produtoEditando.precoCusto || ''}
                                                    onChange={(e) => setProdutoEditando({ ...produtoEditando, precoCusto: e.target.value })}
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