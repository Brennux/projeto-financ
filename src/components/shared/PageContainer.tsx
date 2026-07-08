import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: Props) {
  return (
    <main className={cn("mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8", className)}>
      {children}
    </main>
  );
}
