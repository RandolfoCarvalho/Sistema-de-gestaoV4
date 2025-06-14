import React, { useState } from 'react';
import { X } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, onGenerate }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [statusFilter, setStatusFilter] = useState('all');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            alert('Por favor, selecione a data inicial e final.');
            return;
        }
        onGenerate({ startDate, endDate, statusFilter });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Gerar Relatório de Pedidos</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Date Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="reportStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Inicial
                                </label>
                                <input
                                    type="date"
                                    id="reportStartDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="reportEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Final
                                </label>
                                <input
                                    type="date"
                                    id="reportEndDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status dos Pedidos
                            </label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input type="radio" name="statusFilter" value="all" checked={statusFilter === 'all'} onChange={(e) => setStatusFilter(e.target.value)} className="form-radio text-indigo-600"/>
                                    <span className="ml-2 text-gray-700">Todos</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="statusFilter" value="completed" checked={statusFilter === 'completed'} onChange={(e) => setStatusFilter(e.target.value)} className="form-radio text-green-600"/>
                                    <span className="ml-2 text-gray-700">Completos</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="statusFilter" value="canceled" checked={statusFilter === 'canceled'} onChange={(e) => setStatusFilter(e.target.value)} className="form-radio text-red-600"/>
                                    <span className="ml-2 text-gray-700">Cancelados</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            Gerar Relatório
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;