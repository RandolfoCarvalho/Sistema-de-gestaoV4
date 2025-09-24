import React from "react";
import AddressForm from "./AddressForm";
import PaymentMethods from "./PaymentMethods";
import Observations from "./Observations";
import DeliveryOptions from "./DeliveryOptions";

const CheckoutForm = ({ formData, setFormData }) => {
    return (
        <div className="space-y-6">
            <DeliveryOptions formData={formData} setFormData={setFormData} />
            
            {formData.TipoEntrega === 'DELIVERY' && (
                <AddressForm formData={formData} setFormData={setFormData} />
            )}
            
            <PaymentMethods formData={formData} setFormData={setFormData} />
            <Observations formData={formData} setFormData={setFormData} />
        </div>
    );
};

export default CheckoutForm;