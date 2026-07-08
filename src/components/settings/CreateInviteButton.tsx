"use client";

import { useState } from "react";
import { createInvite } from "@/app/actions/household";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateInviteButton() {
  const [link, setLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const { token } = await createInvite();
      setLink(`${window.location.origin}/invite/${token}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={handleClick} disabled={pending} className="w-fit">
        {pending ? "Gerando..." : "Gerar convite"}
      </Button>
      {link && (
        <div className="flex items-center gap-2">
          <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
          <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(link)}>
            Copiar
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">O link expira em 7 dias ou apos o primeiro uso.</p>
    </div>
  );
}
