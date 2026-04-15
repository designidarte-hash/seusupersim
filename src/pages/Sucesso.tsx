import { useLocation } from "react-router-dom";
import { useTransitionNavigate } from "@/components/PageTransition";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";
import iconCheckCircle from "@/assets/icon-check-circle.png";
import { Mail, Clock, CreditCard, Shield } from "lucide-react";

const Sucesso = () => {
  const location = useLocation();
  const navigate = useTransitionNavigate();
  const { nome, valor, parcelas, valorParcela } = (location.state as any) || {};
  const firstName = nome ? nome.split(" ")[0] : "";

  const formatCurrency = (v: number) =>
    v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img src={logo} alt="Logo SuperSim" className="h-10 md:h-12" />
      </header>

      {/* Hero Success */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <img
            src={iconCheckCircle}
            alt="Sucesso"
            className="w-24 h-24 mx-auto animate-in zoom-in duration-500"
          />

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Tudo certo{firstName ? `, ${firstName}` : ""}!
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Seu crédito está sendo processado
            </p>
          </div>

          {/* Credit Card */}
          <div className="bg-primary rounded-3xl p-8 mt-6 space-y-3 shadow-xl">
            <p className="text-primary-foreground/80 text-sm">Valor aprovado</p>
            <p className="text-5xl md:text-6xl font-black text-primary-foreground tracking-tight">
              {formatCurrency(valor || 2500)}
            </p>
            {parcelas && valorParcela && (
              <p className="text-primary-foreground/70 text-sm">
                em até <strong>{parcelas}x</strong> de{" "}
                <strong>{formatCurrency(valorParcela)}</strong>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Email notification */}
      <section className="py-10 px-4">
        <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Fique atento ao seu e-mail
              </h2>
              <p className="text-sm text-muted-foreground">
                Você receberá um e-mail com todos os detalhes do seu empréstimo,
                incluindo o comprovante de liberação e os dados de pagamento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Info Steps */}
      <section className="py-8 px-4 pb-16">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-lg font-bold text-foreground text-center mb-6">
            Próximos passos
          </h3>

          <div className="flex items-start gap-4 bg-card border border-border rounded-xl p-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Seguro ativado</p>
              <p className="text-xs text-muted-foreground">
                Seu Seguro Prestamista já está ativo e cobrindo todas as parcelas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-card border border-border rounded-xl p-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Liberação em até 24h</p>
              <p className="text-xs text-muted-foreground">
                O valor será depositado na conta informada em até 24 horas úteis.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-card border border-border rounded-xl p-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Parcelas</p>
              <p className="text-xs text-muted-foreground">
                O boleto da primeira parcela será enviado por e-mail antes do vencimento.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-card border border-border rounded-xl p-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Confirmação por e-mail</p>
              <p className="text-xs text-muted-foreground">
                Verifique sua caixa de entrada (e spam) para o e-mail com os detalhes completos.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/", {})}
            className="btn-3d w-full mt-6"
          >
            Voltar ao início
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sucesso;
