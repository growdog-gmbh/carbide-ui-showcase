import { seriesColor } from "@carbide/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ShellNavGroup } from "../primitives/ShellNav/index.js";
import { BoardShell } from "./BoardShell.js";
import { BoardWidget } from "./BoardWidget.js";
import type { BoardWidgetPosition } from "./validateBoard.js";

const FLOW: BoardWidgetPosition = { id: "flow", x: 1, y: 1, w: 6, h: 5, state: "success" };
const PRESSURE: BoardWidgetPosition = { id: "pressure", x: 7, y: 1, w: 6, h: 5, state: "warn" };
const TEMPERATURE: BoardWidgetPosition = {
  id: "temperature",
  x: 13,
  y: 1,
  w: 6,
  h: 5,
  state: "success",
};
const PUMP: BoardWidgetPosition = { id: "pump", x: 19, y: 1, w: 6, h: 5, state: "error" };
const ALARMS: BoardWidgetPosition = { id: "alarms", x: 1, y: 6, w: 10, h: 15 };
const TREND: BoardWidgetPosition = { id: "trend", x: 11, y: 6, w: 14, h: 15 };

export const BOARD_STORY_WIDGETS: readonly BoardWidgetPosition[] = [
  FLOW,
  PRESSURE,
  TEMPERATURE,
  PUMP,
  ALARMS,
  TREND,
];

function Measurement({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--carbide-sp-2)" }}>
      <span style={{ color: "var(--carbide-text-2)", fontSize: "var(--carbide-fs-small)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--carbide-font-mono)",
          fontSize: "var(--carbide-fs-h1)",
          fontWeight: 300,
        }}
      >
        {value}
        <span
          style={{ fontSize: "var(--carbide-fs-small)", marginInlineStart: "var(--carbide-sp-2)" }}
        >
          {unit}
        </span>
      </span>
    </div>
  );
}

function EventList() {
  const entries = [
    "08:14 Pump 1 switched to manual",
    "07:52 Pressure line 2 near limit",
    "06:30 Backup completed",
    "05:11 Sensor cluster north reconnected",
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--carbide-sp-3)" }}>
      <strong>Recent events</strong>
      <ul style={{ margin: 0, paddingInlineStart: "var(--carbide-sp-5)" }}>
        {entries.map((entry) => (
          <li key={entry} style={{ marginBlockEnd: "var(--carbide-sp-2)" }}>
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendPlaceholder() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        blockSize: "100%",
        color: "var(--carbide-text-placeholder)",
        border: "1px dashed var(--carbide-border-subtle)",
      }}
    >
      Trend chart (Ticket #35)
    </div>
  );
}

function OverviewIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <rect height="8" rx="1" stroke="currentcolor" width="8" x="3" y="3" />
      <rect height="8" rx="1" stroke="currentcolor" width="8" x="13" y="3" />
      <rect height="8" rx="1" stroke="currentcolor" width="8" x="3" y="13" />
      <rect height="8" rx="1" stroke="currentcolor" width="8" x="13" y="13" />
    </svg>
  );
}

function AlarmsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M12 3a6 6 0 0 0-6 6v3.5L4 16h16l-2-3.5V9a6 6 0 0 0-6-6Z" stroke="currentcolor" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentcolor" />
    </svg>
  );
}

function TrendsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M4 17 10 11l4 4 6-8" stroke="currentcolor" />
      <path d="M15 7h5v5" stroke="currentcolor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="12" cy="12" r="3.5" stroke="currentcolor" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
        stroke="currentcolor"
      />
    </svg>
  );
}

const MENU_GROUPS: ShellNavGroup[] = [
  {
    label: "Monitoring",
    accent: seriesColor(1),
    items: [
      {
        id: "overview",
        label: "Overview",
        description: "Plant-wide status",
        icon: <OverviewIcon />,
      },
      {
        id: "alarms",
        label: "Alarms",
        description: "Active and acknowledged",
        icon: <AlarmsIcon />,
      },
      {
        id: "trends",
        label: "Trends",
        description: "Historical measurements",
        icon: <TrendsIcon />,
      },
    ],
  },
  {
    label: "Administration",
    accent: seriesColor(4),
    items: [
      {
        id: "settings",
        label: "Settings",
        description: "Board and alert setup",
        icon: <SettingsIcon />,
      },
    ],
  },
];

