"use client";

import { cn } from "cn";
import { AnimatePresence, LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useState,
} from "react";

export interface AnimatedToggleProps {
  /** Controlled checked state */
  checked?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Default checked state for uncontrolled mode */
  defaultChecked?: boolean;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Icons for on/off states (only used with icon variant) */
  icons?: { on: ReactNode; off: ReactNode };
  /** Accessible label for the toggle */
  label?: string;
  /** Callback when checked state changes */
  onChange?: (checked: boolean) => void;
  /** Size of the toggle */
  size?: "sm" | "md" | "lg";
  /** Visual variant of the toggle */
  variant?: "default" | "morph" | "icon";
}

const SPRING = {
  bounce: 0.1,
  duration: 0.25,
  type: "spring" as const,
};

// Modificado: w- e h- ajustados e remoção de p-0.5 para fazer o thumb preencher 100% da altura interna
const SIZES = {
  lg: {
    icon: "size-3.5",
    thumb: "h-7 w-7",
    thumbTranslate: 24, // 51px (track width) - 27px (thumb width) = 24px de deslocamento
    track: "w-[51px] h-7",
  },
  md: {
    icon: "size-3",
    thumb: "h-6 w-6",
    thumbTranslate: 20, // 44px - 24px = 20px de deslocamento
    track: "w-11 h-6",
  },
  sm: {
    icon: "size-2.5",
    thumb: "h-5 w-5",
    thumbTranslate: 16, // 36px - 20px = 16px de deslocamento
    track: "w-9 h-5",
  },
} as const;

const AnimatedToggle = ({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  variant = "default",
  icons,
  size = "md",
  disabled = false,
  label,
  className,
}: AnimatedToggleProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleToggle = useCallback(() => {
    if (disabled) return;

    const newValue = !checked;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  }, [checked, disabled, isControlled, onChange]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  const sizeConfig = SIZES[size];
  const translateX = checked ? sizeConfig.thumbTranslate : 0;
  const borderRadius = variant === "morph" && !shouldReduceMotion && !checked ? 6 : 9999;

  return (
    <LazyMotion features={domAnimation}>
      <button
        aria-checked={checked}
        aria-label={label}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors overflow-hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "bg-surface-disabled", // O fundo do track permanece cinza claro em ambos os estados na sua imagem
          disabled && "cursor-not-allowed opacity-50",
          sizeConfig.track,
          className
        )}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="switch"
        type="button"
      >
      <m.span
        animate={
          shouldReduceMotion
            ? { x: translateX }
            : { borderRadius, x: translateX }
        }
        // Modificado: Adicionado bg- dinâmico com base no estado 'checked' (Cinza escuro vs Verde/Brand)
        // Removido 'shadow-sm' e 'border' para seguir o design flat da imagem
        className={cn(
          "pointer-events-none flex items-center justify-center rounded-full transition-colors duration-200",
          checked ? "bg-brand-primary" : "bg-secondary-on-color",
          sizeConfig.thumb
        )}
        initial={false}
        style={{ borderRadius }}
        transition={shouldReduceMotion ? { duration: 0 } : SPRING}
      >
        {variant === "icon" && icons && (
          <AnimatePresence initial={false} mode="wait">
            <m.span
              key={checked ? "on" : "off"}
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, rotate: 0, scale: 1 }
              }
              className={cn(
                "flex items-center justify-center text-muted-foreground",
                sizeConfig.icon
              )}
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, rotate: -90, scale: 0.5 }
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, rotate: 90, scale: 0.5 }
              }
              transition={shouldReduceMotion ? { duration: 0 } : SPRING}
            >
              {checked ? icons.on : icons.off}
            </m.span>
          </AnimatePresence>
        )}
      </m.span>
      </button>
    </LazyMotion>
  );
};

export default AnimatedToggle;
