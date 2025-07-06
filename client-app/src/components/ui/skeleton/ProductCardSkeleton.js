import { Skeleton } from "@/components/ui/skeleton/skeleton"; // O caminho pode variar

const ProductCardSkeleton = () => {
  return (
    <div className="flex flex-col space-y-3 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <Skeleton className="h-[180px] w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px] bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-6 w-[100px] bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;