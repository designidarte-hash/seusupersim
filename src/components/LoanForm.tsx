import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
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

type CpfResult = {
  nome?: string;
  cpf?: string;
  data_nascimento?: string;
  situacao_cadastral?: string;
  genero?: string;
  mae?: string;
} | null;

const LoanForm = () => {
  const { toast } = useToast();
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
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
    if (birthDate.replace(/\D/g, "").length !== 8) {
      toast({ title: "Data incompleta", description: "Digite a data de nascimento completa.", variant: "destructive" });
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

      const result = data.result || data;
      setCpfData(result);
      toast({ title: "CPF encontrado!", description: `Nome: ${result.nome || result.nome_da_pf || "—"}` });
    } catch {
      toast({ title: "Erro na consulta", description: "Não foi possível consultar o CPF.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: "Atenção", description: "Você precisa aceitar os termos para continuar.", variant: "destructive" });
      return;
    }
    toast({ title: "Solicitação enviada!", description: "Entraremos em contato em breve." });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">CPF</label>
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
        className="w-full h-10 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? "Consultando..." : "Consultar CPF"}
      </Button>

      {cpfData && (
        <div className="rounded-md border border-border bg-secondary p-4 space-y-1 text-sm">
          <p className="font-semibold text-foreground">{cpfData.nome || "—"}</p>
          {cpfData.situacao_cadastral && (
            <p className="text-muted-foreground">Situação: <span className="font-medium text-foreground">{cpfData.situacao_cadastral}</span></p>
          )}
          {cpfData.genero && (
            <p className="text-muted-foreground">Gênero: <span className="font-medium text-foreground">{cpfData.genero}</span></p>
          )}
          {cpfData.data_nascimento && (
            <p className="text-muted-foreground">Nascimento: <span className="font-medium text-foreground">{cpfData.data_nascimento}</span></p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Celular</label>
        <Input
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className="h-12 border-input bg-background text-foreground placeholder:text-muted-foreground"
        />
      </div>

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

      <div className="flex items-start gap-3 pt-2">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          Li e concordo com os{" "}
          <a href="#" className="text-primary underline">termos de uso</a> e{" "}
          <a href="#" className="text-primary underline">política de privacidade</a>;
          permito a emissão de Cédula de Crédito Bancário e o acesso ao{" "}
          <a href="#" className="text-primary underline">SCR - Banco Central do Brasil</a>,
          além de declarar que não sou uma pessoa politicamente exposta.
        </label>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
      >
        Pedir agora
      </Button>
    </form>
  );
};

export default LoanForm;
