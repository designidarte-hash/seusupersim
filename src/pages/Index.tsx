import LoanForm from "@/components/LoanForm";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";
import heroImage from "@/assets/hero-image.png";
import iconPix from "@/assets/icon-pix.png";
import iconInclusao from "@/assets/icon-inclusao.png";
import iconJuros from "@/assets/icon-juros.png";
import iconParcelas from "@/assets/icon-parcelas.png";
import iconBurocracia from "@/assets/icon-burocracia.png";
import seloFeex from "@/assets/selo-feex.png";
import seloRa from "@/assets/selo-ra.png";
import seloFebraban from "@/assets/selo-febraban.png";
import seloAnbima from "@/assets/selo-anbima.png";
import seloSsl from "@/assets/selo-ssl.png";
import { ClipboardList, UserCheck, CreditCard, Send, Quote, Facebook, Youtube, Instagram, Linkedin } from "lucide-react";

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
  { name: "Luciano Dos Santos", img: "https://www.supersim.com.br/media/2022/09/pessoa1.png", text: "Fiz o empréstimo do valor que precisava, me passou total confiança. Sem burocracia, rápido, fácil e seguro. Só o juros que é um pouco alto, mas fora isso, eu super indico. Parabéns aos profissionais envolvidos!" },
  { name: "Fernanda Ap", img: "https://www.supersim.com.br/media/2022/09/pessoa2.png", text: "Muito profissional mesmo no começo achei que fosse mais um golpe de internet mais depois que uma menina entrou em contato em nome da empresa fiquei mais seguro obrigado pelo atendimento" },
  { name: "Brenda Luara Beltrame", img: "https://www.supersim.com.br/media/2022/09/pessoa3.png", text: "Eu simplesmente amo a Super sim, é o help que nós precisamos com condições sensacionais!" },
  { name: "Marcia Caverzan", img: "https://www.supersim.com.br/media/2025/06/depoimento-cliente-home.png", text: "Uma empresa séria e que realmente ajuda na hora do aperto, sem burocracias. Precisei, e lá estava o depósito. Pagamento facilitado e que cabem no orçamento. Pagando certinho, em dia, você consegue novo empréstimo com valor mais alto." },
  { name: "Elias Barbaroto", img: "https://www.supersim.com.br/media/2022/09/pessoa5.png", text: "Eu amei a super sim 😍 Atendeu minha necessidade! E superou minhas expectativas 😍😇✌😎" },
  { name: "Tatiana Bispo Dos Santos", img: null, text: "Recebi o dinheiro no tempo certo" },
];

const Index = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="py-3 px-4 flex items-center justify-between bg-background border-b border-border/50">
        <img
          src={logo}
          alt="Logo"
          className="h-8 md:h-10"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={scrollToTop}
            className="hidden sm:inline-flex px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition"
          >
            Simular empréstimo
          </button>
          <button className="flex flex-col gap-[5px] p-1">
            <span className="w-6 h-[2.5px] bg-foreground rounded-full"></span>
            <span className="w-6 h-[2.5px] bg-foreground rounded-full"></span>
            <span className="w-6 h-[2.5px] bg-foreground rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[hsl(45,100%,60%)] to-[hsl(36,97%,55%)] pt-4 px-4 overflow-visible">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center md:text-left md:flex-row md:items-center md:gap-8">
          {/* Left: title + subtitle + image */}
          <div className="flex-1 flex flex-col items-center md:items-start gap-1 pb-0">
            <h1 className="text-[1.45rem] md:text-[2.5rem] font-black text-primary-foreground leading-[1.1] tracking-tight">
              Empréstimo pessoal online com maior taxa de aprovação
            </h1>
            <p className="text-sm md:text-xl font-bold text-primary-foreground italic mb-1">
              Para cada desafio, um SIM!
            </p>
            <img
              src={heroImage}
              alt="Empréstimo pessoal online"
              className="w-72 md:w-[26rem] lg:w-[30rem] object-contain drop-shadow-xl mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Card — overlaps hero bottom */}
      <div className="relative z-10 -mt-28 px-4 pb-4 lg:hidden">
        <div className="max-w-md mx-auto bg-background rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xl text-foreground">
              <span className="font-extrabold">Empréstimo</span> de até{" "}
              <span className="font-extrabold">R$ 2.500!</span>
            </p>
            <p className="text-primary font-bold text-lg">Simule já.</p>
          </div>
          <LoanForm />
        </div>
      </div>

      {/* Desktop card inside hero - hidden on mobile */}
      <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 w-full max-w-md z-10" style={{ display: 'none' }}>
      </div>

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

          <div className="flex flex-wrap justify-center md:grid md:grid-cols-5 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex flex-col items-center gap-3 text-center w-[calc(50%-12px)] md:w-auto">
                <img src={b.img} alt={b.title} className="w-12 h-12 object-contain" />
                <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            className="btn-3d"
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
            className="btn-3d"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-background rounded-2xl p-6 text-center space-y-4 border border-border/50 shadow-sm">
                {t.img ? (
                  <img src={t.img} alt={t.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-primary/30" />
                ) : (
                  <div className="w-16 h-16 rounded-full mx-auto bg-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {t.name.charAt(0)}
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.text}
                </p>
                <p className="text-sm font-bold text-foreground italic">{t.name}</p>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            className="btn-3d"
          >
            Quero SIM também!
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background py-14 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
              Precisa de ajuda?
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Ainda tem dúvidas?
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "O que é um empréstimo pessoal?",
                a: "O empréstimo pessoal é uma solução financeira rápida e acessível para quem precisa de dinheiro para emergências, organizar as finanças ou realizar um projeto. Você solicita online, sem burocracia e com resposta em minutos. Aqui temos a maior taxa de aprovação do mercado!"
              },
              {
                q: "Como solicitar empréstimo?",
                a: "Basta preencher o formulário com seu CPF, aguardar a análise rápida, escolher a oferta que melhor se encaixa no seu orçamento e receber o dinheiro via PIX em até 5 minutos."
              },
              {
                q: "Como funcionam os empréstimos pessoais online?",
                a: "Todo o processo é feito online. Você preenche seus dados, nossa tecnologia analisa seu perfil de forma justa e rápida, e se aprovado, o dinheiro cai direto na sua conta via PIX."
              },
              {
                q: "Estou negativado, posso pedir um empréstimo?",
                a: "Sim! Temos ofertas também para negativados. Nossa tecnologia analisa diversos fatores além do score, aumentando suas chances de aprovação."
              },
              {
                q: "É necessário depósito antecipado para liberar empréstimo?",
                a: "Não! Nunca pedimos depósito antecipado. Desconfie de qualquer empresa que peça pagamento antes de liberar o crédito."
              },
              {
                q: "Fui aprovado! Em quanto tempo o dinheiro cai na minha conta?",
                a: "Após a aprovação, o dinheiro é enviado via PIX e pode cair na sua conta em até 5 minutos."
              },
              {
                q: "Por que nos escolher?",
                a: "Temos a maior taxa de aprovação do mercado, processo 100% online, sem burocracia, e dinheiro na conta via PIX em minutos. Atendemos todos os perfis, incluindo negativados."
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-muted/50 rounded-xl border border-border/50 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                  <span className="font-bold text-foreground text-sm md:text-base">{item.q}</span>
                  <span className="text-primary text-xl group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
