import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { ArrowLeft, User, CalendarDays } from "lucide-react";
import iconCheckOrange from "@/assets/icon-check-orange.png";
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — same as Index */}
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      {/* Hero strip matching Index primary band */}
      <div className="bg-primary py-6 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-primary-foreground">
              Consulta realizada!
            </h1>
            <p className="text-sm text-primary-foreground/70">
              Confira os dados encontrados abaixo.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          {/* Data Cards */}
          <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {entries.map(([key, value], i) => {
              const Icon = fieldIcons[key] || User;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-4 px-5 py-5 ${
                    i !== entries.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      {labelMap[key] || key}
                    </p>
                    <p className="text-base font-bold text-foreground truncate">
                      {String(value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={() => navigate("/")}
            className="w-full h-14 text-base font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition active:scale-[0.98]"
          >
            Nova consulta
          </Button>
        </div>

        {/* Loan Products — matching Index style */}
        <section className="w-full max-w-5xl mt-16">
          <div className="text-center space-y-2 mb-10">
            <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
              É só pedir
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Nós temos as melhores soluções de{" "}
              <span className="text-primary">empréstimo pessoal</span> para você
            </h2>
            <p className="text-muted-foreground">
              Conheça mais sobre nossos produtos e encontre a melhor opção.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loanProducts.map((product, idx) => (
              <div
                key={idx}
                className="bg-background rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    width={640}
                    height={512}
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-foreground mb-2 leading-snug">
                    {product.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
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
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Button className="px-12 h-14 text-base font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition active:scale-[0.98]">
              Quero um empréstimo
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Resultado;