function MenuLogo() {
  return (
    <span style={{ fontFamily: "var(--carbide-font-display)", fontWeight: 600 }}>Plant 3</span>
  );
}

function ControlledBoardShell(props: Parameters<typeof BoardShell>[0]) {
  const [active, setActive] = useState("overview");
  return <BoardShell {...props} menuActive={active} onMenuNavigate={setActive} />;
}

const meta: Meta<typeof BoardShell> = {
  title: "Shells/BoardShell",
  component: BoardShell,
  args: {
    title: "Plant 3",
    menuGroups: MENU_GROUPS,
    menuLogo: <MenuLogo />,
    onMenuNavigate: () => {},
  },
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof BoardShell>;

export const Default: Story = {
  render: (args) => (
    <ControlledBoardShell {...args}>
      <BoardWidget {...FLOW}>
        <Measurement label="Flow" unit="m³/h" value="42.3" />
      </BoardWidget>
      <BoardWidget {...PRESSURE}>
        <Measurement label="Pressure" unit="bar" value="6.8" />
      </BoardWidget>
      <BoardWidget {...TEMPERATURE}>
        <Measurement label="Temperature" unit="°C" value="18.4" />
      </BoardWidget>
      <BoardWidget {...PUMP}>
        <Measurement label="Pump 1" unit="" value="Fault" />
      </BoardWidget>
      <BoardWidget {...ALARMS}>
        <EventList />
      </BoardWidget>
      <BoardWidget {...TREND}>
        <TrendPlaceholder />
      </BoardWidget>
    </ControlledBoardShell>
  ),
};

export const WithContextAndActions: Story = {
  args: { context: "Line 2 · last 24 hours" },
  render: (args) => (
    <ControlledBoardShell {...args}>
      <BoardWidget {...FLOW}>
        <Measurement label="Flow" unit="m³/h" value="42.3" />
      </BoardWidget>
    </ControlledBoardShell>
  ),
};

function StatusStrip() {
  const entries: [string, string][] = [
    ["Tasks", "2 overdue · 5 today"],
    ["Plant health", "1 284 · 7 flagged"],
    ["Last alarm", "Pressure line 2 · 12 min"],
  ];
  return (
    <div style={{ display: "flex", gap: "var(--carbide-sp-6)" }}>
      {entries.map(([label, value]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              color: "var(--carbide-text-2)",
              fontSize: "var(--carbide-fs-label)",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export const WithStatus: Story = {
  args: { status: <StatusStrip /> },
  render: (args) => (
    <ControlledBoardShell {...args}>
      <BoardWidget {...FLOW}>
        <Measurement label="Flow" unit="m³/h" value="42.3" />
      </BoardWidget>
      <BoardWidget {...ALARMS}>
        <EventList />
      </BoardWidget>
    </ControlledBoardShell>
  ),
};

export const EmptyBoard: Story = {
  render: (args) => <ControlledBoardShell {...args} />,
};

// Small inline placeholders -- a real deployment passes its own artwork.
const BACKGROUND_IMAGE = {
  light:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='320' height='200' fill='%23eef3ee'/%3E%3Cpath d='M0 160 Q80 100 160 150 T320 120 V200 H0Z' fill='%23c9dfc9'/%3E%3C/svg%3E",
  dark: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='320' height='200' fill='%23141a14'/%3E%3Cpath d='M0 160 Q80 100 160 150 T320 120 V200 H0Z' fill='%23233523'/%3E%3C/svg%3E",
};

export const WithBackgroundImage: Story = {
  args: { backgroundImage: BACKGROUND_IMAGE },
  render: (args) => (
    <ControlledBoardShell {...args}>
      <BoardWidget {...FLOW}>
        <Measurement label="Flow" unit="m³/h" value="42.3" />
      </BoardWidget>
      <BoardWidget {...TREND}>
        <TrendPlaceholder />
      </BoardWidget>
    </ControlledBoardShell>
  ),
};
