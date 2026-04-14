import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import iconCadastro from "@/assets/icon-cadastro.png";
import { ArrowLeft } from "lucide-react";

const loanAmount = 8000;

const installmentOptions = [
  { parcelas: 6, taxa: 4.99 },
  { parcelas: 12, taxa: 5.49 },
  { parcelas: 18, taxa: 5.99 },
  { parcelas: 24, taxa: 6.49 },
  { parcelas: 30, taxa: 6.99 },
  { parcelas: 36, taxa: 7.49 },
  { parcelas: 48, taxa: 7.99 },
];

const calcParcela = (valor: number, parcelas: number, taxaMensal: number) => {
  const i = taxaMensal / 100;
  const pmt = valor * (i * Math.pow(1 + i, parcelas)) / (Math.pow(1 + i, parcelas) - 1);
  return pmt;
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Simulacao = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cpfData, cadastro } = (location.state as any) || {};
  const [selected, setSelected] = useState(1); // index

  const handleConfirm = () => {
    const opt = installmentOptions[selected];
    const whatsappMsg = encodeURIComponent(
      `Olá! Quero solicitar meu empréstimo de ${formatCurrency(loanAmount)} em ${opt.parcelas}x de ${formatCurrency(calcParcela(loanAmount, opt.parcelas, opt.taxa))}. Nome: ${cadastro?.nomeCompleto || "N/A"}. Dia de pagamento: ${cadastro?.diaPagamento || "N/A"}.`
    );
    window.open(`https://wa.me/5511999999999?text=${whatsappMsg}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="py-4 flex justify-center bg-background border-b border-border/50">
        <img src={logo} alt="Logo" className="h-10 md:h-12" />
      </header>

      <div className="bg-primary py-6 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-md shrink-0">
            <img src={iconCadastro} alt="" className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-primary-foreground">
              Simulação do empréstimo
            </h1>
            <p className="text-sm text-primary-foreground/70 mt-0.5">
              Escolha a melhor opção de parcelamento para você.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-6"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          {/* Valor */}
          <div className="bg-primary/10 rounded-2xl p-6 text-center mb-8">
            <p className="text-sm text-muted-foreground">Valor do empréstimo</p>
            <p className="text-4xl md:text-5xl font-black text-primary tracking-tight mt-1">
              {formatCurrency(loanAmount)}
            </p>
          </div>

          {/* Opções de parcelamento */}
          <div className="space-y-3 mb-8">
            <p className="text-sm font-semibold text-foreground">Escolha o parcelamento:</p>
            {installmentOptions.map((opt, idx) => {
              const valorParcela = calcParcela(loanAmount, opt.parcelas, opt.taxa);
              const totalPago = valorParcela * opt.parcelas;
              const isSelected = selected === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelected(idx)}
                  className={`w-full p-4 rounded-2xl border text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {opt.parcelas}x de {formatCurrency(valorParcela)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Taxa de {opt.taxa}% a.m. · Total: {formatCurrency(totalPago)}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Resumo */}
          <div className="bg-muted rounded-2xl p-5 space-y-3 mb-8">
            <p className="text-sm font-semibold text-foreground">Resumo:</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor solicitado</span>
              <span className="font-bold text-foreground">{formatCurrency(loanAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcelas</span>
              <span className="font-bold text-foreground">
                {installmentOptions[selected].parcelas}x de{" "}
                {formatCurrency(
                  calcParcela(loanAmount, installmentOptions[selected].parcelas, installmentOptions[selected].taxa)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa mensal</span>
              <span className="font-bold text-foreground">{installmentOptions[selected].taxa}% a.m.</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total a pagar</span>
              <span className="font-bold text-foreground">
                {formatCurrency(
                  calcParcela(loanAmount, installmentOptions[selected].parcelas, installmentOptions[selected].taxa) *
                    installmentOptions[selected].parcelas
                )}
              </span>
            </div>
            {cadastro?.diaPagamento && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dia de pagamento</span>
                <span className="font-bold text-foreground">Dia {cadastro.diaPagamento}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirm}
            className="btn-3d w-full"
          >
            Confirmar e solicitar 🚀
          </button>
        </div>
      </main>
    </div>
  );
};

export default Simulacao;
