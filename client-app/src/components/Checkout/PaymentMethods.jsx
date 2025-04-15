import React from "react";
import { CreditCard, CircleDollarSign, FileText } from "lucide-react";

const PaymentMethods = ({ formData, setFormData }) => {
    const handlePaymentChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            pagamento: {
                ...prev.pagamento,
                FormaPagamento: value
            }
        }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                <CircleDollarSign className="mr-2" size={24} /> Forma de Pagamento
            </h2>
            <div className="grid grid-cols-1 gap-4">
                {["dinheiro", "cartao", "pix"].map((metodo) => (
                    <div
                        key={metodo}
                        className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${formData.pagamento?.FormaPagamento === metodo ?
                                "border-blue-500 bg-blue-50" :
                                "border-gray-200 hover:border-blue-200"
                            }`}
                        onClick={() => handlePaymentChange(metodo)}
                    >
                        <div className="flex items-center">
                            <input
                                type="radio"
                                name="pagamento.FormaPagamento"
                                value={metodo}
                                checked={formData.pagamento?.FormaPagamento === metodo}
                                onChange={() => handlePaymentChange(metodo)}
                                className="mr-2"
                            />
                            <label className="flex items-center cursor-pointer">
                                {metodo === "dinheiro" ?
                                    <CircleDollarSign className="mr-2" size={20} /> :
                                    metodo === "cartao" ?
                                        <CreditCard className="mr-2" size={20} /> :
                                        <FileText className="mr-2" size={20} />
                                }
                                {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaymentMethods;
