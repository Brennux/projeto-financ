"use client";

import { useState, useTransition, type ReactElement } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { salvarCategoria } from "@/app/actions/categorias";
import { CHAVES_COR, CORES_CATEGORIA, CORES_CATEGORIA_ROTULO, type CorCategoria } from "@/lib/categorias/cores";
import { CHAVES_ICONE, ICONES_CATEGORIA, type IconeCategoria } from "@/lib/categorias/icones";
import type { CategoriaInfo } from "@/lib/categorias/types";
import type { Tipo } from "@/lib/parser/types";
import { cn } from "@/lib/utils";

interface Props {
  categoria?: CategoriaInfo;
  trigger: ReactElement;
}

function estiloCor(chave: CorCategoria): React.CSSProperties {
  const cor = CORES_CATEGORIA[chave];
  return { "--cor-claro": cor.light, "--cor-escuro": cor.dark } as React.CSSProperties;
}

const ROTULO_TIPO: Record<Tipo, string> = { despesa: "Despesa", receita: "Receita" };

export function CategoriaFormDialog({ categoria, trigger }: Props) {
  const [aberto, setAberto] = useState(false);
  const [salvando, iniciarSalvamento] = useTransition();
  const sistema = categoria?.sistema ?? false;

  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [tipos, setTipos] = useState<Tipo[]>(categoria?.tipos ?? ["despesa"]);
  const [cor, setCor] = useState<CorCategoria>((categoria?.cor as CorCategoria) ?? "azul");
  const [icone, setIcone] = useState<IconeCategoria>((categoria?.icone as IconeCategoria) ?? "outros");
  const [palavras, setPalavras] = useState((categoria?.palavrasChave ?? []).join(", "));

  function restaurar() {
    setNome(categoria?.nome ?? "");
    setTipos(categoria?.tipos ?? ["despesa"]);
    setCor((categoria?.cor as CorCategoria) ?? "azul");
    setIcone((categoria?.icone as IconeCategoria) ?? "outros");
    setPalavras((categoria?.palavrasChave ?? []).join(", "));
  }

  function alternarTipo(tipo: Tipo) {
    setTipos((atual) => (atual.includes(tipo) ? atual.filter((t) => t !== tipo) : [...atual, tipo]));
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    iniciarSalvamento(async () => {
      const resultado = await salvarCategoria(categoria?.id ?? null, {
        nome,
        tipos,
        cor,
        icone,
        palavrasChave: palavras.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean),
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(categoria ? "Categoria atualizada." : "Categoria criada.");
      setAberto(false);
      if (!categoria) restaurar();
    });
  }

  const IconeSelecionado = ICONES_CATEGORIA[icone];

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        setAberto(valor);
        if (!valor) restaurar();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            As palavras-chave ensinam o bot do WhatsApp a reconhecer essa categoria nas mensagens.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="flex flex-col gap-5">
          <div className="flex items-end gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--cor-claro)/15 text-(--cor-claro) dark:bg-(--cor-escuro)/20 dark:text-(--cor-escuro)"
              style={estiloCor(cor)}
              aria-hidden
            >
              <IconeSelecionado className="size-5" />
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="nome-categoria">Nome</Label>
              <Input
                id="nome-categoria"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={30}
                disabled={sistema}
                placeholder="Ex.: Farmácia"
                required
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-1.5" disabled={sistema}>
            <legend className="mb-1.5 text-sm font-medium">Usada para</legend>
            <div className="flex gap-2">
              {(["despesa", "receita"] as const).map((tipo) => {
                const ativo = tipos.includes(tipo);
                return (
                  <button
                    key={tipo}
                    type="button"
                    role="checkbox"
                    aria-checked={ativo}
                    onClick={() => alternarTipo(tipo)}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors disabled:opacity-50",
                      ativo ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
                    )}
                  >
                    {ativo && <Check className="size-3.5" />}
                    {ROTULO_TIPO[tipo]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Cor</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {CHAVES_COR.map((chave) => (
                <button
                  key={chave}
                  type="button"
                  role="radio"
                  aria-checked={cor === chave}
                  aria-label={CORES_CATEGORIA_ROTULO[chave]}
                  title={CORES_CATEGORIA_ROTULO[chave]}
                  onClick={() => setCor(chave)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full bg-(--cor-claro) text-white ring-offset-2 ring-offset-background transition-transform hover:scale-110 dark:bg-(--cor-escuro)",
                    cor === chave && "ring-2 ring-foreground",
                  )}
                  style={estiloCor(chave)}
                >
                  {cor === chave && <Check className="size-4" />}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Ícone</legend>
            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10" role="radiogroup">
              {CHAVES_ICONE.map((chave) => {
                const Icone = ICONES_CATEGORIA[chave];
                return (
                  <button
                    key={chave}
                    type="button"
                    role="radio"
                    aria-checked={icone === chave}
                    aria-label={chave}
                    onClick={() => setIcone(chave)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg border transition-colors",
                      icone === chave
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icone className="size-4" />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="palavras-categoria">Palavras-chave (separe por vírgula)</Label>
            <Textarea
              id="palavras-categoria"
              rows={3}
              value={palavras}
              onChange={(e) => setPalavras(e.target.value)}
              placeholder="Ex.: farmacia, drogaria, remedio"
            />
            <p className="text-xs text-muted-foreground">
              Se a mensagem tiver uma dessas palavras (ou o nome da categoria), o gasto cai aqui. Acentos e
              maiúsculas não importam.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={salvando || tipos.length === 0 || !nome.trim()}>
              {salvando ? "Salvando..." : categoria ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
