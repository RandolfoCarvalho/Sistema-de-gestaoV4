import React, { useEffect } from "react";
import { CreditCard, CircleDollarSign, QrCode, Store } from "lucide-react";

// Estrutura de dados aprimorada com a propriedade 'modes'
// para controlar a visibilidade de cada grupo de pagamento.
const allPaymentGroups = [
    {
        title: "Pagar na Entrega",
        modes: ['DELIVERY'], // Só aparece se o modo de entrega for DELIVERY
        methods: [
            {
                value: "dinheiro",
                label: "Dinheiro",
                icon: CircleDollarSign
            },
            {
                value: "maquininha",
                label: "Cartão na Entrega (Débito/Crédito)",
                icon: CreditCard
            },
        ],
    },
    {
        title: "Pagar na Retirada",
        modes: ['RETIRADA'], // Só aparece se o modo de entrega for RETIRADA
        methods: [
            {
                value: "pagar na retirada",
                label: "Pagar no Balcão (Dinheiro/Cartão)",
                icon: Store
            }
        ],
    },
    {
        title: "Pagar Online (disponível para Entrega ou Retirada)",
        modes: ['DELIVERY', 'RETIRADA'], // Aparece em ambos os modos
        methods: [
            {
                value: "pix",
                label: "Pix",
                icon: QrCode
            },
            {
                value: "cartao",
                label: "Cartão de Crédito/Débito Online",
                icon: CreditCard
            },
        ],
    },
];

const PaymentMethods = ({ formData, setFormData }) => {

    const handlePaymentChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            pagamento: {
                ...prev.pagamento,
                FormaPagamento: value,
            },
        }));
    };

    // Filtra os grupos de pagamento que devem ser exibidos
    // com base no TipoEntrega selecionado ('DELIVERY' ou 'RETIRADA').
    const availableGroups = allPaymentGroups.filter(group =>
        group.modes.includes(formData.TipoEntrega)
    );

    // Efeito para garantir que uma opção de pagamento inválida seja
    // desmarcada se o usuário mudar o tipo de entrega.
    useEffect(() => {
        const currentPayment = formData.pagamento?.FormaPagamento;
        if (!currentPayment) return;

        const allAvailableMethods = availableGroups.flatMap(group => group.methods.map(method => method.value));
        
        if (!allAvailableMethods.includes(currentPayment)) {
            handlePaymentChange(''); // Limpa a seleção se ela não for mais válida
        }

    }, [formData.TipoEntrega]);


    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                <CircleDollarSign className="mr-3 text-slate-500" size={24} />
                Forma de Pagamento
            </h2>
            <div className="space-y-6">
                {availableGroups.map((group) => (
                    <div key={group.title}>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">{group.title}</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {group.methods.map((metodo) => {
                                const Icon = metodo.icon;
                                const isSelected = formData.pagamento?.FormaPagamento === metodo.value;

                                return (
                                    <div
                                        key={metodo.value}
                                        className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                                            isSelected
                                                ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200"
                                                : "border-gray-200 hover:border-indigo-400"
                                        }`}
                                        onClick={() => handlePaymentChange(metodo.value)}
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="pagamento.FormaPagamento"
                                                value={metodo.value}
                                                checked={isSelected}
                                                onChange={() => handlePaymentChange(metodo.value)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <label className="ml-3 flex items-center cursor-pointer font-medium text-gray-800">
                                                <Icon className={`mr-2 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} size={20} />
                                                {metodo.label}
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaymentMethods;