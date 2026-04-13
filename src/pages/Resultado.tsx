import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { ArrowLeft } from "lucide-react";

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

const Resultado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cpfData = location.state?.cpfData as Record<string, unknown> | null;

  if (!cpfData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-muted-foreground">Nenhum dado encontrado.</p>
        <Button onClick={() => navigate("/")} variant="outline">
          Voltar ao início
        </Button>
      </div>
    );
  }

  const entries = Object.entries(cpfData).filter(
    ([, v]) => v !== null && v !== undefined && v !== "" && typeof v !== "object"
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg space-y-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-2xl font-bold text-foreground">Resultado da Consulta</h1>

          <div className="rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="h-1.5 bg-primary w-full" />
            <table className="w-full">
              <tbody>
                {entries.map(([key, value], i) => (
                  <tr
                    key={key}
                    className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "bg-muted/30" : ""}`}
                  >
                    <td className="py-3.5 px-5 font-semibold text-foreground text-sm whitespace-nowrap w-[40%]">
                      {labelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="py-3.5 px-5 text-muted-foreground text-sm break-all">
                      {String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            onClick={() => navigate("/")}
            className="w-full h-14 text-base font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
          >
            Nova consulta
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Resultado;
