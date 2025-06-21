using AutoMapper;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Notification;
using SistemaDeGestao.Models.DTOs.Resquests;
using SistemaDeGestao.Enums;
using System.Linq;

namespace SistemaDeGestao.AutoMapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<PedidoDTO, Pedido>()
                .ForMember(dest => dest.Numero, opt => opt.Ignore())
                .ForMember(dest => dest.Pagamento, opt => opt.MapFrom(src => new PedidoPagamento
                {
                    FormaPagamento = src.Pagamento.FormaPagamento,
                    TrocoPara = src.Pagamento.TrocoPara,
                }))
                .ForMember(dest => dest.EnderecoEntrega, opt => opt.MapFrom(src => src.Endereco));

            CreateMap<ItemPedidoDTO, ItemPedido>()
                .ForMember(dest => dest.OpcoesExtras, opt => opt.MapFrom(src => src.OpcoesExtras));

            CreateMap<ItemPedidoOpcaoDTO, ItemPedidoOpcao>();
            CreateMap<EnderecoEntregaDTO, EnderecoEntrega>();

            // --- MAPEAMENTOS DE CANCELAMENTO (Entidade -> DTO) ---
            CreateMap<CancelamentoPedidoRequest, PedidoCancelado>();

            // --- MAPEAMENTOS DE NOTIFICATION (Entidade -> DTO) ---
            // Mapeamento principal: Pedido -> PedidoNotificationDTO
            CreateMap<Pedido, PedidoNotificationDTO>()
                .ForMember(dest => dest.Numero, opt => opt.MapFrom(src => src.Numero))
                .ForMember(dest => dest.DataPedido, opt => opt.MapFrom(src => src.DataPedido.ToString("yyyy-MM-dd HH:mm:ss")))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

            // Mapeamentos de objetos aninhados simples
            CreateMap<EnderecoEntrega, EnderecoEntregaNotificationDTO>();
            CreateMap<PedidoPagamento, PagamentoNotificationDTO>();

            // Mapeamento de ItemPedido para seu DTO correspondente
            CreateMap<ItemPedido, ItemPedidoNotificationDTO>()
                .ForMember(dest => dest.ProdutoNome, opt => opt.MapFrom(src => src.NomeProduto))
                .ForMember(dest => dest.TotalComplementos, opt => opt.MapFrom(src => src.OpcoesExtras.Count(o => o.TipoOpcao == TipoOpcaoExtra.Complemento)))
                .ForMember(dest => dest.TotalAdicionais, opt => opt.MapFrom(src => src.OpcoesExtras.Count(o => o.TipoOpcao == TipoOpcaoExtra.Adicional)))
                .ForMember(dest => dest.Complementos, opt => opt.MapFrom(src => src.OpcoesExtras.Where(o => o.TipoOpcao == TipoOpcaoExtra.Complemento)))
                .ForMember(dest => dest.Adicionais, opt => opt.MapFrom(src => src.OpcoesExtras.Where(o => o.TipoOpcao == TipoOpcaoExtra.Adicional)));
            // Mapeamento das opções (complementos e adicionais)
            CreateMap<ItemPedidoOpcao, ComplementoNotificationDTO>(); // Mapeia 'Nome' para 'Nome'
            CreateMap<ItemPedidoOpcao, AdicionalNotificationDTO>()
                .ForMember(dest => dest.Preco, opt => opt.MapFrom(src => src.PrecoUnitario)); // Mapeia 'PrecoUnitario' para 'Preco'
        }
    }
}