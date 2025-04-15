import { useState, useEffect } from 'react';
import axios from 'axios';

const useLojaData = (nomeDaLoja) => {
    const [lojaInfo, setLojaInfo] = useState(null);
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const lojaResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/BuscarPorSlug/${nomeDaLoja}`);
                if (!lojaResponse.data) throw new Error('Loja não encontrada');
                setLojaInfo(lojaResponse.data);

                const [produtosResponse, categoriasResponse] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/ListarProdutosPorLoja/${lojaResponse.data.id}`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Categoria/ListarCategoriasPorLoja/${lojaResponse.data.id}`)
                ]);

                setProdutos(produtosResponse.data || []);
                setCategorias(categoriasResponse.data || []);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [nomeDaLoja]);

    return { lojaInfo, produtos, categorias, loading };
};

export default useLojaData;
