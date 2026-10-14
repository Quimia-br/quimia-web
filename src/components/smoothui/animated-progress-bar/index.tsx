import { LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

export interface AnimatedProgressBarProps {
  barClassName?: string;
  className?: string;
  color?: string;
  label?: string;
  labelClassName?: string;
  value: number; // 0-100
  /**
   * To replay the animation, change the React 'key' prop on this component from the parent.
   */
}

const MIN_PROGRESS_VALUE = 0;
const MAX_PROGRESS_VALUE = 100;

const SPRING = {
  damping: 10,
  duration: 0.25,
  mass: 0.75,
  stiffness: 100,
  type: "spring" as const,
};

export default function AnimatedProgressBar({
  value,
  label,
  className = "",
  barClassName = "",
  labelClassName = "",
}: AnimatedProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
    <div className={`w-full ${className}`}>
      {label ? (
        <div className={`mb-1 font-medium text-sm ${labelClassName}`}>
          {label}
        </div>
      ) : null}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <m.div
          animate={{
            x: `${Math.max(MIN_PROGRESS_VALUE, Math.min(MAX_PROGRESS_VALUE, value)) - MAX_PROGRESS_VALUE}%`,
          }}
          className={`h-full w-full rounded-full bg-brand-accent ${barClassName}`}
          initial={{ x: "-100%" }}
          transition={shouldReduceMotion ? { duration: 0 } : SPRING}
        />
      </div>
    </div>
    </LazyMotion>
  );
}
