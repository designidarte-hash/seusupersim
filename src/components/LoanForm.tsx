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

  const renderResult = (data: Record<string, unknown>) => {
    const entries = Object.entries(data).filter(
      ([, v]) => v !== null && v !== undefined && v !== "" && typeof v !== "object"
    );
    return entries.map(([key, value]) => (
      <tr key={key} className="border-b border-border last:border-0">
        <td className="py-2.5 px-3 font-medium text-foreground capitalize text-sm">
          {key.replace(/_/g, " ")}
        </td>
        <td className="py-2.5 px-3 text-muted-foreground text-sm">{String(value)}</td>
      </tr>
    ));
  };

  return (
    <div className="w-full space-y-5">
      {/* CPF */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">CPF</label>
        <Input
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          className="h-12 border-input bg-background text-foreground placeholder:text-muted-foreground"
        />
      </div>


      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Email</label>
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 border-input bg-background text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Termos */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          Li e concordo com os{" "}
          <a href="#" className="text-primary hover:underline">termos de uso</a> e{" "}
          <a href="#" className="text-primary hover:underline">política de privacidade</a>;
          permito a emissão de Cédula de Crédito Bancário e o acesso ao{" "}
          <a href="#" className="text-primary hover:underline">SCR - Banco Central do Brasil</a>,
          além de declarar que não sou uma pessoa politicamente exposta.
        </label>
      </div>

      {/* Botão */}
      <Button
        type="button"
        onClick={lookupCPF}
        disabled={loading}
        className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {loading ? "Consultando..." : "Pedir agora"}
      </Button>

      {/* Resultado */}
      {cpfData && (
        <div className="space-y-3 pt-2">
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
