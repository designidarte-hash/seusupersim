import { useLocation } from "react-router-dom";

interface UserInfo {
  userName: string;
  userCpf: string;
}

const getFromSessionStorage = (): { name: string; cpf: string } => {
  if (typeof window === "undefined") return { name: "", cpf: "" };

  const name = sessionStorage.getItem("lead_nome_completo")?.trim() ?? "";
  const cpf = sessionStorage.getItem("cpfDigits")?.trim() ?? "";

  if (name && cpf) return { name, cpf };

  // Fallback: try cpfData blob
  try {
    const raw = sessionStorage.getItem("cpfData");
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const fallbackName =
        (parsed.nome_da_pf as string) ||
        (parsed.nome as string) ||
        "";
      return { name: name || fallbackName, cpf };
    }
  } catch {
    // ignore
  }

  return { name, cpf };
};

export const useFunnelUser = (): UserInfo => {
  const location = useLocation();
  const state = (location.state ?? {}) as Record<string, unknown>;

  const cpfData = state.cpfData as Record<string, unknown> | undefined;
  const cpfDigits = state.cpfDigits as string | undefined;
  const cadastro = state.cadastro as Record<string, unknown> | undefined;

  const stateName =
    (cadastro?.nomeCompleto as string) ||
    (cpfData?.nome_da_pf as string) ||
    (cpfData?.nome as string) ||
    "";

  const fromStorage = getFromSessionStorage();

  return {
    userName: stateName || fromStorage.name,
    userCpf: cpfDigits || fromStorage.cpf,
  };
};
