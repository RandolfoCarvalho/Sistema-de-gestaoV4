const PaymentLoadingSpinner = () => (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-blue-600 font-medium">Processando pagamento...</p>
      </div>
    </div>
  );

  export default PaymentLoadingSpinner;