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

type CpfData = {
  ni: string;
  nome: string;
  situacao: { codigo: string; descricao: string };
} | null;

const LoanForm = () => {
  const { toast } = useToast();
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cpfData, setCpfData] = useState<CpfData>(null);

  const lookupCPF = async (rawCpf: string) => {
    const digits = rawCpf.replace(/\D/g, "");
    if (digits.length !== 11) return;

    setLoading(true);
    setCpfData(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/v1/cpf/v1/${digits}`);
      if (!res.ok) {
        toast({ title: "CPF não encontrado", description: "Verifique o número e tente novamente.", variant: "destructive" });
        return;
      }
      const data = await res.json();
      setCpfData(data);
      toast({ title: "CPF encontrado!", description: `Nome: ${data.nome}` });
    } catch {
      toast({ title: "Erro na consulta", description: "Não foi possível consultar o CPF. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11) {
      lookupCPF(formatted);
    } else {
      setCpfData(null);
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
        <div className="relative">
          <Input
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => handleCpfChange(e.target.value)}
            className="h-12 border-input bg-background text-foreground placeholder:text-muted-foreground pr-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
        {cpfData && (
          <div className="rounded-md border border-border bg-secondary p-3 space-y-1 text-sm">
            <p className="font-semibold text-foreground">{cpfData.nome}</p>
            <p className="text-muted-foreground">
              Situação: <span className="font-medium text-foreground">{cpfData.situacao?.descricao || "—"}</span>
            </p>
          </div>
        )}
      </div>

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
