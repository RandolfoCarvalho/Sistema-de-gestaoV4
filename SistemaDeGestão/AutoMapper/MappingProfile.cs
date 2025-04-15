using AutoMapper;
using SistemaDeGestão.Models;
using SistemaDeGestão.Models.DTOs.Resquests;

namespace SistemaDeGestão.AutoMapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        { 
            //Pedido
            CreateMap<PedidoDTO, Pedido>()
                .ForMember(dest => dest.Numero, opt => opt.Ignore()) // Vamos gerar o número manualmente
                .ForMember(dest => dest.Pagamento, opt => opt.MapFrom(src => new PedidoPagamento
                {
                    SubTotal = src.Pagamento.SubTotal,
                    TaxaEntrega = src.Pagamento.TaxaEntrega,
                    Desconto = src.Pagamento.Desconto,
                    ValorTotal = src.Pagamento.ValorTotal,
                    FormaPagamento = src.Pagamento.FormaPagamento,
                    PagamentoAprovado = false
                }))
                .ForMember(dest => dest.EnderecoEntrega, opt => opt.MapFrom(src => src.Endereco));

            CreateMap<ItemPedidoDTO, ItemPedido>()
                .ForMember(dest => dest.OpcoesExtras, opt => opt.MapFrom(src => src.OpcoesExtras));

            CreateMap<ItemPedidoOpcaoDTO, ItemPedidoOpcao>();
            CreateMap<EnderecoEntregaDTO, EnderecoEntrega>();



        }
    }

}
