import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { ArrowLeft, CheckCircle2, User, CalendarDays, Sparkles } from "lucide-react";
import emprestimo1 from "@/assets/emprestimo1.jpg";
import emprestimo2 from "@/assets/emprestimo2.jpg";
import emprestimo3 from "@/assets/emprestimo3.jpg";

const allowedFields = ["nome_da_pf", "data_nascimento"];

const labelMap: Record<string, string> = {
  nome_da_pf: "Nome Completo",
  data_nascimento: "Data de Nascimento",
};

const fieldIcons: Record<string, typeof User> = {
  nome_da_pf: User,
  data_nascimento: CalendarDays,
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/40 to-background">
      {/* Header */}
      <header className="py-5 flex justify-center bg-white/80 backdrop-blur-md border-b border-border/30 sticky top-0 z-10">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-12">
        {/* Result Card Area */}
        <div className="w-full max-w-lg space-y-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          {/* Success Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Consulta realizada!</h1>
              <p className="text-sm text-muted-foreground">Confira os dados encontrados abaixo.</p>
            </div>
          </div>

          {/* Data Cards */}
          <div className="space-y-4">
            {entries.map(([key, value]) => {
              const Icon = fieldIcons[key] || User;
              return (
                <div
                  key={key}
                  className="bg-white rounded-2xl border border-border/60 p-5 shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.12)] hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.2)] transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {labelMap[key] || key}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground pl-11">
                    {String(value)}
                  </p>
                </div>
              );
            })}
          </div>

          <Button
            onClick={() => navigate("/")}
            className="w-full h-14 text-base font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
          >
            Nova consulta
          </Button>
        </div>

        {/* Loan Products Section */}
        <section className="w-full mt-20">
          <div className="bg-[hsl(230,60%,18%)] rounded-3xl py-14 px-4 md:px-10 shadow-2xl">
            <div className="text-center mb-12">
              <p className="text-primary uppercase tracking-[0.35em] text-xs font-bold mb-4">
                É só pedir
              </p>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4">
                Nós temos as melhores soluções de
                <br />
                <span className="text-primary">empréstimo pessoal</span> para você
              </h2>
              <p className="text-white/60 text-sm max-w-md mx-auto">
                Conheça mais sobre nossos produtos e encontre a melhor opção.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {loanProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary to-orange-400 z-10" />
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={640}
                      height={512}
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2 leading-snug">
                      {product.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                      {product.description}
                    </p>
                    <ul className="space-y-3 mb-7 flex-1">
                      {product.benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 text-sm text-foreground">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.97]">
                      Quero um empréstimo
                    </Button>
                    <button className="text-primary text-sm font-semibold mt-4 hover:underline underline-offset-4 transition-all">
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
