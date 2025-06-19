import React, { useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';

const FinalUserModal = ({ isOpen, onClose, onSuccess }) => {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [isNomeRequired, setIsNomeRequired] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTelefoneChange = (e) => {
        setTelefone(e.target.value);
        if (isNomeRequired) {
            setIsNomeRequired(false);
            setNome('');
        }
    };

    const handleTelefoneBlur = async () => {
        const telefoneNumerico = telefone.replace(/\D/g, '');
        if (telefoneNumerico.length !== 11) return;

        setLoading(true);
        setError('');
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/login`, { Telefone: telefoneNumerico });
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setIsNomeRequired(true);
            } else {
                setError('Não foi possível verificar o telefone. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const telefoneNumerico = telefone.replace(/\D/g, '');

        if (!/^\d{11}$/.test(telefoneNumerico)) {
            setError('Formato de telefone inválido. Deve conter exatamente 11 dígitos (DDD + número).');
            setLoading(false);
            return;
        }

        if (isNomeRequired && !nome.trim()) {
            setError('Por favor, informe seu nome para o cadastro.');
            setLoading(false);
            return;
        }

        const userData = {
            nome: nome,
            telefone: telefoneNumerico
        };

        if (onSuccess) {
            onSuccess(userData);
        }
    };

    const handleClose = () => {
        setNome('');
        setTelefone('');
        setIsNomeRequired(false);
        setError('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            shouldCloseOnOverlayClick={true}
            contentLabel="Identifique-se"
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-11/12 mx-auto my-20 focus:outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            appElement={document.getElementById('root') || undefined}
        >
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Identifique-se para continuar</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-800"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    Para finalizar seu pedido, precisamos de algumas informações.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                            Número de WhatsApp (DDD + Número)
                        </label>
                        <input
                            type="tel"
                            id="telefone"
                            name="telefone"
                            value={telefone}
                            onChange={handleTelefoneChange}
                            onBlur={handleTelefoneBlur}
                            placeholder="Ex: 64992094652"
                            className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={loading}
                        />
                    </div>

                    {isNomeRequired && (
                        <div className="animate-fade-in">
                            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                                Parece que é sua primeira vez! Qual seu nome?
                            </label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Nome e Sobrenome"
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-red-600 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-md font-semibold text-white transition-colors duration-200 ${
                            loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'Aguarde...' : 'Continuar'}
                    </button>

                    <p className="text-xs text-center text-gray-500 pt-2">
                        Seus dados estão seguros conosco e serão usados apenas para o seu pedido.
                    </p>
                </form>
            </div>
        </Modal>
    );
};

export default FinalUserModal;