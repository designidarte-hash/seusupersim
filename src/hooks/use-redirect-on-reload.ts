import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Redireciona o usuário para a home (/) quando ele recarrega (F5 / refresh)
 * uma página intermediária do funil. Evita estados inconsistentes (sem
 * cpfData, sem progresso de chat, etc.) e força o usuário a refazer o fluxo
 * a partir do início — o que também impede duplicações de transações PIX
 * por reentrada no meio do funil.
 */
export const useRedirectOnReload = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isReload = false;
    try {
      const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (entries.length > 0) {
        isReload = entries[0].type === "reload";
      } else if ((performance as any).navigation) {
        // Fallback para navegadores antigos
        isReload = (performance as any).navigation.type === 1;
      }
    } catch {
      isReload = false;
    }

    if (isReload) {
      navigate("/", { replace: true });
    }
  }, [navigate]);
};
