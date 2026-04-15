import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index.tsx";
import Resultado from "./pages/Resultado.tsx";
import AnaliseCredito from "./pages/AnaliseCredito.tsx";
import Aprovado from "./pages/Aprovado.tsx";
import Cadastro from "./pages/Cadastro.tsx";
import Simulacao from "./pages/Simulacao.tsx";
import Chat from "./pages/Chat.tsx";
import Sucesso from "./pages/Sucesso.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageTransition />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/resultado" element={<Resultado />} />
          <Route path="/analise" element={<AnaliseCredito />} />
          <Route path="/aprovado" element={<Aprovado />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/simulacao" element={<Simulacao />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/sucesso" element={<Sucesso />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
