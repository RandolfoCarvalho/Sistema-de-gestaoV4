import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import EditarProdutoModal from './EditarProdutoModal';
import api from '../../../axiosConfig';

const GestaoComponent = () => {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [produtosResponse, categoriasResponse] = await Promise.all([
                    api.get('/api/1.0/Produto/ListarProdutos'),
                    api.get('/api/1.0/Categoria/ListarCategorias')
                ]);

                setProdutos(produtosResponse.data);
                setCategorias(categoriasResponse.data);
                setLoading(false);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const produtosFiltrados = categoriaSelecionada === 'todas'
        ? produtos
        : produtos.filter(produto => produto.categoriaId === parseInt(categoriaSelecionada));

    const produtosPorCategoria = categoriaSelecionada === 'todas'
        ? categorias.reduce((acc, categoria) => {
            acc[categoria.id] = produtos.filter(produto => produto.categoriaId === categoria.id);
            return acc;
        }, {})
        : { [categoriaSelecionada]: produtosFiltrados };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Você tem certeza?',
            text: 'Esse produto será excluído!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/DeletarProduto/${id}`);
                setProdutos(produtos.filter(produto => produto.id !== id));

                Swal.fire({
                    title: 'Produto excluído!',
                    text: 'O produto foi excluído com sucesso.',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });
            } catch (error) {
                console.error('Erro ao excluir produto:', error);

                Swal.fire({
                    title: 'Erro!',
                    text: 'Ocorreu um erro ao excluir o produto. Por favor, tente novamente.',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
            }
        }
    };

    const handleEdit = (produto) => {
        console.log("Produto a ser editado:", produto);
        setProdutoEditando(produto);
        setModalAberto(true);
    };

    const handleSaveEdit = (produtoAtualizado) => {
        setProdutos(produtos.map(p =>
            p.id === produtoAtualizado.id ? produtoAtualizado : p
        ));
        setModalAberto(false);
    };

    const handleSimularPedido = (id) => {
        console.log('Simular pedido para produto:', id);
    };

    if (loading) {
        return <div style={styles.loading}>Carregando...</div>;
    }
    if (error) {
        return <div style={styles.error}>{error}</div>;
    }
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Gestão de Produtos</h1>

            <div style={styles.filterContainer}>
                <select
                    value={categoriaSelecionada}
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                    style={styles.select}
                >
                    <option value="todas">Todas as Categorias</option>
                    {categorias.map(categoria => (
                        <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                        </option>
                    ))}
                </select>
            </div>
            {Object.entries(produtosPorCategoria).map(([categoriaId, produtos]) => {
                const categoria = categorias.find(cat => cat.id === parseInt(categoriaId));
                if (!produtos || produtos.length === 0) return null;

                return (
                    <div key={categoriaId} style={styles.categorySection}>
                        <h2 style={styles.categoryTitle}>{categoria?.nome || 'Sem Categoria'}</h2>
                        <div style={styles.grid}>
                            {produtos.map(produto => (
                                <div key={produto.id} style={styles.card}>
                                    <img
                                        src={produto.imagemPrincipalUrl || '/api/placeholder/400/300'}
                                        alt={produto.nome}
                                        style={styles.image}
                                    />
                                    <div style={styles.cardContent}>
                                        <h2 style={styles.productName}>{produto.nome}</h2>
                                        <p style={styles.productDescription}>{produto.descricao}</p>
                                        <p style={styles.productPrice}>
                                            R$ {produto.precoVenda?.toFixed(2) || '0.00'}
                                        </p>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                onClick={() => handleSimularPedido(produto.id)}
                                                style={styles.button}
                                            >
                                                Simular Pedido
                                            </button>
                                            <button
                                                onClick={() => handleEdit(produto)}
                                                style={styles.button}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(produto.id)}
                                                style={{ ...styles.button, ...styles.deleteButton }}
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {!Object.values(produtosPorCategoria).flat().length && (
                <p style={styles.emptyMessage}>Nenhum produto encontrado.</p>
            )}

            {/* Integração do EditarProdutoModal */}
            <EditarProdutoModal
                produto={produtoEditando}
                modalAberto={modalAberto}
                setModalAberto={setModalAberto}
                onSave={handleSaveEdit}
            />
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    filterContainer: {
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    select: {
        padding: '8px 12px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        backgroundColor: '#fff',
        cursor: 'pointer',
        minWidth: '200px',
    },
    categorySection: {
        marginBottom: '40px',
    },
    categoryTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '20px',
        borderBottom: '2px solid #4a90e2',
        paddingBottom: '10px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '20px',
        textAlign: 'center',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        margin: '0 auto',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        width: '100%',
    },
    image: {
        width: '100%',
        height: '180px',
        objectFit: 'cover',
    },
    cardContent: {
        padding: '15px',
    },
    productName: {
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333',
    },
    productDescription: {
        fontSize: '13px',
        color: '#666',
        marginBottom: '8px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        '-webkit-line-clamp': '2',
        '-webkit-box-orient': 'vertical',
    },
    productPrice: {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: '12px',
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '5px',
    },
    button: {
        padding: '6px 8px',
        backgroundColor: '#4a90e2',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        flex: '1',
        whiteSpace: 'nowrap',
    },
    deleteButton: {
        backgroundColor: '#ff4d4d',
    },
    emptyMessage: {
        textAlign: 'center',
        fontSize: '18px',
        color: '#666',
        marginTop: '40px',
    },
    loading: {
        textAlign: 'center',
        fontSize: '18px',
        color: '#333',
        marginTop: '40px',
    },
    error: {
        textAlign: 'center',
        fontSize: '18px',
        color: '#ff4d4d',
        marginTop: '40px',
    },
};

export default GestaoComponent;