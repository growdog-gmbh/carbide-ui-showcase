import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { matrix } from "../../../../.storybook/matrix.js";
import {
  ProgressIndicator,
  type ProgressIndicatorProps,
  type ProgressIndicatorStep,
} from "./ProgressIndicator.js";

const STEPS: ProgressIndicatorStep[] = [
  { label: "Select recipe", description: "Recipe 4711", state: "complete" },
  { label: "Check tanks", description: "Tank 1 to 4", state: "complete" },
  { label: "Write to PLC", description: "Hall 2, line A", state: "current" },
  { label: "Start batch", state: "incomplete" },
];

const WITH_ERROR: ProgressIndicatorStep[] = [
  { label: "Select recipe", state: "complete" },
  { label: "Check tanks", description: "Tank 3 empty", state: "invalid" },
  { label: "Write to PLC", state: "current" },
  { label: "Start batch", state: "incomplete" },
];

const SHORT: ProgressIndicatorStep[] = [
  { label: "Recipe", state: "complete" },
  { label: "Tanks", state: "current" },
  { label: "Batch", state: "incomplete" },
];

function Guided({ steps, current: initial, ...props }: ProgressIndicatorProps) {
  const [current, setCurrent] = useState(initial);
  const tracked = steps.map((step, index) => ({
    ...step,
    state:
      step.state === "invalid"
        ? ("invalid" as const)
        : index < current
          ? ("complete" as const)
          : index === current
            ? ("current" as const)
            : ("incomplete" as const),
  }));
  return (
    <ProgressIndicator {...props} current={current} onStepClick={setCurrent} steps={tracked} />
  );
}

const meta: Meta<typeof ProgressIndicator> = {
  title: "Core/ProgressIndicator",
  component: ProgressIndicator,
  args: { steps: STEPS, current: 2 },
  argTypes: { onStepClick: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ width: "48rem" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ProgressIndicator>;

export const Default: Story = {};

export const Horizontal: Story = { args: { orientation: "horizontal" } };

export const Vertical: Story = {
  args: { orientation: "vertical" },
  decorators: [
    (Story) => (
      <div style={{ width: "18rem" }}>
        <Story />
      </div>
    ),
  ],
};

export const Invalid: Story = { args: { steps: WITH_ERROR } };

export const NotClickable: Story = {};

export const Clickable: Story = { render: (args) => <Guided {...args} /> };

export const LongLabels: Story = {
  args: {
    steps: [
      {
        label: "Select the recipe for the current batch",
        description: "Recipe 4711 of hall 2",
        state: "complete",
      },
      {
        label: "Check every tank on the line before starting",
        description: "Tank 1 to 4 on level 3",
        state: "current",
      },
      { label: "Write the recipe to the controller", state: "incomplete" },
    ],
    current: 1,
  },
};

export const Matrix: Story = {
  decorators: [matrix],
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--carbide-sp-6)", width: "16rem" }}>
      <ProgressIndicator current={1} steps={SHORT} />
      <ProgressIndicator current={2} orientation="vertical" steps={WITH_ERROR} />
    </div>
  ),
};
