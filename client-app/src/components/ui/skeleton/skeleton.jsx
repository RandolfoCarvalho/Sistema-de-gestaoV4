// 💎 ARQUIVO: src/components/ui/skeleton.js

import { cn } from "@/utils/utils"; // Importa a função utilitária

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
export { Skeleton };