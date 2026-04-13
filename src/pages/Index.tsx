import LoanForm from "@/components/LoanForm";
import { Zap, CheckCircle, Percent, DollarSign, FileCheck } from "lucide-react";

const benefits = [
  { icon: Zap, title: "PIX na Hora", desc: "Rápido e descomplicado, dinheiro em instantes" },
  { icon: CheckCircle, title: "Inclusão para todos", desc: "Oferta também para negativados" },
  { icon: Percent, title: "Juros reduzidos", desc: "Flexibilidade nos próximos empréstimos" },
  { icon: DollarSign, title: "Cabe no seu bolso", desc: "Parcelas que cabem no orçamento" },
  { icon: FileCheck, title: "Sem burocracia", desc: "Sem papelada e enrolação" },
];

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="py-4 flex justify-center">
        <img
          src="https://www.supersim.com.br/image/simple-logo.png"
          alt="Logo"
          className="h-8"
        />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-2xl font-bold text-foreground text-center">
            Preencha seus dados para cadastro
          </h1>

          <LoanForm />
        </div>
      </main>

      {/* Benefits section */}
      <section className="bg-muted/50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
              Especial pra você
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Por que somos pra você?
            </h2>
            <p className="text-muted-foreground">
              Nossa tecnologia e segurança de dados garantem para você:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <b.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="mx-auto inline-block px-10 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
          >
            Quero um empréstimo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <img
            src="https://www.supersim.com.br/image/logo-supersim-grayscale.png"
            alt="Logo"
            className="h-6 mb-4 opacity-60"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este site é operado como correspondente bancário, nos termos da
            Resolução nº 3.954 do Banco Central do Brasil. Disponibilizamos
            produtos e serviços de crédito pessoal por meio de instituições
            financeiras parceiras. Nosso prazo de pagamento varia de 1 a 14
            meses. A taxa de juros praticada no produto de crédito pessoal é de
            12,5% a.m. (310,99% a.a.) até 19,9% a.m. (819% a.a.) e o custo
            efetivo total (CET) será a partir de 12,82% a.m. (325,31% a.a.). A
            tarifa de cadastro (TC) é de R$ 19 até R$ 150.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
