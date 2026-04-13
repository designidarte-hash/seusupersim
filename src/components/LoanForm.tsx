import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
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
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [cpfData, setCpfData] = useState<CpfResult>(null);

  const lookupCPF = async () => {
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF incompleto", description: "Digite os 11 dígitos do CPF.", variant: "destructive" });
      return;
    }
    if (birthDate.replace(/\D/g, "").length !== 8) {
      toast({ title: "Data incompleta", description: "Digite a data de nascimento completa (DD/MM/AAAA).", variant: "destructive" });
      return;
    }

    setLoading(true);
    setCpfData(null);
    try {
      const url = `https://ws.hubdodesenvolvedor.com.br/v2/cpf/?cpf=${cpfDigits}&data=${encodeURIComponent(birthDate)}&token=${API_TOKEN}`;
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

  const renderResult = (data: Record<string, unknown>) => {
    const entries = Object.entries(data).filter(
      ([, v]) => v !== null && v !== undefined && v !== "" && typeof v !== "object"
    );
    return entries.map(([key, value]) => (
      <tr key={key} className="border-b border-border">
        <td className="py-2 px-3 font-medium text-foreground capitalize text-sm">
          {key.replace(/_/g, " ")}
        </td>
        <td className="py-2 px-3 text-muted-foreground text-sm">{String(value)}</td>
      </tr>
    ));
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Digite o CPF</label>
          <Input
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            className="h-12 border-input bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Data de Nascimento</label>
          <Input
            placeholder="DD/MM/AAAA"
            value={birthDate}
            onChange={(e) => setBirthDate(formatDate(e.target.value))}
            className="h-12 border-input bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Button
          type="button"
          onClick={lookupCPF}
          disabled={loading}
          className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {loading ? "Consultando..." : "Consultar"}
        </Button>
      </div>

      {cpfData && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground">Resultado da Consulta</h3>
          <div className="rounded-lg border border-border overflow-hidden">
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
