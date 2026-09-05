import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, ShieldCheck, Trash2, User, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { criarUsuario, excluirUsuario, listarUsuarios, type UsuarioAdmin } from "@/lib/usuarios.functions";

export const Route = createFileRoute("/_authenticated/usuarios/")({
  head: () => ({
    meta: [
      { title: "Usuários — CONNECT SISTEMAS" },
      { name: "description", content: "Gerencie a equipe, permissões de administrador e acesso ao sistema." },
      { property: "og:title", content: "Usuários — CONNECT SISTEMAS" },
      { property: "og:description", content: "Gerencie a equipe, permissões de administrador e acesso ao sistema." },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { isAdmin, isLoading: authLoading, userId } = useAuth();
  const qc = useQueryClient();

  const listar = useServerFn(listarUsuarios);
  const criar = useServerFn(criarUsuario);
  const excluir = useServerFn(excluirUsuario);

  const [novoOpen, setNovoOpen] = useState(false);
  const [editar, setEditar] = useState<UsuarioAdmin | null>(null);
  const [remover, setRemover] = useState<UsuarioAdmin | null>(null);
  const [transferirOpen, setTransferirOpen] = useState(false);
  const [destino, setDestino] = useState("");

  const [form, setForm] = useState({ email: "", senha: "", nome: "", telefone: "", admin: false });
  const [edit, setEdit] = useState({ nome: "", telefone: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["usuarios"],
    enabled: isAdmin,
    queryFn: () => listar({ data: undefined as never }),
  });

  const lista = data ?? [];
  const admins = lista.filter((u) => u.admin);
  const ok = (msg: string) => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["usuarios"] });
    qc.invalidateQueries({ queryKey: ["session"] });
  };
  const fail = (e: Error) => toast.error(e.message);

  const criarM = useMutation({
    mutationFn: () =>
      criar({
        data: {
          email: form.email,
          senha: form.senha,
          nome: form.nome,
          telefone: form.telefone,
          admin: form.admin,
        },
      }),
    onSuccess: () => {
      setNovoOpen(false);
      setForm({ email: "", senha: "", nome: "", telefone: "", admin: false });
      ok("Usuário criado");
    },
    onError: fail,
  });

  const editarM = useMutation({
    mutationFn: async () => {
      if (!editar) return;
      const { error } = await supabase
        .from("profiles")
        .update({ nome: edit.nome.trim(), telefone: edit.telefone.trim() || null })
        .eq("id", editar.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditar(null);
      ok("Dados atualizados");
    },
    onError: fail,
  });

  const excluirM = useMutation({
    mutationFn: () => excluir({ data: { id: remover!.id } }),
    onSuccess: () => {
      setRemover(null);
      ok("Usuário excluído");
    },
    onError: fail,
  });

  const nivelM = useMutation({
    mutationFn: async ({ id, admin }: { id: string; admin: boolean }) => {
      if (admin) {
        const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => ok("Nível de acesso atualizado"),
    onError: fail,
  });

  const ativoM = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("profiles").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => ok("Usuário atualizado"),
    onError: fail,
  });

  const transferirM = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("transferir_admin" as never, { novo_admin: destino } as never);
      if (error) {
        throw new Error(
          error.message || error.details || error.hint || "Não foi possível transferir a administração",
        );
      }
    },
    onSuccess: async () => {
      setTransferirOpen(false);
      setDestino("");
      // Perdemos o nível de administrador: descartar dados que exigem essa permissão.
      qc.removeQueries({ queryKey: ["usuarios"] });
      await qc.invalidateQueries({ queryKey: ["session"] });
      toast.success("Administração transferida. Seu acesso agora é de Funcionário.");
      navigate({ to: "/dashboard" });
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e && "message" in e
            ? String((e as { message: unknown }).message)
            : "Não foi possível transferir a administração";
      toast.error(msg);
    },
  });


  if (!authLoading && !isAdmin) {
    return <EmptyState title="Acesso restrito" description="Somente administradores gerenciam usuários." />;
  }

  const candidatos = lista.filter((u) => u.id !== userId && u.ativo);

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Equipe com acesso ao sistema."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setTransferirOpen(true)}>
              <UserCog className="size-4" /> Transferir administração
            </Button>
            <Button onClick={() => setNovoOpen(true)}>
              <Plus className="size-4" /> Novo usuário
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState title="Nenhum usuário" description="Cadastre o primeiro usuário da equipe." />
      ) : (
        <div className="space-y-2">
          {lista.map((u) => (
            <div key={u.id} className="rounded-xl border bg-card p-3 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  {u.admin ? <ShieldCheck className="size-5 text-primary" /> : <User className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {u.nome || "Sem nome"}
                    {u.id === userId ? <span className="text-muted-foreground"> (você)</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email ?? "sem e-mail"}
                    {u.telefone ? ` · ${u.telefone}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar usuário"
                    onClick={() => {
                      setEditar(u);
                      setEdit({ nome: u.nome, telefone: u.telefone ?? "" });
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir usuário"
                    disabled={u.id === userId || (u.admin && admins.length <= 1)}
                    onClick={() => setRemover(u)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <Label className="text-xs">Nível</Label>
                  <Select
                    value={u.admin ? "admin" : "funcionario"}
                    disabled={u.id === userId || nivelM.isPending}
                    onValueChange={(v) => nivelM.mutate({ id: u.id, admin: v === "admin" })}
                  >
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="funcionario">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <Label className="text-xs">Ativo</Label>
                  <Switch
                    checked={u.ativo}
                    disabled={u.id === userId || ativoM.isPending}
                    onCheckedChange={(v) => ativoM.mutate({ id: u.id, ativo: v })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Novo usuário */}
      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>A conta já é criada confirmada e pronta para uso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label className="text-sm">Administrador</Label>
              <Switch checked={form.admin} onCheckedChange={(v) => setForm({ ...form, admin: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => criarM.mutate()} disabled={criarM.isPending}>
              Criar usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar usuário */}
      <Dialog open={!!editar} onOpenChange={(v) => !v && setEditar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>{editar?.email ?? ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={edit.telefone} onChange={(e) => setEdit({ ...edit, telefone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditar(null)}>
              Cancelar
            </Button>
            <Button onClick={() => editarM.mutate()} disabled={editarM.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir usuário */}
      <Dialog open={!!remover} onOpenChange={(v) => !v && setRemover(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuário</DialogTitle>
            <DialogDescription>
              Esta ação é permanente. Confirme os dados antes de excluir.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-secondary/40 px-3 py-2 text-sm">
            <p className="font-semibold">{remover?.nome || "Sem nome"}</p>
            <p className="text-muted-foreground">{remover?.email ?? "sem e-mail"}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemover(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => excluirM.mutate()}
              disabled={excluirM.isPending}
            >
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transferir administração */}
      <Dialog open={transferirOpen} onOpenChange={setTransferirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir administração</DialogTitle>
            <DialogDescription>
              O usuário escolhido passará a ser Administrador e você perderá o nível de administrador,
              passando a Funcionário. Esta ação não pode ser desfeita por você.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Novo administrador (somente usuários ativos)</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o usuário" />
              </SelectTrigger>
              <SelectContent>
                {candidatos.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome || u.email || u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {candidatos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum usuário ativo disponível.</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferirOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!destino || transferirM.isPending}
              onClick={() => transferirM.mutate()}
            >
              Confirmar transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
