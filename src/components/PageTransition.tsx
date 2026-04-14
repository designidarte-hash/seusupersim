import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo-supersim.png";
import { Loader2 } from "lucide-react";

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

  useEffect(() => {
    triggerTransition = (to: string, state?: unknown) => {
      setTransition({ active: true, to, state });
      setProgress(0);
    };
    return () => {
      triggerTransition = null;
    };
  }, []);

  useEffect(() => {
    if (!transition.active) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / TRANSITION_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= TRANSITION_DURATION) {
        clearInterval(interval);
        navigate(transition.to, { state: transition.state as Record<string, unknown> });
        setTimeout(() => {
          setTransition({ active: false, to: "" });
          setProgress(0);
        }, 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [transition.active, transition.to, transition.state, navigate]);

  return (
    <AnimatePresence>
      {transition.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary"
        >
          <div className="absolute inset-0 bg-sunburst" />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <motion.img
              src={logo}
              alt="Logo"
              className="h-16 md:h-20 drop-shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 text-primary-foreground"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-lg font-semibold">Processando...</span>
            </motion.div>

            <div className="w-64 h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary-foreground"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageTransition;
