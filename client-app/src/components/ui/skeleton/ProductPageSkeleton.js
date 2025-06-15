// 💎 NOVO ARQUIVO: src/components/Produtos/ProductPageSkeleton.js
import { Skeleton } from "@/components/ui/skeleton/skeleton";

const ProductPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Esqueleto do Header e StoreInfo */}
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-3/4 mx-auto bg-gray-200" />
        </div>
        <div className="p-4 flex items-center space-x-4 border-b">
          <Skeleton className="h-16 w-16 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 bg-gray-200" />
            <Skeleton className="h-3 w-32 bg-gray-200" />
          </div>
        </div>
        {/* Esqueleto dos Filtros de Categoria */}
        <div className="p-4 flex space-x-4 overflow-x-auto">
          <Skeleton className="h-8 w-24 rounded-full bg-gray-200" />
          <Skeleton className="h-8 w-24 rounded-full bg-gray-200" />
          <Skeleton className="h-8 w-32 rounded-full bg-gray-200" />
          <Skeleton className="h-8 w-20 rounded-full bg-gray-200" />
        </div>
      </header>

      <main className="flex-grow pb-24">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Esqueleto do Banner */}
          <Skeleton className="w-full h-40 md:h-56 rounded-lg my-6 bg-gray-200" />
          
          {/* Esqueleto da Seção de Produtos */}
          <div className="space-y-8">
            {/* Título da Categoria */}
            <Skeleton className="h-6 w-1/3 my-4 bg-gray-200" />
            {/* Grade de Produtos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex space-x-4 p-2">
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-full bg-gray-300" />
                    <Skeleton className="h-3 w-5/6 bg-gray-300" />
                    <Skeleton className="h-5 w-1/4 mt-2 bg-gray-300" />
                  </div>
                  <Skeleton className="h-24 w-24 rounded-md bg-gray-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Esqueleto do BottomNav */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-2">
          <div className="flex justify-around">
            <Skeleton className="h-10 w-16 bg-gray-200"/>
            <Skeleton className="h-10 w-16 bg-gray-200"/>
            <Skeleton className="h-10 w-16 bg-gray-200"/>
            <Skeleton className="h-10 w-16 bg-gray-200"/>
          </div>
      </footer>
    </div>
  );
};

export default ProductPageSkeleton;