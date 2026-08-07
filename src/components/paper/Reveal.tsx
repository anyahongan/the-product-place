import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type Direction = "left" | "right" | "up" | "down" | "none";

type RevealProps = {
  children: ReactNode;
  from?: Direction;
  distance?: number;
  rotate?: number;
  scale?: number;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
};

/** Snaps a graphic element into position as it enters the viewport. Snappy, not floaty. */
export function Reveal({
  children,
  from = "up",
  distance = 56,
  rotate = 0,
  scale = 1,
  delay = 0,
  duration = 0.55,
  className,
  once = true,
  amount = 0.25,
}: RevealProps) {
  const reduced = useReducedMotion();

  const offset =
    from === "left"
      ? { x: -distance, y: 0 }
      : from === "right"
        ? { x: distance, y: 0 }
        : from === "down"
          ? { x: 0, y: -distance }
          : from === "up"
            ? { x: 0, y: distance }
            : { x: 0, y: 0 };

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset, rotate, scale }}
      whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.2, 0.9, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
