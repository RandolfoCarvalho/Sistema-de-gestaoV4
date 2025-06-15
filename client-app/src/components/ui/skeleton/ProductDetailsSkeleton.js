import React from 'react';
import { Skeleton } from './skeleton.jsx'; 

const ProductDetailsSkeleton = () => {
    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Esqueleto do Cabeçalho Fixo */}
            <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-30">
                <div className="max-w-2xl mx-auto flex items-center px-4 py-3">
                    <Skeleton className="h-6 w-6 rounded-full bg-gray-200" />
                    <Skeleton className="h-4 w-40 ml-4 bg-gray-200" />
                </div>
            </div>

            {/* Conteúdo principal com padding */}
            <div className="max-w-2xl mx-auto pt-16 pb-28">
                {/* Esqueleto da Imagem do Produto */}
                <Skeleton className="w-full h-64 bg-gray-200" />

                {/* Esqueleto das Informações do Produto */}
                <div className="bg-white px-4 py-5 space-y-3">
                    <Skeleton className="h-7 w-3/4 bg-gray-300" />
                    <Skeleton className="h-5 w-1/4 bg-gray-300" />
                    <Skeleton className="h-4 w-full bg-gray-200" />
                    <Skeleton className="h-4 w-5/6 bg-gray-200" />
                </div>

                <div className="h-2 bg-gray-50"></div>

                {/* Esqueleto das Opções (Complementos/Adicionais) */}
                <div className="bg-white px-4 py-5 space-y-6">
                    {/* Título da seção */}
                    <Skeleton className="h-6 w-1/2 bg-gray-300" />
                    {/* Linha de opção */}
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-2/3 bg-gray-200" />
                        <Skeleton className="h-4 w-1/5 bg-gray-200" />
                    </div>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-1/2 bg-gray-200" />
                        <Skeleton className="h-4 w-1/5 bg-gray-200" />
                    </div>
                </div>

                 {/* Esqueleto da Quantidade */}
                 <div className="bg-white px-4 py-6 mt-2 space-y-3">
                    <Skeleton className="h-6 w-1/3 bg-gray-300" />
                    <Skeleton className="h-10 w-32 bg-gray-200 rounded-lg" />
                 </div>
            </div>

            {/* Esqueleto do Rodapé Fixo */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-20">
                <div className="max-w-2xl mx-auto flex justify-between items-center p-4">
                    <Skeleton className="h-8 w-24 bg-gray-200" />
                    <Skeleton className="h-12 w-1/2 bg-gray-300 rounded-lg" />
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsSkeleton;