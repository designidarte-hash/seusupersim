import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TransitionState {
  active: boolean;
  to: string;
  state?: unknown;
}

let triggerTransition: ((to: string, state?: unknown) => void) | null = null;

export const useTransitionNavigate = () => {
  return useCallback((to: string, state?: unknown) => {
    if (triggerTransition) {
      triggerTransition(to, state);
    }
  }, []);
};

const TRANSITION_DURATION = 5000;

const PageTransition = () => {
  const navigate = useNavigate();
  const [transition, setTransition] = useState<TransitionState>({
    active: false,
    to: "",
  });
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    triggerTransition = (to: string, state?: unknown) => {
      setTransition({ active: true, to, state });
      setProgress(0);
      setDone(false);
    };
    return () => {
      triggerTransition = null;
    };
  }, []);

  useEffect(() => {
    if (!transition.active || done) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / TRANSITION_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= TRANSITION_DURATION) {
        clearInterval(interval);
        setDone(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [transition.active, done]);

  const handleGoToResult = () => {
    navigate(transition.to, { state: transition.state as Record<string, unknown> });
    setTimeout(() => {
      setTransition({ active: false, to: "" });
      setProgress(0);
      setDone(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {transition.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-primary"
        >
          <div className="absolute inset-0 bg-sunburst" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 bg-white rounded-3xl shadow-xl p-8 md:p-12 w-full max-w-lg mx-4 text-center space-y-6"
          >
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
              Sua análise está sendo preparada...
            </h1>
            <div className="flex justify-center">
              <div className="w-16 h-1 rounded-full bg-primary" />
            </div>
            <p className="text-muted-foreground text-base">
              Aguarde um momento enquanto processamos seus dados. Isso não levará muito tempo.
            </p>
            <div className="space-y-2">
              <div className="w-full h-10 rounded-full overflow-hidden relative shadow-md bg-primary/20">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(30,95%,45%)]"
                  style={{ width: `${progress}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow">
                  {Math.round(progress)}%
                </span>
              </div>
              {done && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-600 font-semibold text-base"
                >
                  Análise Pronta!
                </motion.p>
              )}
            </div>
            {done && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleGoToResult}
                className="btn-3d w-full uppercase tracking-wide"
              >
                VER RESULTADO DA ANÁLISE
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageTransition;
