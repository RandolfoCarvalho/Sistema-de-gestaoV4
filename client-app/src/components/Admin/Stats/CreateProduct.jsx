import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Camera, Package, Tag, Layers, Check, X } from 'lucide-react';
import { formatPriceToInvariantBackend } from '@utils/formatters';
import axios from 'axios';

const CreateProductForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        precoCusto: '',
        precoVenda: '',
        estoqueAtual: '',
        estoqueMinimo: '',
        unidadeMedida: '',
        categoriaId: '',
        complementos: [],
        adicionaisIds: []
    });

    const [imagem, setImagem] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [complementos, setComplementos] = useState([]);
    const [adicionais, setAdicionais] = useState([]);
    const [gruposAdicionais, setGruposAdicionais] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [categoriasResponse, complementosResponse, gruposAdicionaisResponse] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Categoria/ListarCategoriasPorLojaGestao`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Complemento/ListarGrupoComplementos`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ListarGrupoAdicionais`)
                ]);
                setCategorias(categoriasResponse.data || []);
                setComplementos(complementosResponse.data || []);
                setGruposAdicionais(gruposAdicionaisResponse.data || []);
                console.log("Grupos adicionais: " + JSON.stringify(gruposAdicionaisResponse.data));

            } catch (error) {
                setError('Erro ao carregar dados. Por favor, tente novamente.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    const steps = [
        { number: 1, title: "Informações Básicas", icon: Package },
        { number: 2, title: "Preços e Estoque", icon: Tag },
        { number: 3, title: "Categoria e Extras", icon: Layers },
        { number: 4, title: "Confirmação", icon: Check }
    ];

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImagemChange(e.dataTransfer.files[0]);
        }
    };

    const handleImagemChange = (file) => {
        if (file) {
            setImagem(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const errorMessages = {
        "The Nome field is required.": "O nome é obrigatório.",
        "The value '' is invalid.": "O valor não pode estar vazio.",
        "The PrecoCusto field is required.": "O preço de custo é obrigatório.",
        "The PrecoVenda field is required.": "O preço de venda é obrigatório.",
        "The CategoriaId field is required.": "A categoria deve ser selecionada.",
        "The EstoqueAtual field is required.": "O estoque atual é obrigatório.",
        "The EstoqueMinimo field is required.": "O estoque mínimo é obrigatório."
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('nome', formData.nome);
            formDataToSend.append('descricao', formData.descricao || '');
            formDataToSend.append('categoriaId', formData.categoriaId);
            formDataToSend.append('precoCusto', parseFloat(formData.precoCusto).toFixed(2));
            formDataToSend.append('precoVenda', parseFloat(formData.precoVenda).toFixed(2));
            formDataToSend.append('estoqueAtual', formData.estoqueAtual);
            formDataToSend.append('estoqueMinimo', formData.estoqueMinimo);
            formDataToSend.append('unidadeMedida', formData.unidadeMedida || '');

            // Modificado: Enviar apenas o ID como inteiro
            const gruposComplementosFormatted = formData.gruposComplementosIds || []; // Simplificado para uma lista de inteiros diretamente
            formDataToSend.append('GruposComplementosIds', gruposComplementosFormatted);
            console.log("Ids: " + formData.gruposComplementosIds)
            
            const gruposAdicionaisIdsFormatted = formData.gruposAdicionaisIds || [];
            formDataToSend.append('GrupoAdicionalIds', gruposAdicionaisIdsFormatted);
            console.log("adicionais Ids: " + gruposAdicionaisIdsFormatted)
            console.log("adicionais Ids: " + gruposAdicionaisIdsFormatted)
            if (imagem) {
                formDataToSend.append('imagemPrincipalUrl', imagem);
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/Produto/CriarProduto`,
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            if (response.data) {
                setSuccess('Produto criado com sucesso!');
                setFormData({
                    nome: '',
                    descricao: '',
                    precoCusto: '',
                    precoVenda: '',
                    estoqueAtual: '',
                    estoqueMinimo: '',
                    unidadeMedida: '',
                    categoriaId: '',
                    complementos: [],
                    adicionaisIds: []
                });
                setImagem(null);
                setPreviewUrl('');
            }
        } catch (error) {
            console.error('Erro ao criar produto:', error);

            // Verificar se a resposta de erro contém dados
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                let errorMessage = 'Erro ao criar produto:';

                // Se a resposta contiver um objeto com erros, formatar uma mensagem detalhada
                if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(field => {
                        const fieldErrors = errorData.errors[field];
                        fieldErrors.forEach((message, index) => {
                            // Traduzir a mensagem de erro se ela existir no dicionário
                            const translatedMessage = errorMessages[message] || message; // Se não encontrar, mantém a original
                            errorMessage += `\n- ${field}: ${translatedMessage}`;
                        });
                    });
                } else {
                    // Caso a API retorne um erro genérico, adicionar
                    errorMessage += `\n${JSON.stringify(errorData)}`;
                }

                // Mensagem final para o usuário
                errorMessage += '\n Solucione os erros e tente novamente!';

                setError(errorMessage);
            } else {
                // Se não houver dados na resposta de erro, exibir uma mensagem genérica
                setError('Erro ao criar produto. Por favor, verifique os dados e tente novamente.');
            }
        }
    };



    const renderStep1 = () => (
    <div className="space-y-4">
        <div className="relative">
            <div
                className={`border border-dashed rounded-md p-6 text-center ${
                    dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                } transition-colors duration-200 ease-in-out`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {previewUrl ? (
                    <div className="relative inline-block">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-40 w-auto rounded-md mx-auto"
                        />
                        <button
                            onClick={() => {
                                setImagem(null);
                                setPreviewUrl('');
                            }}
                            className="absolute -top-2 -right-2 bg-red-400 text-white rounded-full p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div>
                        <Camera className="mx-auto h-10 w-10 text-gray-300" />
                        <div className="mt-2">
                            <label className="cursor-pointer">
                                <span className="text-sm text-gray-500">
                                    Arraste uma imagem ou clique para selecionar
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImagemChange(e.target.files[0])}
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="grid gap-4">
            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Nome do Produto
                </label>
                <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                    placeholder="Ex: Hambúrguer Artesanal"
                />
            </div>

            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Descrição
                </label>
                <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                    placeholder="Descreva os detalhes do seu produto..."
                />
            </div>
        </div>
    </div>
);

const renderStep2 = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Preços</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Preço de Custo (R$)
          </label>
          <input
            type="number"
            name="precoCusto"
            value={formData.precoCusto}
            onChange={(e) =>
              setFormData({
                ...formData,
                precoCusto: formatPriceToInvariantBackend(e.target.value),
              })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Preço de Venda (R$)
          </label>
          <input
            type="number"
            name="precoVenda"
            value={formData.precoVenda}
            onChange={(e) =>
              setFormData({
                ...formData,
                precoVenda: formatPriceToInvariantBackend(e.target.value),
              })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
            step="0.01"
          />
          {formData.precoCusto && formData.precoVenda && (
            <div className="mt-1 text-xs">
              <span
                className={`font-medium ${
                  formData.precoVenda - formData.precoCusto > 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                Margem:{' '}
                {(
                  ((formData.precoVenda - formData.precoCusto) /
                    formData.precoCusto) *
                  100
                ).toFixed(2)}
                %
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Estoque</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Estoque Atual
          </label>
          <input
            type="number"
            name="estoqueAtual"
            value={formData.estoqueAtual}
            onChange={(e) =>
              setFormData({ ...formData, estoqueAtual: e.target.value })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Estoque Mínimo
          </label>
          <input
            type="number"
            name="estoqueMinimo"
            value={formData.estoqueMinimo}
            onChange={(e) =>
              setFormData({ ...formData, estoqueMinimo: e.target.value })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Unidade de Medida
          </label>
          <select
            name="unidadeMedida"
            value={formData.unidadeMedida}
            onChange={(e) =>
              setFormData({ ...formData, unidadeMedida: e.target.value })
            }
            className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
          >
            <option value="">Selecione...</option>
            <option value="UN">Unidade</option>
            <option value="KG">Quilograma</option>
            <option value="L">Litro</option>
            <option value="CX">Caixa</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

const renderStep3 = () => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm text-gray-600 mb-1">
                Categoria
            </label>
            <select
                name="categoriaId"
                value={formData.categoriaId}
                onChange={(e) => {
                    const value = parseInt(e.target.value);
                    console.log('Valor selecionado:', value);
                    setFormData({ ...formData, categoriaId: value });
                }}
                className="w-full rounded-md border-gray-200 text-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
            >
                <option value="">Selecione uma categoria...</option>
                {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                    </option>
                ))}
            </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Grupos de Complementos
                </label>
                <div className="border border-gray-100 rounded-md max-h-40 overflow-y-auto">
                    {complementos.map(grupo => (
                        <div key={grupo.id}>
                            <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={formData.gruposComplementosIds?.includes(grupo.id)}
                                    onChange={(e) => {
                                        const newGruposComplementos = e.target.checked
                                            ? [...(formData.gruposComplementosIds || []), grupo.id]
                                            : (formData.gruposComplementosIds || []).filter(id => id !== grupo.id);
                                        setFormData({
                                            ...formData,
                                            gruposComplementosIds: newGruposComplementos
                                        });
                                    }}
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-400 mr-2"
                                />
                                <span>{grupo.nome}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Grupos de Adicionais
                </label>
                <div className="border border-gray-100 rounded-md max-h-40 overflow-y-auto">
                    {gruposAdicionais.map(grupo => (
                        <label
                            key={grupo.id}
                            className="flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={formData.gruposAdicionaisIds?.includes(grupo.id)}
                                onChange={(e) => {
                                    const newGruposAdicionais = e.target.checked
                                        ? [...(formData.gruposAdicionaisIds || []), grupo.id]
                                        : (formData.gruposAdicionaisIds || []).filter(id => id !== grupo.id);
                                    setFormData({ ...formData, gruposAdicionaisIds: newGruposAdicionais });
                                }}
                                className="rounded border-gray-300 text-blue-500 focus:ring-blue-400 mr-2"
                            />
                            <span>{grupo.nome} {grupo.limiteSelecao ? `(Limite: ${grupo.limiteSelecao})` : ''}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const renderStep4 = () => (
    <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-blue-700 mb-1">Revisão do Produto</h3>
            <p className="text-xs text-blue-600">Confira todas as informações antes de finalizar</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400">Informações Básicas</h4>
                    <p className="text-base font-medium">{formData.nome || "—"}</p>
                    <p className="text-xs text-gray-500 mt-1">{formData.descricao || "Sem descrição"}</p>
                </div>
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400">Preços</h4>
                    <p className="text-sm">Custo: R$ {formData.precoCusto || "0,00"}</p>
                    <p className="text-sm">Venda: R$ {formData.precoVenda || "0,00"}</p>
                </div>
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400">Estoque</h4>
                    <p className="text-sm">Atual: {formData.estoqueAtual || "0"} {formData.unidadeMedida || ""}</p>
                    <p className="text-sm">Mínimo: {formData.estoqueMinimo || "0"} {formData.unidadeMedida || ""}</p>
                </div>
            </div>
            <div className="space-y-3">
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400">Categoria</h4>
                    <p className="text-sm">{categorias.find(c => c.id === parseInt(formData.categoriaId))?.nome || "Não selecionada"}</p>
                </div>
                {formData.complementos?.length > 0 && (
                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-gray-400">Complementos</h4>
                        <ul className="text-sm space-y-1 mt-1">
                            {formData.complementos.map(comp => (
                                <li key={comp.id} className="flex items-center">
                                    <div className="h-1 w-1 bg-gray-400 rounded-full mr-2"></div>
                                    {complementos.find(c => c.id === comp.id)?.nome}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {formData.adicionaisIds?.length > 0 && (
                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-gray-400">Adicionais</h4>
                        <ul className="text-sm space-y-1 mt-1">
                            {formData.adicionaisIds.map(id => (
                                <li key={id} className="flex items-center">
                                    <div className="h-1 w-1 bg-gray-400 rounded-full mr-2"></div>
                                    {adicionais.find(a => a.id === id)?.nome}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
        {/* Botão Criar Produto */}
        <div className="mt-6 flex justify-end">
            <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 text-sm"
            >
                Criar Produto
            </button>
        </div>
    </div>
);

if (isLoading) {
    return (
        <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
        </div>
    );
}

return (
    <div className=" my-6 px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100">
                <h2 className="text-xl font-medium text-gray-800">Novo Item no Cardápio</h2>
                <p className="mt-1 text-xs text-gray-400">
                    Preencha as informações do produto em etapas simples
                </p>
            </div>

            {/* Progress Steps */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <div key={step.number} className="flex items-center">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full 
                                    ${currentStep >= step.number
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-400'}`}
                            >
                                <step.icon size={16} />
                            </div>
                            <div className="ml-2 hidden sm:block">
                                <p className="text-xs font-medium text-gray-700">{step.title}</p>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="mx-2 hidden sm:block">
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <form className="p-5">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-md text-sm">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-md text-sm">
                        <div className="flex">
                            <Check className="h-4 w-4 text-green-500" />
                            <p className="ml-2 text-green-600">{success}</p>
                        </div>
                    </div>
                )}
                <div className="space-y-4">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                </div>

                <div className="mt-6 flex justify-between">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                            Voltar
                        </button>
                    )}

                    {currentStep < 4 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep((prevStep) => prevStep + 1)}
                            className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                        >
                            Próximo
                        </button>
                    )}
                </div>
            </form>
        </div>
    </div>
)}

export default CreateProductForm;