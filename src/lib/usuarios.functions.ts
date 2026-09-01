import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Não foi possível validar sua permissão");
  if (!data) throw new Error("Somente administradores podem gerenciar usuários");
}

export type UsuarioAdmin = {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  email: string | null;
  admin: boolean;
};

export const listarUsuarios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioAdmin[]> => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [perfis, roles, auth] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, nome, telefone, ativo").order("nome"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (perfis.error) throw new Error(perfis.error.message);
    if (roles.error) throw new Error(roles.error.message);

    const admins = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    const emails = new Map((auth.data?.users ?? []).map((u) => [u.id, u.email ?? null]));

    return (perfis.data ?? []).map((p) => ({
      id: p.id,
      nome: p.nome ?? "",
      telefone: p.telefone ?? null,
      ativo: p.ativo,
      email: emails.get(p.id) ?? null,
      admin: admins.has(p.id),
    }));
  });

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    email: string;
    senha: string;
    nome: string;
    telefone?: string;
    admin?: boolean;
  }) => {
    if (!input.email?.includes("@")) throw new Error("Informe um e-mail válido");
    if (!input.senha || input.senha.length < 6) throw new Error("A senha deve ter ao menos 6 caracteres");
    if (!input.nome?.trim()) throw new Error("Informe o nome do usuário");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim(),
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome.trim(), telefone: data.telefone ?? null },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Não foi possível criar o usuário");

    const id = created.user.id;
    await supabaseAdmin
      .from("profiles")
      .update({ nome: data.nome.trim(), telefone: data.telefone?.trim() || null })
      .eq("id", id);

    if (data.admin) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", id).eq("role", "funcionario");
      await supabaseAdmin.from("user_roles").insert({ user_id: id, role: "admin" });
    }

    return { id };
  });

export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Usuário inválido");
    return input;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    if (data.id === ctx.userId) throw new Error("Você não pode excluir a própria conta");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (rolesError) throw new Error(rolesError.message);

    const admins = (roles ?? []).map((r) => r.user_id);
    if (admins.includes(data.id) && admins.length <= 1) {
      throw new Error("Não é possível excluir o único administrador. Transfira a administração antes.");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
