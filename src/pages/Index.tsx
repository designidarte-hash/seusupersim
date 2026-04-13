import LoanForm from "@/components/LoanForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-center py-5 border-b border-border">
        <span className="text-2xl font-extrabold italic text-primary tracking-tight">
          Super<span className="text-foreground">Sim</span>
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Precisando de dinheiro na conta agora?
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Na SuperSim você tem a maior taxa de aprovação do mercado e um processo rápido. Receba seu dinheiro em 5 minutos. Simule agora.
            </p>
          </div>

          <LoanForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
