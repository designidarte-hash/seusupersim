import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

interface TransitionState {
  active: boolean;
  to: string;
  state?: Record<string, unknown>;
}

let triggerTransition: ((to: string, state?: Record<string, unknown>) => void) | null = null;

export const useTransitionNavigate = () => {
  return useCallback((to: string, state?: Record<string, unknown>) => {
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
    triggerTransition = (to: string, state?: Record<string, unknown>) => {
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
        navigate(transition.to, { state: transition.state });
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          <div className="flex flex-col items-center gap-8">
            <motion.img
              src={logo}
              alt="Logo"
              className="h-12 md:h-16"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            />

            {/* Dots animation */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
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
