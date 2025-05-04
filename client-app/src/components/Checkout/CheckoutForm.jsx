import React from "react";
import AddressForm from "./AddressForm";
import PaymentMethods from "./PaymentMethods";
import Observations from "./Observations";

const CheckoutForm = ({ formData, setFormData, onSubmit }) => {
    return (
        <div className="space-y-6">
            <AddressForm formData={formData} setFormData={setFormData} />
            <PaymentMethods formData={formData} setFormData={setFormData} />
            <Observations formData={formData} setFormData={setFormData} />
        </div>
    );
};

export default CheckoutForm;