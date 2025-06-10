import { useState, useEffect } from "react";
import axios from "axios";
import { useStore } from "../../Context/StoreContext";

export const useSearchProducts = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(false);
     const { currentStore } = useStore();
    useEffect(() => {
        const fetchProdutos = async () => {
            if (!currentStore || searchTerm.trim() === "") {
                setProdutos([]);
                return;
            }
            try {
                setLoading(true);
                const lojaResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/BuscarPorSlug/${currentStore}`);
                if (!lojaResponse.data) throw new Error("Loja não encontrada");

                const produtosResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/ListarProdutosPorLoja/${lojaResponse.data.id}`);
                setProdutos(produtosResponse.data.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())));
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
                setProdutos([]);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => fetchProdutos(), 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentStore]);

    return { searchTerm, setSearchTerm, produtos, loading };
};
