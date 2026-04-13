import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

const API_TOKEN = "203913065yMIiOaDfZL368158856";

type CpfResult = Record<string, unknown> | null;

const LoanForm = () => {
  const { toast } = useToast();
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cpfData, setCpfData] = useState<CpfResult>(null);

  const lookupCPF = async () => {
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF incompleto", description: "Digite os 11 dígitos do CPF.", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Termos obrigatórios", description: "Aceite os termos para continuar.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setCpfData(null);
    try {
      const url = `https://ws.hubdodesenvolvedor.com.br/v2/cpf/?cpf=${cpfDigits}&token=${API_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === false || data.return === "NOK") {
        toast({ title: "CPF não encontrado", description: data.msg || "Verifique os dados e tente novamente.", variant: "destructive" });
        return;
      }

      setCpfData(data.result || data);
      toast({ title: "Consulta realizada com sucesso!" });
    } catch {
      toast({ title: "Erro na consulta", description: "Não foi possível consultar o CPF.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const labelMap: Record<string, string> = {
    numero_de_cpf: "CPF",
    nome_da_pf: "Nome",
    data_nascimento: "Data de Nascimento",
    situacao_cadastral: "Situação Cadastral",
    data_inscricao: "Data de Inscrição",
    digito_verificador: "Dígito Verificador",
    comprovante_emitido: "Comprovante",
    comprovante_emitido_data: "Data do Comprovante",
  };

  const renderResult = (data: Record<string, unknown>) => {
    const entries = Object.entries(data).filter(
      ([, v]) => v !== null && v !== undefined && v !== "" && typeof v !== "object"
    );
    return entries.map(([key, value], i) => (
      <tr key={key} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "bg-muted/30" : ""}`}>
        <td className="py-3 px-4 font-semibold text-foreground text-sm whitespace-nowrap w-[40%]">
          {labelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </td>
        <td className="py-3 px-4 text-muted-foreground text-sm break-all">{String(value)}</td>
      </tr>
    ));
  };

  return (
    <div className="w-full space-y-6">
      {/* CPF */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">CPF</label>
        <Input
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          className="h-14 border-input bg-background text-foreground placeholder:text-muted-foreground text-base rounded-xl"
        />
      </div>

      {/* Botão */}
      <Button
        type="button"
        onClick={lookupCPF}
        disabled={loading}
        className="w-full h-14 text-base font-bold rounded-full bg-[hsl(48,100%,55%)] text-foreground hover:bg-[hsl(48,100%,48%)] shadow-md"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {loading ? "Consultando..." : "Continuar"}
      </Button>

      {/* Resultado */}
      {cpfData && (
        <div className="space-y-3 pt-4">
          <h3 className="text-lg font-bold text-foreground">Resultado da Consulta</h3>
          <div className="rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="h-1 bg-primary w-full" />
            <table className="w-full">
              <tbody>{renderResult(cpfData)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanForm;
