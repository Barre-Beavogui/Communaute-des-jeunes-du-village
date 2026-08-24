import { useEffect, useState, type CSSProperties } from "react";

export function RotatingWords({
  words,
  interval = 2400,
  minWidth,
  className = "",
}: {
  words: string[];
  interval?: number;
  minWidth?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || words.length < 2) return;

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % words.length),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [interval, words.length]);

  return (
    <span
      className={`vj-rotating-word ${className}`}
      style={{ "--vj-word-width": minWidth } as CSSProperties}
    >
      <span key={`${index}-${words[index]}`} className="vj-word-swap">
        {words[index]}
      </span>
    </span>
  );
}
