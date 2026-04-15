import { supabase } from "@/integrations/supabase/client";

// Simple hash using Web Crypto API
async function hashCPF(cpf: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(cpf);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isCPFCompleted(cpfDigits: string): Promise<boolean> {
  const hash = await hashCPF(cpfDigits);
  const { data } = await supabase
    .from("completed_cpfs")
    .select("id")
    .eq("cpf_hash", hash)
    .maybeSingle();
  return !!data;
}

export async function markCPFCompleted(cpfDigits: string): Promise<void> {
  const hash = await hashCPF(cpfDigits);
  await supabase
    .from("completed_cpfs")
    .insert({ cpf_hash: hash });
}
