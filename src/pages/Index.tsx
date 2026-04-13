import LoanForm from "@/components/LoanForm";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary py-4">
        <h1 className="text-center text-2xl font-bold text-primary-foreground">
          Consulta CPF
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <LoanForm />
      </main>
    </div>
  );
};

export default Index;
