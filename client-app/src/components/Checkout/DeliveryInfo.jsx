import React from "react";
import { Truck } from "lucide-react";

const DeliveryInfo = () => {
    return (
        <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center text-gray-600">
                <Truck className="mr-2" size={20} />
                <span>Entrega em até 60 minutos</span>
            </div>
        </div>
    );
};

export default DeliveryInfo;
