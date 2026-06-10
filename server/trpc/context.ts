import { createClient } from "@/lib/supabase/server";

export async function createTRPCContext() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userProfile = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("id, tier, onboarding_complete, coach_intensity")
      .eq("id", authUser.id)
      .single();
    userProfile = data;
  }

  return {
    supabase,
    user: authUser,
    userProfile,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
