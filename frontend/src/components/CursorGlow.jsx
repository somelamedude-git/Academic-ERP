import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef(null);
  const pos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const target = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const scale = useRef(1);
  const targetScale = useRef(1);
  const raf = useRef(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onDown = () => {
      targetScale.current = 2.2;
    };

    const onUp = () => {
      targetScale.current = 1;
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      // Smooth follow with spring-like easing
      pos.current.x = lerp(pos.current.x, target.current.x, 0.08);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.08);
      scale.current = lerp(scale.current, targetScale.current, 0.12);

      el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) scale(${scale.current})`;

      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "320px",
        height: "320px",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
        // Offset so the glow is centred on the cursor
        marginLeft: "-160px",
        marginTop: "-160px",
        background:
          "radial-gradient(circle, rgba(99,102,241,0.10) 0%, rgba(34,211,238,0.05) 40%, transparent 70%)",
        filter: "blur(2px)",
        mixBlendMode: "screen",
      }}
    />
  );
}
