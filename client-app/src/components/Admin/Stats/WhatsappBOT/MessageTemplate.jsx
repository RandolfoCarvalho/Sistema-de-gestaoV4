import React, { useState, useEffect } from 'react';
import { Save, Edit, X, Plus, AlertCircle, MessageSquare, Eye, CheckCircle } from 'lucide-react';
import axios from 'axios';

const MessageTemplate = () => {
  const [templates, setTemplates] = useState([
  {
    id: 1,
    title: 'Confirmação de Pedido',
    template: 'Olá {{cliente}}, seu pedido #{{pedido}} foi recebido com sucesso! Estamos preparando tudo para você.',
    stage: 'Pedido Recebido'
  },
  {
    id: 2,
    title: 'Pedido em Produção',
    template: 'Olá {{cliente}}, boas notícias! Seu pedido #{{pedido}} está em produção e ficará pronto em breve.',
    stage: 'Em Produção'
  },
  {
    id: 3,
    title: 'Saiu para Entrega',
    template: 'Olá {{cliente}}, seu pedido #{{pedido}} acabou de sair para entrega! Aguarde o entregador.',
    stage: 'Saiu para Entrega'
  },
  {
    id: 4, // Corrigido para evitar repetição de ID
    title: 'Pedido entregue',
    template: 'Olá {{cliente}}, seu pedido #{{pedido}} acabou de ser entregue.',
    stage: 'Pedido entregue'
  }
]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const pedidoEtapas = ['Pedido Recebido', 'Em Produção', 'Saiu para Entrega', 'Entregue', 'Cancelado'];

  // Dados de exemplo para substituição nas mensagens
  const exampleData = {
    cliente: 'Randolfo',
    pedido: '12345',
    produto: 'Tênis Esportivo',
    status: 'Pedido recebido',
    valor: 'R$ 299,90',
    data: '10/05/2025'
  };

  // Carrega os templates no carregamento do componente
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Notificacoes/ListarMensagens`);
      const formattedTemplates = response.data.map((item) => ({
        id: item.id,
        title: item.titulo,
        template: item.texto,
        stage: item.etapa,
        channel: 'whatsapp'
      }));
      setTemplates(formattedTemplates);
      setTemplates(formattedTemplates || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      showNotification('Erro ao carregar templates', 'error');
    }
  };

  const handleEdit = (templateId) => {
    setEditingTemplate(templateId);
    setPreviewMode(null);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
  };

  const handleChange = (templateId, field, value) => {
    setTemplates((prevTemplates) =>
      prevTemplates.map((template) =>
        template.id === templateId ? { ...template, [field]: value } : template
      )
    );
  };

  const handleSave = async (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
  
    // Mapeamento de etapa para templateId
      const etapaParaTemplateId = {
        'Pedido Recebido': 0,
        'Em Produção': 1,
        'Saiu para Entrega': 2,
        'Entregue': 3,
        'Cancelado': 4
      };
    const templateIdMapped = etapaParaTemplateId[template.stage] ?? 0;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Notificacoes/SalvarMensagens`, {
        Id: template.id,
        templateId: templateIdMapped,
        titulo: template.title,
        texto: template.template,
        etapa: template.stage
    });
      setEditingTemplate(null);
      showNotification('Template salvo com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      showNotification('Erro ao salvar template', 'error');
    }
  };

  const handleAddNew = () => {
    const newId = Math.max(0, ...templates.map(t => t.id)) + 1;
    const newTemplate = {
      id: newId,
      title: 'Novo Template',
      template: '',
      stage: ''
    };
    
    setTemplates([...templates, newTemplate]);
    setEditingTemplate(newId);
  };

  const togglePreview = (templateId) => {
    if (previewMode === templateId) {
      setPreviewMode(null);
    } else {
      setPreviewMode(templateId);
      setEditingTemplate(null);
    }
  };
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Substitui as variáveis no template com os valores do exemplo
  const replaceVariables = (text) => {
    if (!text) return '';
    let result = text;
    Object.entries(exampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Modelos de Mensagem para Clientes</h2>
        <p className="text-gray-600">
          Escreva e personalize as mensagens que serão enviadas para seus clientes em cada etapa do pedido.
        </p>
      </div>

      {notification && (
        <div className={`p-3 mb-4 rounded-lg flex items-center ${
          notification.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} className="mr-2" /> : <CheckCircle size={18} className="mr-2" />}
          {notification.message}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium flex items-center text-blue-700 mb-2">
          <MessageSquare size={18} className="mr-2" /> Variáveis disponíveis
        </h3>
        <p className="text-blue-600 mb-2">
          Use estas variáveis para personalizar suas mensagens:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(exampleData).map(([key, value]) => (
            <div key={key} className="bg-white border border-blue-200 rounded-md px-3 py-2">
              <code className="text-sm text-blue-800">{'{{' + key + '}}'}</code>
              <div className="text-xs text-gray-500 mt-1">Exemplo: {value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              {editingTemplate === template.id ? (
                <input
                  type="text"
                  value={template.title}
                  onChange={(e) => handleChange(template.id, 'title', e.target.value)}
                  className="font-medium text-lg border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-1/2"
                />
              ) : (
                <h3 className="font-medium text-lg">{template.title}</h3>
              )}
              
              <div className="flex items-center space-x-2">
                {editingTemplate === template.id ? (
                  <>
                    <button
                      onClick={() => handleSave(template.id)}
                      className="flex items-center px-2 py-1 rounded text-green-600 hover:bg-green-50"
                    >
                      <Save size={16} className="mr-1" /> Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center px-2 py-1 rounded text-gray-600 hover:bg-gray-50"
                    >
                      <X size={16} className="mr-1" /> Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => togglePreview(template.id)}
                      className={`flex items-center px-2 py-1 rounded ${
                        previewMode === template.id 
                          ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' 
                          : 'text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <Eye size={16} className="mr-1" /> 
                      {previewMode === template.id ? 'Ocultar' : 'Visualizar'}
                    </button>
                    <button
                      onClick={() => handleEdit(template.id)}
                      className="flex items-center px-2 py-1 rounded text-blue-600 hover:bg-blue-50"
                    >
                      <Edit size={16} className="mr-1" /> Editar
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingTemplate === template.id ? (
              <>
                <textarea
                  rows={5}
                  value={template.template}
                  onChange={(e) => handleChange(template.id, 'template', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 focus:outline-none"
                  placeholder="Escreva a mensagem que será enviada ao cliente. Use as variáveis disponíveis para personalização."
                />
                <div className="text-xs text-gray-500 mb-4">
                  Dica: Use variáveis como {'{{cliente}}'}, {'{{pedido}}'}, {'{{produto}}'}, etc.
                </div>
              </>
            ) : previewMode === template.id ? (
              <div className="bg-gray-50 p-4 rounded-md border mb-3">
                <div className="mb-2 text-sm font-medium text-gray-500">Prévia da mensagem:</div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                  <p className="text-gray-800 whitespace-pre-line">{replaceVariables(template.template)}</p>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Esta é a mensagem que o cliente receberá, com as variáveis substituídas pelos dados reais.
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-md border mb-3">
                <p className="text-sm whitespace-pre-line">{template.template}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etapa do Pedido</label>
                <select
                  value={template.stage || ''}
                  onChange={(e) => handleChange(template.id, 'stage', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 focus:outline-none"
                  disabled={editingTemplate !== template.id}
                >
                  <option value="">Selecione uma etapa</option>
                  {pedidoEtapas.map((etapa) => (
                    <option key={etapa} value={etapa}>
                      {etapa}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canal de Envio</label>
                <select
                  value={template.channel || 'whatsapp'}
                  onChange={(e) => handleChange(template.id, 'channel', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 focus:outline-none"
                  disabled={editingTemplate !== template.id}
                >
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <Plus size={18} className="mr-2" /> Adicionar Novo Template
        </button>
      </div>
    </div>
  );
};

export default MessageTemplate;