import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: Props) {
  return (
    <main className={cn("mx-auto flex max-w-6xl flex-col gap-6 p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out md:p-6 lg:p-8", className)}>
      {children}
    </main>
  );
}
