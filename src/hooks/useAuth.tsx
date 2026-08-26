import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
};

export type SessionInfo = {
  userId: string | null;
  email: string | null;
  perfil: Perfil | null;
  roles: string[];
  isAdmin: boolean;
};

async function fetchSession(): Promise<SessionInfo> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user ?? null;
  if (!user) return { userId: null, email: null, perfil: null, roles: [], isAdmin: false };

  const [{ data: perfil }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, nome, telefone, ativo").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roleList = (roles ?? []).map((r) => r.role as string);
  return {
    userId: user.id,
    email: user.email ?? null,
    perfil: (perfil as Perfil | null) ?? null,
    roles: roleList,
    isAdmin: roleList.includes("admin"),
  };
}

export function useAuth() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["session"] });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const query = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });

  return {
    ...(query.data ?? { userId: null, email: null, perfil: null, roles: [], isAdmin: false }),
    isLoading: query.isLoading,
  };
}
