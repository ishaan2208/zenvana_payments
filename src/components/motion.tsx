"use client";

/**
 * Shared motion primitives for the Zenvana portal.
 * Requires: framer-motion  ->  npm i framer-motion
 *
 * Everything respects prefers-reduced-motion automatically via framer-motion.
 */

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  type Variants,
} from "framer-motion";
import { useEffect, useState } from "react";

/* ---------- easing / springs ---------- */
export const easeOutExpo = [0.22, 1, 0.36, 1] as const;
export const springSoft = { type: "spring", stiffness: 380, damping: 32 } as const;

/* ---------- staggered list container ---------- */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
};

/* ---------- fade/slide in a single element on mount ---------- */
export function FadeIn({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutExpo, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- staggered group + child ---------- */
export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUpItem}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={springSoft}
    >
      {children}
    </motion.div>
  );
}

/* ---------- per-route page transition (use inside layout) ---------- */
export function PageTransition({
  routeKey,
  children,
}: {
  routeKey: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 18, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        transition={{ duration: 0.36, ease: easeOutExpo }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------- spring-animated currency counter ---------- */
export function AnimatedAmount({
  value,
  className,
  prefix = "₹",
}: {
  value: number;
  className?: string;
  prefix?: string;
}) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) =>
      setDisplay(Math.round(v).toLocaleString("en-IN"))
    );
    return () => unsub();
  }, [spring]);

  return (
    <span className={className}>
      <span className="opacity-70">{prefix}</span>
      <span className="tnum">{display}</span>
    </span>
  );
}

export { motion, AnimatePresence };
