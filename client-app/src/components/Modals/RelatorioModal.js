import React, { useState, useRef } from 'react';
import { X, CheckSquare, FileDown } from 'lucide-react'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';
import api from '../../axiosConfig'; 

/**
 * Busca os dados do relatório na API.
 */
async function fetchRelatorio(requestData) {
    try {
        const response = await api.post('/api/1.0/Restaurante/gerarRelatorio', requestData);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data || error.message;
        throw new Error(`Erro na API: ${errorMessage}`);
    }
}
const STATUS_MAP = {
    0: { label: 'Recebido' }, 
    1: { label: 'Em Produção' }, 
    2: { label: 'Em Entrega' },
    3: { label: 'Completo' }, 
    4: { label: 'Cancelado' },
};

const RelatorioModal = ({ isOpen, onClose }) => {
    const [startDate, setStartDate] = useState(() => new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState(null);
    
    const pdfContentRef = useRef(null);

    if (!isOpen) {
        return null;
    }

    const handleGerarRelatorio = async () => {
        setIsLoading(true);
        setError(null);
        setReportData(null);
        
        const request = {
            dataInicio: startDate,
            dataFim: endDate,
            ...(selectedStatus.length > 0 && { status: selectedStatus }),
        };

        try {
            const data = await fetchRelatorio(request);
            setReportData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusToggle = (statusKey) => {
        const keyAsNumber = Number(statusKey);
        setSelectedStatus(prev =>
            prev.includes(keyAsNumber) ? prev.filter(s => s !== keyAsNumber) : [...prev, keyAsNumber]
        );
    };

    const handleDownloadPdf = () => {
        const element = pdfContentRef.current; 
        if (!element) return;

        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right
            filename: `Relatorio_Detalhado_${startDate}_a_${endDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                letterRendering: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: element.scrollWidth,
                height: element.scrollHeight
            },
            jsPDF: { 
                unit: 'in', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // Garantir que o elemento esteja visível antes da captura
        element.style.display = 'block';
        element.style.visibility = 'visible';
        
        html2pdf().from(element).set(opt).save().then(() => {
            // Opcional: esconder novamente após a captura se necessário
        });
    };

    const formatarDataLocal = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    };

    const formatarDataHora = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
                onClick={onClose}
            >
                <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-xl font-semibold text-gray-800">Gerar Relatório Detalhado</h3>
                        <button 
                            onClick={onClose} 
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Início
                                </label>
                                <input 
                                    type="date" 
                                    id="startDate" 
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Fim
                                </label>
                                <input 
                                    type="date" 
                                    id="endDate" 
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                                    value={endDate} 
                                    onChange={e => setEndDate(e.target.value)} 
                                    min={startDate} 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status (opcional)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                                        <button 
                                            key={key} 
                                            onClick={() => handleStatusToggle(key)} 
                                            className={`px-3 py-1 text-sm rounded-full flex items-center gap-1.5 transition-colors ${
                                                selectedStatus.includes(Number(key)) 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {selectedStatus.includes(Number(key)) && <CheckSquare size={14} />}
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <button 
                                onClick={handleGerarRelatorio} 
                                disabled={isLoading || !startDate || !endDate} 
                                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Gerando...' : 'Gerar Relatório'}
                            </button>
                        </div>

                        <hr className="my-6" />

                        <div className="mt-4 min-h-[200px]">
                            {isLoading && (
                                <div className="text-center p-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    <p className="mt-2 text-gray-600">Carregando relatório...</p>
                                </div>
                            )}
                            
                            {error && (
                                <div className="p-4 text-center text-red-700 bg-red-100 rounded-md border border-red-200">
                                    <strong>Erro:</strong> {error}
                                </div>
                            )}
                            
                            {reportData && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-bold text-gray-800">Resumo do Relatório</h4>
                                        <button 
                                            onClick={handleDownloadPdf} 
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition-colors"
                                        >
                                            <FileDown size={18} />
                                            <span>Baixar PDF</span>
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <div className="text-sm font-medium text-blue-700">Total de Pedidos</div>
                                            <div className="text-2xl font-bold text-blue-900">{reportData.summary.totalOrders}</div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <div className="text-sm font-medium text-green-700">Receita Total</div>
                                            <div className="text-2xl font-bold text-green-900">
                                                {reportData.summary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                            <div className="text-sm font-medium text-purple-700">Custos Totais</div>
                                            <div className="text-2xl font-bold text-purple-900">
                                                {reportData.summary.totalCosts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                            <div className="text-sm font-medium text-amber-700">Lucro Total</div>
                                            <div className="text-2xl font-bold text-amber-900">
                                                {reportData.summary.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                                        <h5 className="text-md font-semibold mb-4 text-gray-800">Análise Diária</h5>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={reportData.dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" fontSize={12} />
                                                <YAxis tickFormatter={(value) => `R${value}`} fontSize={12} />
                                                <Tooltip 
                                                    formatter={(value, name) => [
                                                        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                                                        name
                                                    ]} 
                                                />
                                                <Legend />
                                                <Bar dataKey="revenue" name="Receita" fill="#10B981" />
                                                <Bar dataKey="profit" name="Lucro" fill="#F59E0B" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Container para geração do PDF - Corrigido */}
            {reportData && (
                <div 
                    style={{ 
                        position: 'absolute', 
                        left: '-10000px', 
                        top: '0',
                        width: '210mm', // A4 width
                        minHeight: '297mm', // A4 height
                        backgroundColor: 'white',
                        fontFamily: 'Arial, sans-serif'
                    }}
                >
                    <div 
                        ref={pdfContentRef} 
                        style={{
                            padding: '20mm',
                            width: '100%',
                            boxSizing: 'border-box',
                            color: '#000',
                            fontSize: '12px',
                            lineHeight: '1.4'
                        }}
                    >
                        {/* Cabeçalho */}
                        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#333' }}>
                                RELATÓRIO DE VENDAS DETALHADO
                            </h1>
                            <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                                Período: {formatarDataLocal(startDate)} a {formatarDataLocal(endDate)}
                            </p>
                            <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
                                Gerado em: {new Date().toLocaleString('pt-BR')}
                            </p>
                        </div>

                        {/* Resumo Geral */}
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                                RESUMO GERAL
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px' }}>
                                <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                                    <strong style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Total de Pedidos:</strong>
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>{reportData.summary.totalOrders}</span>
                                </div>
                                <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                                    <strong style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Receita Total:</strong>
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                                        {reportData.summary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                                <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                                    <strong style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Custos Totais:</strong>
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                                        {reportData.summary.totalCosts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                                <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                                    <strong style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>Lucro Total:</strong>
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffc107' }}>
                                        {reportData.summary.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tabela de Detalhes */}
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                                DETALHES DOS PEDIDOS
                            </h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #ddd' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Nº Pedido</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Data/Hora</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Cliente</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Valor (Produtos)</th>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Taxa Entrega</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.pedidosDetalhes && reportData.pedidosDetalhes.map((pedido, index) => (
                                        <tr key={pedido.numero} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>{pedido.numero}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>
                                                {formatarDataHora(pedido.dataPedido)}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>{pedido.nomeCliente}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>{pedido.status}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                                                {pedido.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right' }}>
                                                {pedido.taxaEntrega.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Rodapé */}
                        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '10px', color: '#666' }}>
                            <p style={{ margin: '0' }}>
                                Este relatório foi gerado automaticamente pelo sistema em {new Date().toLocaleString('pt-BR')}
                            </p>
                            <p style={{ margin: '5px 0 0 0' }}>
                                Dados confidenciais - Uso interno apenas
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RelatorioModal;