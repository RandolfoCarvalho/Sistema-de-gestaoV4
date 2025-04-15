import React, { useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

const FinalUserModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        dataCriacao: new Date().toISOString()
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/VerificarTelefone`,
                formData
            );

            if (response.data) {
                // Armazene no localStorage a informação de que o usuário está autenticado
                localStorage.setItem("userId", response.data.id);
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("FinalUserTelefone", formData.telefone);
                // Passar os dados do usuário para o componente pai
                onSuccess({
                    ...response.data,
                    FinalUserName: formData.nome,
                    FinalUserTelefone: formData.telefone
                });
            } else {
                setError('Erro ao cadastrar usuário. Tente novamente.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao cadastrar usuário');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => { }} // Remove a funcionalidade de fechar ao clicar fora
            shouldCloseOnOverlayClick={false} // Impede o fechamento ao clicar fora
            contentLabel="Identifique-se"
            className="bg-white p-6 rounded-lg max-w-md mx-auto mt-20"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
            <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-medium">Identifique-se</h2>
                </div>
                <div> <h1 className="text-xl font-medium">Finalize seu pedido em instantes</h1> </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="telefone" className="block text-sm font-medium">
                            Seu número de WhatsApp é:
                        </label>
                        <input
                            type="tel"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            placeholder="(__) _____-____"
                            className="w-full p-2 border rounded-md bg-gray-50"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="nome" className="block text-sm font-medium">
                            Seu nome e sobrenome:
                        </label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            placeholder="Nome e sobrenome"
                            className="w-full p-2 border rounded-md bg-gray-50"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-md text-center ${loading
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                    >
                        {loading ? 'Aguarde...' : 'Avançar'}
                    </button>

                    <p className="text-sm text-center text-gray-600">
                        Para realizar seu pedido vamos precisar de suas informações, este é um ambiente protegido.
                    </p>
                </form>
            </div>
        </Modal>
    );
};

export default FinalUserModal;