import { Drawer, t } from "@carbide/core";
import type { CSSProperties, ReactNode } from "react";
import { useRef, useState } from "react";
import { ShellHeader } from "../primitives/ShellHeader/index.js";
import type { ShellNavGroup } from "../primitives/ShellNav/index.js";
import { ShellNav } from "../primitives/ShellNav/index.js";
import { Board } from "./Board.js";
import styles from "./BoardShell.module.css";

const MENU_CLOSE_DELAY_MS = 50;

export interface BoardShellProps {
  title: ReactNode;

  context?: ReactNode | undefined;

  /** Live status strip between the title and the actions, see ShellHeader. */
  status?: ReactNode | undefined;

  actions?: ReactNode | undefined;

  menuLogo?: ReactNode | undefined;

  menuGroups: readonly ShellNavGroup[];

  menuFooterGroups?: readonly ShellNavGroup[] | undefined;

  menuActive?: string | undefined;

  onMenuNavigate: (id: string) => void;

  menuTitle?: string | undefined;

  /**
   * Full-bleed background behind the board, one image per theme. The board
   * grid and its widgets stay opaque on top; only the gaps and any space
   * outside the board's fixed size show it.
   */
  backgroundImage?: { light: string; dark: string } | undefined;

  children?: ReactNode | undefined;
}

export function BoardShell({
  title,
  context,
  status,
  actions,
  menuLogo,
  menuGroups,
  menuFooterGroups,
  menuActive,
  onMenuNavigate,
  menuTitle,
  backgroundImage,
  children,
}: BoardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function handleMenuNavigate(id: string) {
    onMenuNavigate(id);
    window.setTimeout(() => setMenuOpen(false), MENU_CLOSE_DELAY_MS);
  }

  const backgroundImageStyle = backgroundImage
    ? ({
        "--board-shell-bg-light": `url("${backgroundImage.light}")`,
        "--board-shell-bg-dark": `url("${backgroundImage.dark}")`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={styles.root}
      data-density="dense"
      data-has-background-image={backgroundImage ? "" : undefined}
      ref={rootRef}
      style={backgroundImageStyle}
    >
      <ShellHeader
        actions={actions}
        context={context}
        menuButtonRef={menuButtonRef}
        menuOpen={menuOpen}
        onMenuClick={() => setMenuOpen((open) => !open)}
        status={status}
        title={title}
      />
      <Drawer
        closeOnInteractOutside
        container={rootRef}
        modal={false}
        onOpenChange={setMenuOpen}
        open={menuOpen}
        persistentElements={[() => menuButtonRef.current]}
        side="start"
        size="md"
        title={menuTitle ?? t("boardShell.menu")}
        unpadded
      >
        <ShellNav
          active={menuActive}
          footerGroups={menuFooterGroups}
          groups={menuGroups}
          label={menuTitle ?? t("boardShell.menu")}
          layout="grid"
          logo={menuLogo}
          onNavigate={handleMenuNavigate}
        />
      </Drawer>
      <Board>{children}</Board>
    </div>
  );
}
