import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg px-3 py-2 text-base placeholder:text-muted-foreground/75 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border border-input bg-background/55 shadow-field transition-[border-color,background-color,box-shadow,color] duration-200 ease-out outline-none hover:border-[color-mix(in_oklch,var(--input),var(--ring)_40%)] focus-visible:border-ring focus-visible:bg-card focus-visible:shadow-none focus-visible:ring-4 focus-visible:ring-ring/15 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 dark:bg-background/45 dark:hover:bg-background/60 dark:focus-visible:bg-background/70 dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
