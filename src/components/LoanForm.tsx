import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  const lookupCPF = async () => {
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF incompleto", description: "Digite os 11 dígitos do CPF.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const url = `https://ws.hubdodesenvolvedor.com.br/v2/cpf/?cpf=${cpfDigits}&token=${API_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === false || data.return === "NOK") {
        toast({ title: "CPF não encontrado", description: data.msg || "Verifique os dados e tente novamente.", variant: "destructive" });
        return;
      }

      const result = data.result || data;
      toast({ title: "Consulta realizada com sucesso!" });
      navigate("/resultado", { state: { cpfData: result } });
    } catch {
      toast({ title: "Erro na consulta", description: "Não foi possível consultar o CPF.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">CPF</label>
        <Input
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          className="h-14 border-input bg-background text-foreground placeholder:text-muted-foreground text-base rounded-xl"
        />
      </div>

      <Button
        type="button"
        onClick={lookupCPF}
        disabled={loading}
        className="w-full h-14 text-base font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {loading ? "Consultando..." : "Continuar"}
      </Button>
    </div>
  );
};

export default LoanForm;
