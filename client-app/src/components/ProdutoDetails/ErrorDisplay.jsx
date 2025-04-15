import React from 'react';

const ErrorDisplay = ({ error }) => {
    return (
        <div className="fixed inset-0 bg-white flex items-center justify-center">
            <div className="text-center">
                <p className="text-red-600 mb-4">{error || 'Produto não encontrado'}</p>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                    Voltar
                </button>
            </div>
        </div>
    );
};

export default ErrorDisplay;