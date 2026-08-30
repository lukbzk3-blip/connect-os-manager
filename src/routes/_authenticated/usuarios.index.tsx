import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

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

  const { data, isLoading } = useQuery({
    queryKey: ["usuarios"],
    enabled: isAdmin,
    queryFn: async () => {
      const [perfis, roles] = await Promise.all([
        supabase.from("profiles").select("id, nome, telefone, ativo, created_at").order("nome"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (perfis.error) throw perfis.error;
      if (roles.error) throw roles.error;
      const admins = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      return (perfis.data ?? []).map((p) => ({ ...p, admin: admins.has(p.id) }));
    },
  });

  const setAdmin = useMutation({
    mutationFn: async ({ id, admin }: { id: string; admin: boolean }) => {
      if (admin) {
        const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Permissão atualizada");
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      qc.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("profiles").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuário atualizado");
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!authLoading && !isAdmin) {
    return <EmptyState title="Acesso restrito" description="Somente administradores gerenciam usuários." />;
  }

  const lista = data ?? [];

  return (
    <div>
      <PageHeader title="Usuários" description="Equipe com acesso ao sistema." />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState title="Nenhum usuário" description="Novos usuários aparecem aqui após criarem conta." />
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
                    {u.admin ? "Administrador" : "Funcionário"}
                    {u.telefone ? ` · ${u.telefone}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <Label className="text-xs">Admin</Label>
                  <Switch
                    checked={u.admin}
                    disabled={u.id === userId || setAdmin.isPending}
                    onCheckedChange={(v) => setAdmin.mutate({ id: u.id, admin: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <Label className="text-xs">Ativo</Label>
                  <Switch
                    checked={u.ativo}
                    disabled={u.id === userId || setAtivo.isPending}
                    onCheckedChange={(v) => setAtivo.mutate({ id: u.id, ativo: v })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
