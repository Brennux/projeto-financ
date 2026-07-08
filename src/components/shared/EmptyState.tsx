interface Props {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: Props) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
