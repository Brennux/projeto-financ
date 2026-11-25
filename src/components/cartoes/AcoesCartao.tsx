"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { arquivarCartao, excluirCartao } from "@/app/actions/cartoes";
import type { CartaoInfo } from "@/lib/cartoes/server";
import { CartaoFormDialog } from "./CartaoFormDialog";

/** Editar, arquivar/reativar e excluir (so sem lancamentos) um cartao. */
export function AcoesCartao({ cartao, temLancamentos }: { cartao: CartaoInfo; temLancamentos: boolean }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();

  function arquivar() {
    iniciar(async () => {
      const resultado = await arquivarCartao(cartao.id, cartao.ativo);
      if (!resultado.ok) toast.error(resultado.erro);
      else toast.success(cartao.ativo ? "Cartão arquivado." : "Cartão reativado.");
    });
  }

  function excluir() {
    iniciar(async () => {
      const resultado = await excluirCartao(cartao.id);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Cartão excluído.");
      router.push("/cards");
    });
  }

  return (
    <>
      <CartaoFormDialog
        cartao={cartao}
        trigger={
          <Button variant="outline">
            <Pencil className="size-4" />
            Editar
          </Button>
        }
      />
      <Button variant="ghost" onClick={arquivar} disabled={ocupado} title={cartao.ativo ? "Some dos formulários; o histórico fica" : undefined}>
        {cartao.ativo ? <Archive className="size-4" /> : <ArchiveRestore className="size-4" />}
        {cartao.ativo ? "Arquivar" : "Reativar"}
      </Button>
      {!temLancamentos && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Excluir cartão">
                <Trash2 className="size-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir o cartão {cartao.nome}?</AlertDialogTitle>
              <AlertDialogDescription>Ele não tem nenhum lançamento, então nada mais é afetado.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={ocupado} onClick={excluir}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
