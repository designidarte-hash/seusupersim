import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import emprestimo1 from "@/assets/emprestimo1.jpg";
import emprestimo2 from "@/assets/emprestimo2.jpg";
import emprestimo3 from "@/assets/emprestimo3.jpg";

const allowedFields = ["nome_da_pf", "data_nascimento"];

const labelMap: Record<string, string> = {
  nome_da_pf: "Nome Completo",
  data_nascimento: "Data de Nascimento",
};

const loanProducts = [
  {
    image: emprestimo1,
    title: "Empréstimo Online com SuperSeguro",
    description: "Nosso empréstimo com as garantias do SuperSeguro foi criado pensando na flexibilidade e garantias contra imprevistos da vida.",
    benefits: ["Seguro Prestamista", "Sorteios Promocionais", "Seguridades para quitação"],
  },
  {
    image: emprestimo2,
    title: "Empréstimo online sem garantia",
    description: "Precisa de dinheiro rápido e sem burocracia? Oferecemos nosso empréstimo pessoal sem garantia.",
    benefits: ["Excelentes taxas de aprovação para todos", "Empréstimo pessoal sem garantia", "Rápido e sem burocracia"],
  },
  {
    image: emprestimo3,
    title: "Multiplik - Indique & ganhe dinheiro",
    description: "Faça uma renda extra de até R$ 3000 por mês através do nosso programa de indicação.",
    benefits: ["Cadastre-se e tenha acesso ao seu link de indicação pessoal", "Compartilhe o link em todos os grupos e redes sociais", "Receba até R$ 150 por cada indicação"],
  },
];

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
    ([key]) => allowedFields.includes(key)
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

        {/* Loan Products Section */}
        <section className="w-full mt-16">
          <div className="bg-[hsl(230,60%,20%)] rounded-2xl py-12 px-4 md:px-8">
            <div className="text-center mb-10">
              <p className="text-primary uppercase tracking-[0.3em] text-sm font-semibold mb-3">
                É só pedir
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
                Nós temos as melhores soluções de<br />empréstimo pessoal para você
              </h2>
              <p className="text-white/70 text-sm">
                Conheça mais sobre nossos produtos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {loanProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col border-t-4 border-primary"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    width={640}
                    height={512}
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {product.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-5">
                      {product.description}
                    </p>
                    <ul className="space-y-3 mb-6 flex-1">
                      {product.benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12">
                      Quero um empréstimo
                    </Button>
                    <button className="text-primary text-sm font-semibold mt-3 hover:underline">
                      Saber Mais
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Resultado;
