using AutoMapper;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Resquests;

namespace SistemaDeGestao.AutoMapper
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
                    TransactionId = src.Pagamento.TransactionId,
                    SubTotal = src.Pagamento.SubTotal ?? 0,
                    TaxaEntrega = src.Pagamento.TaxaEntrega ?? 0,
                    Desconto = src.Pagamento.Desconto ?? 0,
                    ValorTotal = src.Pagamento.ValorTotal,
                    FormaPagamento = src.Pagamento.FormaPagamento,
                    TrocoPara = src.Pagamento.TrocoPara,
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
