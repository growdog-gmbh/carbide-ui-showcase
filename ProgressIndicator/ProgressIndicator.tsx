import { Steps as Ark } from "@ark-ui/react/steps";
import type { HTMLAttributes } from "react";
import styles from "./ProgressIndicator.module.css";

export type ProgressIndicatorStepState = "complete" | "current" | "incomplete" | "invalid";

export type ProgressIndicatorOrientation = "horizontal" | "vertical";

export interface ProgressIndicatorStep {
  label: string;

  description?: string | undefined;
  state: ProgressIndicatorStepState;
}

export interface ProgressIndicatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  steps: ProgressIndicatorStep[];

  current: number;

  orientation?: ProgressIndicatorOrientation | undefined;

  onStepClick?: ((index: number) => void) | undefined;
}

export function ProgressIndicator({
  steps,
  current,
  orientation = "horizontal",
  onStepClick,
  id,
  ...rest
}: ProgressIndicatorProps) {
  return (
    <Ark.Root
      {...rest}
      className={styles.root}
      count={steps.length}
      ids={id === undefined ? undefined : { root: id }}
      onStepChange={(details) => onStepClick?.(details.step)}
      orientation={orientation}
      step={current}
    >
      <Ark.List className={styles.list}>
        {steps.map((step, index) => (
          <Ark.Item className={styles.item} data-state={step.state} index={index} key={step.label}>
            <Ark.Trigger className={styles.trigger} disabled={onStepClick === undefined}>
              <Ark.Indicator className={styles.indicator}>
                <StepGlyph state={step.state} />
              </Ark.Indicator>
              <span className={styles.text}>
                <span className={styles.label}>{step.label}</span>
                {step.description === undefined ? null : (
                  <span className={styles.description}>{step.description}</span>
                )}
              </span>
            </Ark.Trigger>
            {index === steps.length - 1 ? null : <Ark.Separator className={styles.separator} />}
          </Ark.Item>
        ))}
      </Ark.List>
    </Ark.Root>
  );
}

function StepGlyph({ state }: { state: ProgressIndicatorStepState }) {
  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
    >
      <circle cx="8" cy="8" r="7" />
      {state === "complete" ? <path d="M4.5 8.5l2.5 2.5 4.5-5" strokeLinecap="round" /> : null}
      {state === "current" ? (
        <circle cx="8" cy="8" fill="currentcolor" r="3.5" stroke="none" />
      ) : null}
      {state === "invalid" ? (
        <path d="M8 4.5v4.5m0 2.5v.5" strokeLinecap="round" strokeWidth="2" />
      ) : null}
    </svg>
  );
}
