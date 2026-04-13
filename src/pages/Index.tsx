import LoanForm from "@/components/LoanForm";
import logo from "@/assets/logo.png";
import heroImage from "@/assets/hero-image.png";
import iconPix from "@/assets/icon-pix.png";
import iconInclusao from "@/assets/icon-inclusao.png";
import iconJuros from "@/assets/icon-juros.png";
import iconParcelas from "@/assets/icon-parcelas.png";
import iconBurocracia from "@/assets/icon-burocracia.png";
import { ClipboardList, UserCheck, CreditCard, Send, Quote } from "lucide-react";

const benefits = [
  { img: iconPix, title: "PIX na Hora", desc: "Rápido e descomplicado, dinheiro em instantes" },
  { img: iconInclusao, title: "Inclusão para todos", desc: "Oferta também para negativados" },
  { img: iconJuros, title: "Juros reduzidos", desc: "Flexibilidade nos próximos empréstimos" },
  { img: iconParcelas, title: "Cabe no seu bolso", desc: "Parcelas que cabem no orçamento" },
  { img: iconBurocracia, title: "Sem burocracia", desc: "Sem papelada e enrolação" },
];

const steps = [
  { icon: ClipboardList, step: "1", title: "Preencha o formulário", desc: "Informe seu CPF e dados básicos em poucos segundos." },
  { icon: UserCheck, step: "2", title: "Análise rápida", desc: "Nossa tecnologia analisa seu perfil de forma justa e rápida." },
  { icon: CreditCard, step: "3", title: "Escolha a oferta", desc: "Selecione o valor e as parcelas que cabem no seu bolso." },
  { icon: Send, step: "4", title: "Receba via PIX", desc: "Dinheiro na conta em até 5 minutos, sem burocracia." },
];

const testimonials = [
  { name: "Luciano Dos Santos", text: "Fiz o empréstimo do valor que precisava, me passou total confiança. Sem burocracia, rápido, fácil e seguro. Eu super indico!" },
  { name: "Brenda Luara B.", text: "Simplesmente amo! É o help que nós precisamos com condições sensacionais!" },
  { name: "Marcia Caverzan", text: "Uma empresa séria e que realmente ajuda na hora do aperto, sem burocracias. Pagamento facilitado e que cabem no orçamento." },
];

const Index = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img
          src={logo}
          alt="Logo"
          className="h-10 md:h-12"
        />
      </header>

      {/* Hero */}
      <section className="bg-primary py-12 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
          {/* Left - Image + Text */}
          <div className="flex-1 flex flex-col items-center md:items-start gap-6">
            <img
              src={heroImage}
              alt="Empréstimo pessoal online"
              className="w-80 md:w-[28rem] lg:w-[32rem] object-contain"
            />
          </div>
          {/* Right - Card */}
          <div className="w-full max-w-md space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground leading-tight text-center md:text-left">
              Empréstimo pessoal online com maior taxa de aprovação
            </h1>
            <p className="text-lg font-semibold text-primary-foreground/80 text-center md:text-left">
              Para cada desafio, um SIM!
            </p>
            <div className="bg-background rounded-2xl p-6 shadow-lg space-y-4">
              <div className="text-center space-y-1">
                <p className="text-lg font-bold text-foreground">
                  Empréstimo de até <span className="text-primary">R$ 2.500!</span>
                </p>
                <p className="text-primary font-semibold">Simule já.</p>
              </div>
              <LoanForm />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background py-14 px-4">
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
              <div key={b.title} className="flex flex-col items-center gap-3 text-center">
                <img src={b.img} alt={b.title} className="w-12 h-12 object-contain" />
                <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            className="inline-block px-10 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
          >
            Quero um empréstimo
          </button>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-muted/50 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
              Como funciona
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Solicitar seu empréstimo leva 5 minutos
            </h2>
            <p className="text-muted-foreground">
              Descomplicado, fácil e sem papelada!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                  <s.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-primary">Passo {s.step}</span>
                <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            className="inline-block px-10 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
          >
            Solicitar empréstimo
          </button>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="bg-background py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              + de 2 MILHÕES de pessoas
            </p>
            <p className="text-muted-foreground font-semibold">receberam nosso SIM!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-muted/50 rounded-2xl p-6 text-left space-y-3 border border-border/50">
                <Quote className="w-6 h-6 text-primary/40" />
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{t.text}"
                </p>
                <p className="text-sm font-bold text-foreground">{t.name}</p>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            className="inline-block px-10 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
          >
            Quero SIM também!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <img
            src="https://www.supersim.com.br/image/logo-supersim-grayscale.png"
            alt="Logo"
            className="h-6 mb-4 opacity-60"
          />
          <p className="text-xs text-muted leading-relaxed">
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
