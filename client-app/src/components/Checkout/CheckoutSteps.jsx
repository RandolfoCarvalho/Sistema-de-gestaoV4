import React from "react";
import { CreditCard, Package, User } from "lucide-react";

const CheckoutSteps = ({ currentStep = 1 }) => {
    return (
        <div className="flex justify-center mb-8">
            <div className="flex items-center">
                {["Carrinho", "Dados", "Pagamento"].map((step, index) => {
                    const stepNumber = index + 1;
                    return (
                        <div key={step} className={`flex flex-col items-center ${currentStep >= stepNumber ? "text-blue-600" : "text-gray-400"}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= stepNumber ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                                {stepNumber === 1 ? <Package size={20} /> : stepNumber === 2 ? <User size={20} /> : <CreditCard size={20} />}
                            </div>
                            <span className="text-sm">{step}</span>
                            {stepNumber < 3 && <div className={`w-20 h-1 mx-2 ${currentStep >= stepNumber + 1 ? "bg-blue-600" : "bg-gray-200"}`} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CheckoutSteps;
