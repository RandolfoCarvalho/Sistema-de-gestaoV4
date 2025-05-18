const PixPaymentSection = ({ pixData, onCopyPixCode, onClose, countdown, onVerificarPagamento, mensagem }) => {
    const minutos = Math.floor(countdown / 60);
    const segundos = String(countdown % 60).padStart(2, '0');

    return (
        <div className="text-center space-y-4 my-4">
            <p className="font-medium">Pague com PIX para confirmar seu pedido!</p>
            <p className="text-sm text-gray-600">Escaneie o QR Code abaixo com o app do seu banco:</p>

            <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-[300px] h-[300px] mx-auto"
            />

            <p className="text-sm text-gray-600 mt-4">Ou copie o código PIX:</p>
            <div className="relative">
                <input
                    type="text"
                    value={pixData.qrCodeCopyPaste}
                    readOnly
                    className="w-full border border-gray-300 p-2 rounded bg-gray-100 text-sm"
                />
                <button
                    onClick={onCopyPixCode}
                    title="Copiar Código PIX"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 p-1.5 rounded"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">Após o pagamento, o status do seu pedido será atualizado automaticamente.</p>

            {/* ⏱️ Timer e botão */}
            <div className="mt-4 space-y-2">
                <div className="text-sm text-gray-700">
                    Tempo restante: {minutos}:{segundos}
                </div>
                <button
                    onClick={onVerificarPagamento}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition duration-200"
                >
                    Verificar pagamento
                </button>
                {mensagem && <div className="text-sm text-gray-600">{mensagem}</div>}
            </div>

            <button
                onClick={onClose}
                type="button"
                className="w-full mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
            >
                Fechar
            </button>
        </div>
    );
};


export default PixPaymentSection;