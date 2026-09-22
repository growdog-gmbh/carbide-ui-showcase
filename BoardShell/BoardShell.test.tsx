// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ShellNavGroup } from "../primitives/ShellNav/index.js";
import { BoardShell } from "./BoardShell.js";
import { BoardWidget } from "./BoardWidget.js";

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const MENU_GROUPS: ShellNavGroup[] = [
  {
    items: [
      { id: "overview", label: "Overview" },
      { id: "alarms", label: "Alarms" },
    ],
  },
];

afterEach(cleanup);

describe("BoardShell", () => {
  it("sets data-density dense and leaves data-theme to the system", () => {
    const { container } = render(
      <BoardShell menuGroups={MENU_GROUPS} onMenuNavigate={() => {}} title="Plant 3" />,
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute("data-density")).toBe("dense");
    expect(root?.getAttribute("data-theme")).toBeNull();
  });

  it("leaves the background image data attribute and custom properties unset by default", () => {
    const { container } = render(
      <BoardShell menuGroups={MENU_GROUPS} onMenuNavigate={() => {}} title="Plant 3" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-has-background-image")).toBe(false);
    expect(root.style.getPropertyValue("--board-shell-bg-light")).toBe("");
  });

  it("sets the background image data attribute and per-theme custom properties", () => {
    const { container } = render(
      <BoardShell
        backgroundImage={{ light: "/light.webp", dark: "/dark.webp" }}
        menuGroups={MENU_GROUPS}
        onMenuNavigate={() => {}}
        title="Plant 3"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-has-background-image")).toBe("");
    expect(root.style.getPropertyValue("--board-shell-bg-light")).toBe('url("/light.webp")');
    expect(root.style.getPropertyValue("--board-shell-bg-dark")).toBe('url("/dark.webp")');
  });

  it("shows title, context, status and actions in the header bar", () => {
    render(
      <BoardShell
        actions={<button type="button">Export</button>}
        context="Line 2"
        menuGroups={MENU_GROUPS}
        onMenuNavigate={() => {}}
        status={<span>7 flagged</span>}
        title="Plant 3"
      />,
    );
    expect(screen.getByText("Plant 3")).not.toBeNull();
    expect(screen.getByText("Line 2")).not.toBeNull();
    expect(screen.getByText("7 flagged")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Export" })).not.toBeNull();
  });

  it("renders the widgets in the board", () => {
    render(
      <BoardShell menuGroups={MENU_GROUPS} onMenuNavigate={() => {}} title="Plant 3">
        <BoardWidget h={4} w={2} x={1} y={1}>
          Flow
        </BoardWidget>
      </BoardShell>,
    );
    expect(screen.getByText("Flow")).not.toBeNull();
  });

  it("opens and closes the menu with the same menu button", async () => {
    render(<BoardShell menuGroups={MENU_GROUPS} onMenuNavigate={() => {}} title="Plant 3" />);

    const drawer = screen.getByRole("dialog", { hidden: true });
    const button = screen.getByRole("button", { name: "Menu" });
    expect(drawer.getAttribute("data-state")).toBe("closed");
    expect(button.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(button);

    await waitFor(() => expect(drawer.getAttribute("data-state")).toBe("open"));
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Overview" })).not.toBeNull();

    fireEvent.click(button);

    await waitFor(() => expect(drawer.getAttribute("data-state")).toBe("closed"));
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes cleanly when the same menu button is clicked while open, without reopening", async () => {
    render(<BoardShell menuGroups={MENU_GROUPS} onMenuNavigate={() => {}} title="Plant 3" />);

    const drawer = screen.getByRole("dialog", { hidden: true });
    const button = screen.getByRole("button", { name: "Menu" });

    fireEvent.click(button);
    await waitFor(() => expect(drawer.getAttribute("data-state")).toBe("open"));
    await nextFrame();
    await nextTick();

    fireEvent.pointerDown(button);
    fireEvent.pointerUp(button);
    fireEvent.click(button);

    await waitFor(() => expect(drawer.getAttribute("data-state")).toBe("closed"));
    await nextFrame();
    await nextTick();
    expect(drawer.getAttribute("data-state")).toBe("closed");
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("takes Menu from the catalog as the default drawer title, overridable", () => {
    render(<BoardShell menuGroups={MENU_GROUPS} onMenuNavigate={() => {}} title="Plant 3" />);
    expect(screen.getByText("Menu")).not.toBeNull();

    cleanup();
    render(
      <BoardShell
        menuGroups={MENU_GROUPS}
        menuTitle="Navigation"
        onMenuNavigate={() => {}}
        title="Plant 3"
      />,
    );
    expect(screen.getByText("Navigation")).not.toBeNull();
  });

  it("attaches the drawer inside its own root element instead of document.body", () => {
    const { container } = render(
      <BoardShell menuGroups={MENU_GROUPS} onMenuNavigate={() => {}} title="Plant 3" />,
    );
    const root = container.firstElementChild;
    const drawer = screen.getByRole("dialog", { hidden: true });
    expect(root?.contains(drawer)).toBe(true);
  });

  it("navigates immediately and closes the menu shortly after", async () => {
    const onMenuNavigate = vi.fn();
    render(<BoardShell menuGroups={MENU_GROUPS} onMenuNavigate={onMenuNavigate} title="Plant 3" />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const drawer = screen.getByRole("dialog", { hidden: true });
    await waitFor(() => expect(drawer.getAttribute("data-state")).toBe("open"));

    fireEvent.click(screen.getByRole("button", { name: "Alarms" }));
    expect(onMenuNavigate).toHaveBeenCalledExactlyOnceWith("alarms");
    expect(drawer.getAttribute("data-state")).toBe("open");

    await waitFor(() => expect(drawer.getAttribute("data-state")).toBe("closed"));
  });
});
