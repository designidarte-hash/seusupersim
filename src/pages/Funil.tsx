import { Link } from "react-router-dom";
import { ArrowRight, Home, FileSearch, UserPlus, ShieldCheck, BadgeCheck, Calculator, MessageCircle, Send, CheckCircle2, Camera, QrCode, Lock, Trophy } from "lucide-react";

type Step = {
  path: string;
  title: string;
  description: string;
  icon: typeof Home;
  group: "principal" | "pagamento" | "extra";
  order?: number;
};

const steps: Step[] = [
  // Funil principal
  { path: "/", title: "1. Home", description: "Landing page com formulário de CPF", icon: Home, group: "principal", order: 1 },
  { path: "/resultado", title: "2. Resultado", description: "Exibição dos produtos de empréstimo após consulta CPF", icon: FileSearch, group: "principal", order: 2 },
  { path: "/cadastro", title: "3. Cadastro", description: "Coleta de dados complementares do usuário", icon: UserPlus, group: "principal", order: 3 },
  { path: "/analise", title: "4. Análise de Crédito", description: "Animação de 4 etapas de análise automática", icon: ShieldCheck, group: "principal", order: 4 },
  { path: "/aprovado", title: "5. Aprovado", description: "Tela de aprovação com limite pré-aprovado", icon: BadgeCheck, group: "principal", order: 5 },
  { path: "/simulacao", title: "6. Simulação", description: "Escolha de parcelas (6x a 48x)", icon: Calculator, group: "principal", order: 6 },
  { path: "/redirecionando", title: "7. Redirecionando", description: "Tela de transição para o chat", icon: Send, group: "principal", order: 7 },
  { path: "/chat", title: "8. Chat", description: "Atendimento via chat para finalização", icon: MessageCircle, group: "principal", order: 8 },
  { path: "/sucesso", title: "9. Sucesso", description: "Confirmação final do processo", icon: CheckCircle2, group: "principal", order: 9 },

  // Pagamento PIX (preview)
  { path: "/preview-pix", title: "Preview PIX", description: "Tela de pagamento PIX padrão", icon: QrCode, group: "pagamento" },
  { path: "/preview-pix-seguro", title: "Preview PIX Seguro", description: "Tela de pagamento PIX seguro", icon: Lock, group: "pagamento" },
  { path: "/preview-premiado", title: "Preview Premiado", description: "Tela de contrato premiado", icon: Trophy, group: "pagamento" },

  // Extras
  { path: "/teste-camera", title: "Teste Câmera", description: "Verificação facial / teste de câmera", icon: Camera, group: "extra" },
];

const groupTitles: Record<Step["group"], string> = {
  principal: "Funil Principal",
  pagamento: "Telas de Pagamento (Preview)",
  extra: "Extras / Debug",
};

const Funil = () => {
  const grouped = (["principal", "pagamento", "extra"] as const).map((g) => ({
    group: g,
    items: steps.filter((s) => s.group === g).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Mapa do Funil
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e acesse rapidamente todas as etapas e telas do funil.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {grouped.map(({ group, items }) => (
          <section key={group} className="space-y-4">
            <h2 className="text-lg font-bold text-foreground border-l-4 border-primary pl-3">
              {groupTitles[group]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.path}
                    to={step.path}
                    className="group bg-card border border-border/40 rounded-2xl p-5 hover:border-primary/40 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-foreground text-sm">
                            {step.title}
                          </h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {step.description}
                        </p>
                        <code className="text-[10px] font-mono text-muted-foreground/70 mt-2 block">
                          {step.path}
                        </code>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/40">
          Esta página é apenas para navegação interna do funil.
        </div>
      </main>
    </div>
  );
};

export default Funil;
