import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageTransition from "@/components/PageTransition";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index.tsx";

// Lazy-load todas as outras rotas para reduzir o JS inicial da home
const Resultado = lazy(() => import("./pages/Resultado.tsx"));
const AnaliseCredito = lazy(() => import("./pages/AnaliseCredito.tsx"));
const Aprovado = lazy(() => import("./pages/Aprovado.tsx"));
const Cadastro = lazy(() => import("./pages/Cadastro.tsx"));
const Simulacao = lazy(() => import("./pages/Simulacao.tsx"));
const Chat = lazy(() => import("./pages/Chat.tsx"));
const RedirecionandoChat = lazy(() => import("./pages/RedirecionandoChat.tsx"));
const Sucesso = lazy(() => import("./pages/Sucesso.tsx"));
const TesteCamera = lazy(() => import("./pages/TesteCamera.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <PageTransition />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/resultado" element={<Resultado />} />
            <Route path="/analise" element={<AnaliseCredito />} />
            <Route path="/aprovado" element={<Aprovado />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/simulacao" element={<Simulacao />} />
            <Route path="/redirecionando" element={<RedirecionandoChat />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/sucesso" element={<Sucesso />} />
            <Route path="/teste-camera" element={<TesteCamera />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
