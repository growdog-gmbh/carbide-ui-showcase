// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderRoot } from "../test/render.js";
import { ProgressIndicator, type ProgressIndicatorStep } from "./ProgressIndicator.js";

const STEPS: ProgressIndicatorStep[] = [
  { label: "Select recipe", state: "complete" },
  { label: "Check tanks", description: "Tank 1 to 4", state: "current" },
  { label: "Start batch", state: "incomplete" },
];

describe("ProgressIndicator", () => {
  it("renders a step sequence with role tablist and one tab per step", () => {
    const { tag, attrs, markup } = renderRoot(<ProgressIndicator current={1} steps={STEPS} />);
    expect(tag).toBe("div");
    expect(attrs["data-orientation"]).toBe("horizontal");
    expect(markup).toContain('role="tablist"');
    expect(markup.match(/role="tab"/g)).toHaveLength(3);
  });

  it("writes each step's state as data-state on the step", () => {
    const { markup } = renderRoot(<ProgressIndicator current={1} steps={STEPS} />);
    expect(markup).toMatch(/data-part="item"[^>]*data-state="complete"/);
    expect(markup).toMatch(/data-part="item"[^>]*data-state="current"/);
    expect(markup).toMatch(/data-part="item"[^>]*data-state="incomplete"/);
  });

  it("knows invalid, which Ark cannot derive from the index", () => {
    const { markup } = renderRoot(
      <ProgressIndicator
        current={1}
        steps={[{ label: "Check tanks", state: "invalid" }, ...STEPS.slice(1)]}
      />,
    );
    expect(markup).toMatch(/data-part="item"[^>]*data-state="invalid"/);
  });

  it("marks the current step for assistive tech", () => {
    const { markup } = renderRoot(<ProgressIndicator current={1} steps={STEPS} />);
    expect(markup.match(/aria-current="step"/g)).toHaveLength(1);
    expect(markup).toMatch(/aria-selected="true"/);
  });

  it("locks the triggers without onStepClick and frees them with it", () => {
    const withoutClick = renderRoot(<ProgressIndicator current={1} steps={STEPS} />).markup;
    expect(withoutClick.match(/data-part="trigger"[^>]*disabled/g)).toHaveLength(3);

    const withClick = renderRoot(
      <ProgressIndicator current={1} onStepClick={() => undefined} steps={STEPS} />,
    ).markup;
    expect(withClick).not.toMatch(/data-part="trigger"[^>]*disabled/);
  });

  it("shows the description when a step has one", () => {
    const { markup } = renderRoot(<ProgressIndicator current={1} steps={STEPS} />);
    expect(markup).toContain("Tank 1 to 4");
  });

  it("flips the direction with orientation", () => {
    const { attrs, markup } = renderRoot(
      <ProgressIndicator current={1} orientation="vertical" steps={STEPS} />,
    );
    expect(attrs["data-orientation"]).toBe("vertical");
    expect(markup).toMatch(/data-part="separator"[^>]*data-orientation="vertical"/);
  });

  it("puts a divider between the steps, not after the last one", () => {
    const { markup } = renderRoot(<ProgressIndicator current={1} steps={STEPS} />);
    expect(markup.match(/data-part="separator"/g)).toHaveLength(2);
  });

  it("passes native attributes through", () => {
    expect(renderRoot(<ProgressIndicator current={1} id="s1" steps={STEPS} />).attrs.id).toBe("s1");
  });
});

describe("ProgressIndicator, clicking a step", () => {
  afterEach(cleanup);

  function triggers(container: HTMLElement) {
    return [...container.querySelectorAll('[data-part="trigger"]')];
  }

  it("reports the index of the clicked step", async () => {
    const onStepClick = vi.fn();
    const { container } = render(
      <ProgressIndicator current={1} onStepClick={onStepClick} steps={STEPS} />,
    );
    const buttons = triggers(container);
    expect(buttons).toHaveLength(3);

    fireEvent.click(buttons[2] as Element);
    await waitFor(() => expect(onStepClick).toHaveBeenCalledExactlyOnceWith(2));
  });

  it("also reports a step ahead of the current one", async () => {
    const onStepClick = vi.fn();
    const { container } = render(
      <ProgressIndicator current={1} onStepClick={onStepClick} steps={STEPS} />,
    );
    fireEvent.click(triggers(container)[0] as Element);
    await waitFor(() => expect(onStepClick).toHaveBeenCalledExactlyOnceWith(0));
  });

  it("reports nothing when the step is already the current one", async () => {
    const onStepClick = vi.fn();
    const { container } = render(
      <ProgressIndicator current={1} onStepClick={onStepClick} steps={STEPS} />,
    );

    fireEvent.click(triggers(container)[1] as Element);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it("accepts no click without onStepClick", () => {
    const { container } = render(<ProgressIndicator current={1} steps={STEPS} />);
    const buttons = triggers(container);
    for (const button of buttons) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});
