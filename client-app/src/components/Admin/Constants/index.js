import { 
  BarChart3, 
  PlusCircle, 
  LayersIcon, 
  PuzzleIcon, 
  PackageSearch, 
  UserCircle, 
  MessageSquareText, 
  LogOut 
} from "lucide-react";

export const links = [
    {
        href: "/admin/dashboard",
        icon: BarChart3,
        text: "Dashboard",
    },
    {
        href: "/admin/CriarProduto",
        icon: PlusCircle,
        text: "Criar produto",
        badge: {
            text: "Novo"
        },
    },
    {
        href: "/admin/CriarGrupoAdicionais",
        icon: LayersIcon,
        text: "Criar adicionais",
    },
    {
        href: "/admin/CriarComplemento",
        icon: PuzzleIcon,
        text: "Criar complementos",
    },
    {
        href: "/admin/MeusProdutos",
        icon: PackageSearch,
        text: "Meus Produtos",
    },
    {
        href: "/admin/Perfil",
        icon: UserCircle,
        text: "Perfil",
    },
    {
        href: "/admin/WhatsappBOT",
        icon: MessageSquareText,
        text: "WhatsappBOT",
    },
    {
        href: "/admin/Sair",
        icon: LogOut,
        text: "Sair",
    },
];