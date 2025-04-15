import { FaChartBar, FaPlusSquare, FaLayerGroup, FaPuzzlePiece, FaBox, FaSignOutAlt } from "react-icons/fa";

export const links = [
    {
        href: "/admin/dashboard",
        icon: FaChartBar,
        text: "Dashboard",
    },
    {
        href: "/admin/CriarProduto",
        icon: FaPlusSquare,
        text: "Criar produto",
        badge: {
            color: "bg-gray-100 text-gray-800",
            darkColor: "dark:bg-gray-700 dark:text-gray-300",
        },
    },
    {
        href: "/admin/CriarGrupoAdicionais",
        icon: FaLayerGroup,
        text: "Criar Grupo adicionais",
        badge: {
            color: "bg-blue-100 text-blue-800",
            darkColor: "dark:bg-blue-900 dark:text-blue-300",
        },
    },
    {
        href: "/admin/CriarComplemento",
        icon: FaPuzzlePiece,
        text: "Criar complemento",
    },
    {
        href: "/admin/MeusProdutos",
        icon: FaBox, 
        text: "Meus Produtos",
    },
    {
        href: "/admin/Perfil",
        icon: FaBox,
        text: "Perfil",
    },
    {
        href: "/admin/Sair",
        icon: FaSignOutAlt, 
        text: "Sair",
    },

];
