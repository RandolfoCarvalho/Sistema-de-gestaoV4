import React from "react";
import { FileText } from "lucide-react";

const Observations = ({ formData, setFormData }) => {
    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            observacoes: e.target.value
        }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                Observações
            </h2>
            <div>
                <textarea
                    name="observacoes"
                    value={formData.observacoes || ''}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    placeholder="Alguma observação para seu pedido?"
                    rows={3}
                />
            </div>
        </div>
    );
};

export default Observations;
