import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import api from '../../../axiosConfig';
import LojaFuncionamento from '../../Pedidos/LojaFuncionamento'; // Importando o novo componente
import { slugify } from '../../../utils/slugify'; 
import { useStore } from '../../Context/StoreContext';
import {
  Eye,
  EyeOff,
  Store,
  Building,
  CalendarDays,
  CreditCard,
  Save
} from 'lucide-react';

const Perfil = () => {
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mensagemErro, setMensagemErro] = useState("");
    const [mostrarAccessToken, setMostrarAccessToken] = useState(false);
    const [imagemPreview, setImagemPreview] = useState(null);
    const { updateCurrentStore } = useStore();
    const [restaurante, setRestaurante] = useState({
        id: 0,
        userName: '',
        phoneNumber: '',
        emailAddress: '',
        nomeDaLoja: '',
        password: '',
        empresa: {
            id: 0,
            cnpj: '',
            cpf: '',
            razaoSocial: '',
            nomeFantasia: '',
            endereco: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: '',
            horarioAbertura: '08:00',
            horarioFechamento: '18:00',
            diasFuncionamento: {
                domingo: false,
                segunda: true,
                terca: true,
                quarta: true,
                quinta: true,
                sexta: true,
                sabado: false
            },
            observacoes: ''
        },
        mercadoPago: {
            publicKey: '',
            accessToken: '',
            clientId: '',
            clientSecret: '',
            ativo: false
        }
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('dados-restaurante');

    const handleChange = (e) => {
      const { name, value } = e.target;

      setRestaurante(prev => {
          let novosDados = { ...prev };
          const keys = name.split('.');

          // Lógica para lidar com objetos aninhados (ex: 'empresa.nomeFantasia')
          if (keys.length > 1) {
              let temp = novosDados;
              for (let i = 0; i < keys.length - 1; i++) {
                  temp = temp[keys[i]];
              }
              temp[keys[keys.length - 1]] = value;
          } else {
              novosDados[name] = value;
          }

          // *** A LÓGICA DO SLUG FICA AQUI ***
          // Se o campo alterado foi o 'nomeFantasia'...
          if (name === 'empresa.nomeFantasia') {
              // ...gere o slug e atualize o campo 'nomeDaLoja'
              const novoSlug = slugify(value);
              novosDados.nomeDaLoja = novoSlug;
          }
          
          return novosDados;
      });
  };

    useEffect(() => {
        const fetchRestaurante = async () => {
            try {
                setLoading(true);
                const response = await api.get('/api/1.0/Restaurante/GetRestauranteInfo');
                const restauranteData = response.data.restaurante;
                const empresa = restauranteData.empresa;
                const horarioAbertura = empresa.horarioAbertura
                    ? new Date(`2000-01-01T${empresa.horarioAbertura}`).toTimeString().slice(0, 5)
                    : '08:00';
    
                const horarioFechamento = empresa.horarioFechamento
                    ? new Date(`2000-01-01T${empresa.horarioFechamento}`).toTimeString().slice(0, 5)
                    : '18:00';
    
                const diasFuncionamento = empresa.diasFuncionamento || {
                    domingo: false,
                    segunda: true,
                    terca: true,
                    quarta: true,
                    quinta: true,
                    sexta: true,
                    sabado: false
                };
                setImagemPreview(response.data.restaurante.imagemUrl);
                setRestaurante({
                    ...restauranteData,
                    empresa: {
                        ...empresa,
                        horarioAbertura,
                        horarioFechamento,
                        diasFuncionamento
                    },
                    mercadoPago: {
                        publicKey: response.data.credenciaisMercadoPago?.publicKey || '',
                        accessToken: response.data.credenciaisMercadoPago?.accessToken || '',
                        clientId: response.data.credenciaisMercadoPago?.clientId || '',
                        clientSecret: response.data.credenciaisMercadoPago?.clientSecret || '',
                        ativo: response.data.credenciaisMercadoPago?.ativo
                    }
                });
    
            } catch (error) {
                console.error('Erro ao carregar dados do restaurante:', error);
                setMessage({ type: 'error', text: 'Erro ao carregar dados do perfil.' });
            } finally {
                setLoading(false);
            }
        };
    
        fetchRestaurante();
    }, []);
    

    const handleMercadoPagoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRestaurante((prevState) => ({
            ...prevState,
            mercadoPago: {
                ...prevState.mercadoPago,
                [name]: type === 'checkbox' ? checked : value
            }
        }));
    };
    
    
    const toggleMostrarSenha = () => {
        setMostrarSenha(!mostrarSenha);
    };

   

    const handleImagemLojaChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setRestaurante(prev => ({ ...prev, imagemLoja: file }));
            setImagemPreview(URL.createObjectURL(file)); // Gera preview
        }
    };
    const handleEmpresaChange = (e) => {
      const { name, value } = e.target;

      setRestaurante(prev => ({
          ...prev,
          empresa: {
              ...prev.empresa,
              [name]: value // Atualiza a propriedade específica (ex: 'horarioAbertura')
          }
      }));
    };
    // Handler para os checkboxes de dias de funcionamento
    const handleDiaFuncionamentoChange = (e) => {
        const { name, checked } = e.target;
        setRestaurante(prev => ({
            ...prev,
            empresa: {
                ...prev.empresa,
                diasFuncionamento: {
                    ...prev.empresa.diasFuncionamento,
                    [name]: checked
                }
            }
        }));
    };

    // Salvar alterações
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        // Validação de senha
        if (senha && senha !== confirmarSenha) {
            setMensagemErro("As senhas não conferem.");
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });
        setMensagemErro("");

        try {
            const dadosParaEnviar = {
                ...restaurante,
                password: senha || null,
                empresa: {
                    ...restaurante.empresa,
                    horarioAbertura: restaurante.empresa.horarioAbertura + ":00",
                    horarioFechamento: restaurante.empresa.horarioFechamento + ":00",
                    diasFuncionamento: restaurante.empresa.diasFuncionamento,
                    // Remover campos nulos
                    ...(restaurante.empresa.cnpj && { cnpj: restaurante.empresa.cnpj }),
                    ...(restaurante.empresa.cpf && { cpf: restaurante.empresa.cpf }),
                    ...(restaurante.empresa.razaoSocial && { razaoSocial: restaurante.empresa.razaoSocial }),
                    ...(restaurante.empresa.nomeFantasia && { nomeFantasia: restaurante.empresa.nomeFantasia }),
                    ...(restaurante.empresa.endereco && { endereco: restaurante.empresa.endereco }),
                    ...(restaurante.empresa.bairro && { bairro: restaurante.empresa.bairro }),
                    ...(restaurante.empresa.cidade && { cidade: restaurante.empresa.cidade }),
                    ...(restaurante.empresa.estado && { estado: restaurante.empresa.estado }),
                    ...(restaurante.empresa.cep && { cep: restaurante.empresa.cep }),
                    ...(restaurante.empresa.observacoes && { observacoes: restaurante.empresa.observacoes })
                }
            }
            
            //isso tem que ficar de fora do if para conseguir atualizar no back
            formData.append("restauranteJson", JSON.stringify(dadosParaEnviar));

            if (restaurante.imagemLoja) {
                formData.append("imagemLoja", restaurante.imagemLoja);
                
            
                await api.put('/api/1.0/Restaurante/UpdateProfileComImagem', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } 


            const CredenciaisDePagamento = {
                PublicKey: restaurante.mercadoPago?.publicKey || '',
                AccessToken: restaurante.mercadoPago?.accessToken || '',
                ClientId: restaurante.mercadoPago?.clientId || '',
                ClientSecret: restaurante.mercadoPago?.clientSecret || '',
                Ativo: restaurante.mercadoPago?.ativo || false
            };
            
            await api.put('/api/1.0/Restaurante/UpdateProfileComImagem', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            await api.post('/api/1.0/CredenciaisMercadoPago/CreateCredential', CredenciaisDePagamento);
            await api.put('/api/1.0/Restaurante/UpdateProfile', dadosParaEnviar);

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            // Limpar campos de senha após envio bem-sucedido
            const novoSlug = dadosParaEnviar.nomeDaLoja;
            updateCurrentStore(novoSlug);
            setSenha("");
            setConfirmarSenha("");
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

     const renderTabContent = () => {
    switch (activeTab) {
      case 'dados-restaurante':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ... input de imagem ... */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="imagemLoja">Imagem da Loja</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    className="w-full px-3 py-2 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="imagemLoja" name="imagemLoja" type="file" accept="image/*"
                    onChange={handleImagemLojaChange}
                  />
                </div>
                {(imagemPreview || restaurante.imagemUrl) && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={imagemPreview || restaurante.imagemUrl} alt="Imagem da loja" className="w-full h-full object-cover"/>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="userName">Nome de Usuário</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="userName" name="userName" value={restaurante.userName || ''}
                onChange={handleChange} // CORRIGIDO
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL da Loja</label>
                <input
                  className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                  type="text" value={restaurante.nomeDaLoja || ''}
                  readOnly
              />
              <small className="text-gray-500">fomedique.com.br/loja/{restaurante.nomeDaLoja || ''}</small>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="emailAddress">Email</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="emailAddress" name="emailAddress" type="email" value={restaurante.emailAddress || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phoneNumber">Telefone</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="phoneNumber" name="phoneNumber" value={restaurante.phoneNumber || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>
             {/* ... inputs de senha ... */}
          </div>
        );

      case 'dados-empresa':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cnpj">CNPJ</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="cnpj" name="empresa.cnpj" value={restaurante.empresa?.cnpj || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cpf">CPF</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="cpf" name="empresa.cpf" value={restaurante.empresa?.cpf || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="razaoSocial">Razão Social</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="razaoSocial" name="empresa.razaoSocial" value={restaurante.empresa?.razaoSocial || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nomeFantasia">Nome de Exibição da Loja (Nome Fantasia)</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="nomeFantasia" name="empresa.nomeFantasia" value={restaurante.empresa?.nomeFantasia || ''}
                onChange={handleChange} // JÁ ESTAVA CORRETO, MAS CONFIRMANDO
                placeholder="Ex: Pense Leve Açaí"
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="endereco">Endereço</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="endereco" name="empresa.endereco" value={restaurante.empresa?.endereco || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>
            
             {/* ...outros inputs de endereço, bairro, etc. TODOS com onChange={handleChange} e name="empresa.propriedade" */}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bairro">Bairro</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="bairro" name="empresa.bairro" value={restaurante.empresa?.bairro || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cidade">Cidade</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="cidade" name="empresa.cidade" value={restaurante.empresa?.cidade || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="estado">Estado</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="estado" name="empresa.estado" value={restaurante.empresa?.estado || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cep">CEP</label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="cep" name="empresa.cep" value={restaurante.empresa?.cep || ''}
                onChange={handleChange} // CORRIGIDO
              />
            </div>
          </div>
        );

      case 'horarios':
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="horarioAbertura">
              Horário de Abertura
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <Clock size={16} />
              </div>
              <input
                className="w-full pl-10 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="horarioAbertura"
                name="horarioAbertura" // Nome correto, sem aninhamento
                type="time"
                value={restaurante.empresa?.horarioAbertura || ''}
                onChange={handleEmpresaChange} // <-- CORREÇÃO: Usa o handler específico
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="horarioFechamento">
              Horário de Fechamento
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <Clock size={16} />
              </div>
              <input
                className="w-full pl-10 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="horarioFechamento"
                name="horarioFechamento" // Nome correto, sem aninhamento
                type="time"
                value={restaurante.empresa?.horarioFechamento || ''}
                onChange={handleEmpresaChange} // <-- CORREÇÃO: Usa o handler específico
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dias de Funcionamento
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Exemplo para Domingo, repita para os outros dias */}
            <div className="flex items-center">
              <input
                id="domingo"
                name="domingo" // Nome correto, sem aninhamento
                type="checkbox"
                checked={restaurante.empresa?.diasFuncionamento?.domingo || false}
                onChange={handleDiaFuncionamentoChange} // <-- CORREÇÃO: Usa o handler de checkbox
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="domingo" className="ml-2 text-sm text-gray-700">Domingo</label>
            </div>
            
            {/* Repita o padrão para todos os outros dias */}
            <div className="flex items-center">
                <input id="segunda" name="segunda" type="checkbox" checked={restaurante.empresa?.diasFuncionamento?.segunda || false} onChange={handleDiaFuncionamentoChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="segunda" className="ml-2 text-sm text-gray-700">Segunda-feira</label>
            </div>
            <div className="flex items-center">
                <input id="terca" name="terca" type="checkbox" checked={restaurante.empresa?.diasFuncionamento?.terca || false} onChange={handleDiaFuncionamentoChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="terca" className="ml-2 text-sm text-gray-700">Terça-feira</label>
            </div>
            <div className="flex items-center">
                <input id="quarta" name="quarta" type="checkbox" checked={restaurante.empresa?.diasFuncionamento?.quarta || false} onChange={handleDiaFuncionamentoChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="quarta" className="ml-2 text-sm text-gray-700">Quarta-feira</label>
            </div>
            <div className="flex items-center">
                <input id="quinta" name="quinta" type="checkbox" checked={restaurante.empresa?.diasFuncionamento?.quinta || false} onChange={handleDiaFuncionamentoChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="quinta" className="ml-2 text-sm text-gray-700">Quinta-feira</label>
            </div>
            <div className="flex items-center">
                <input id="sexta" name="sexta" type="checkbox" checked={restaurante.empresa?.diasFuncionamento?.sexta || false} onChange={handleDiaFuncionamentoChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="sexta" className="ml-2 text-sm text-gray-700">Sexta-feira</label>
            </div>
            <div className="flex items-center">
                <input id="sabado" name="sabado" type="checkbox" checked={restaurante.empresa?.diasFuncionamento?.sabado || false} onChange={handleDiaFuncionamentoChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="sabado" className="ml-2 text-sm text-gray-700">Sábado</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="observacoes">
            Observações
          </label>
          <textarea
            className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
            id="observacoes"
            name="observacoes" // Nome correto, sem aninhamento
            rows={4}
            value={restaurante.empresa?.observacoes || ''}
            onChange={handleEmpresaChange} // <-- CORREÇÃO: Usa o handler específico
            placeholder="Informações adicionais, como regras, etc."
          />
        </div>
      </div>
    );

      case 'dados-mercado-pago':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="publicKey">
                Public Key
              </label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg 
                focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="publicKey"
                name="publicKey"
                value={restaurante.mercadoPago?.publicKey || ''}
                onChange={handleMercadoPagoChange}
                placeholder="Sua chave pública do Mercado Pago"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="accessToken">
                Access Token
              </label>
              <div className="relative">
                <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg 
                focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                  id="accessToken"
                  name="accessToken"
                  type={mostrarAccessToken ? "text" : "password"}
                  value={restaurante.mercadoPago?.accessToken || ''}
                  onChange={handleMercadoPagoChange}
                  placeholder="Sua chave privada do Mercado Pago"
                />
                <button
                  type="button"
                  onClick={() => setMostrarAccessToken(!mostrarAccessToken)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {mostrarAccessToken ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="clientId">
                Client ID
              </label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg 
                focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="clientId"
                name="clientId"
                value={restaurante.mercadoPago?.clientId || ''}
                onChange={handleMercadoPagoChange}
                placeholder="Client ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="clientSecret">
                Client Secret
              </label>
              <input
                className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg 
                focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                id="clientSecret"
                name="clientSecret"
                value={restaurante.mercadoPago?.clientSecret || ''}
                onChange={handleMercadoPagoChange}
                placeholder="Client Secret"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center">
                <input
                  id="mp-ativo"
                  name="ativo"
                  type="checkbox"
                  checked={restaurante.mercadoPago?.ativo || false}
                  onChange={handleMercadoPagoChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="mp-ativo" className="ml-2 text-sm text-gray-700">
                  Ativo
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Ícones para as abas
  const getTabIcon = (tab) => {
    switch (tab) {
      case 'dados-restaurante':
        return <Store size={18} />;
      case 'dados-empresa':
        return <Building size={18} />;
      case 'horarios':
        return <CalendarDays size={18} />;
      case 'dados-mercado-pago':
        return <CreditCard size={18} />;
      default:
        return null;
    }
  };

  return (
    <div className=" mx-auto w-full p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Perfil do Restaurante</h2>
        </div>
        <div className="p-6">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap border-b border-gray-200 mb-6 overflow-x-auto">
            {[
              { id: 'dados-restaurante', label: 'Dados do Restaurante' },
              { id: 'dados-empresa', label: 'Dados da Empresa' },
              { id: 'horarios', label: 'Horários e Observações' },
              { id: 'dados-mercado-pago', label: 'Credenciais de recebimento' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors 
                  ${activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
              >
                <span className="mr-2">{getTabIcon(tab.id)}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {renderTabContent()}

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center px-5 py-2 text-white rounded-lg transition-colors 
                  ${loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
              >
                <Save size={18} className="mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;