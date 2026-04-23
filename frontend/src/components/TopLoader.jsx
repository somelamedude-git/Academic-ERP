import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function TopLoader() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;

    // Start
    setVisible(true);
    setProgress(0);

    // Quickly jump to ~30%, then trickle slowly
    const start = () => {
      setProgress(30);
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 85) { clearInterval(timerRef.current); return p; }
          return p + Math.random() * 8;
        });
      }, 200);
    };

    const id = requestAnimationFrame(start);

    // Complete after a short delay
    const done = setTimeout(() => {
      clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => setVisible(false), 300);
    }, 600);

    return () => {
      cancelAnimationFrame(id);
      clearInterval(timerRef.current);
      clearTimeout(done);
    };
  }, [location.pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 99999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, var(--accent-indigo), var(--accent-cyan))",
          boxShadow: "0 0 8px var(--accent-indigo), 0 0 20px rgba(99,102,241,0.4)",
          transition: progress === 100
            ? "width 0.15s ease-out, opacity 0.3s ease 0.15s"
            : "width 0.2s ease-out",
          opacity: progress === 100 ? 0 : 1,
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
