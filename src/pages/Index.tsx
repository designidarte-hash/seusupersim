import LoanForm from "@/components/LoanForm";

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
