import { useState } from "react";
import { useTransitionNavigate } from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { isCPFCompleted } from "@/lib/cpf-block";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatDate = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const API_TOKEN = "56fb9cbc8d3a7cf7d1c1c8ac12730ec883f150a7134687099bab95058c76aaab";

type CpfResult = Record<string, unknown> | null;

const getCpfName = (source: unknown): string => {
  if (!source || typeof source !== "object") return "";

  const data = source as Record<string, unknown>;
  const match = [data.nome, data.nome_da_pf, data.nome_completo, data.name].find(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  return match?.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) ?? "";
};

const LoanForm = () => {
  const { toast } = useToast();
  const navigate = useTransitionNavigate();
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  const lookupCPF = async () => {
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF incompleto", description: "Digite os 11 dígitos do CPF.", variant: "destructive" });
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lead_nome_completo");
    }

    setLoading(true);
    try {
      // Check if CPF already completed the flow
      const blocked = await isCPFCompleted(cpfDigits);
      if (blocked) {
        toast({
          title: "CPF já utilizado",
          description: "Este CPF já realizou uma solicitação de crédito. Não é possível solicitar novamente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const url = `https://bk.elaiflow.dev/consultar-filtrada/cpf?cpf=${cpfDigits}&token=${API_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data || !data.nome) {
        toast({ title: "CPF não encontrado", description: data?.message || data?.msg || "Verifique os dados e tente novamente.", variant: "destructive" });
        return;
      }

      // API elaiflow retorna: { cpf, nome, mae, sexo, nascimento }
      const result = {
        ...data,
        nome_da_pf: data.nome,
        data_nascimento: data.nascimento,
        sexo: data.sexo,
        nome_da_mae: data.mae,
      };
      const nomeCompleto = getCpfName(result);

      if (typeof window !== "undefined") {
        if (nomeCompleto) {
          sessionStorage.setItem("lead_nome_completo", nomeCompleto);
        } else {
          sessionStorage.removeItem("lead_nome_completo");
        }
        try {
          sessionStorage.setItem("cpfData", JSON.stringify(result || {}));
          sessionStorage.setItem("cpfDigits", cpfDigits || "");
        } catch {}
      }

      // Meta Pixel — Lead
      try {
        (window as any).fbq?.('track', 'Lead', {
          content_name: 'Consulta CPF',
          content_category: 'Emprestimo',
          currency: 'BRL',
        });
      } catch (e) { console.error('Meta Lead error:', e); }

      toast({ title: "Consulta realizada com sucesso!" });
      navigate("/resultado", { cpfData: result, cpfDigits: cpfDigits });
    } catch {
      toast({ title: "Erro na consulta", description: "Não foi possível consultar o CPF.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div>
        <Input
          placeholder="CPF"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          className="h-14 border-2 border-border bg-background text-foreground placeholder:text-muted-foreground text-base rounded-full px-5"
        />
      </div>

      <button
        type="button"
        onClick={lookupCPF}
        disabled={loading}
        className="btn-3d w-full h-14 flex items-center justify-center"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {loading ? "Consultando..." : "Continuar"}
      </button>
    </div>
  );
};

export default LoanForm;
