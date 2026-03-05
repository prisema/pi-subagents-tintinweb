/**
 * agent-widget.ts — Persistent widget showing running/completed agents above the editor.
 *
 * Displays a tree of agents with animated spinners, live stats, and activity descriptions.
 * Uses the callback form of setWidget for themed rendering.
 */

import type { AgentManager } from "../agent-manager.js";
import type { SubagentType } from "../types.js";
import { DISPLAY_NAMES } from "../types.js";
import { getCustomAgentConfig } from "../agent-types.js";

// ---- Constants ----

/** Braille spinner frames for animated running indicator. */
export const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** Tool name → human-readable action for activity descriptions. */
const TOOL_DISPLAY: Record<string, string> = {
  read: "reading",
  bash: "running command",
  edit: "editing",
  write: "writing",
  grep: "searching",
  find: "finding files",
  ls: "listing",
};

// ---- Types ----

export type Theme = {
  fg(color: string, text: string): string;
  bold(text: string): string;
};

export type UICtx = {
  setStatus(key: string, text: string | undefined): void;
  setWidget(
    key: string,
    content: undefined | ((tui: any, theme: Theme) => { render(): string[]; invalidate(): void }),
    options?: { placement?: "aboveEditor" | "belowEditor" },
  ): void;
};

/** Per-agent live activity state. */
export interface AgentActivity {
  activeTools: Map<string, string>;
  toolUses: number;
  tokens: string;
  responseText: string;
  session?: { getSessionStats(): { tokens: { total: number } } };
}

/** Metadata attached to Agent tool results for custom rendering. */
export interface AgentDetails {
  displayName: string;
  description: string;
  subagentType: string;
  toolUses: number;
  tokens: string;
  durationMs: number;
  status: "running" | "completed" | "steered" | "aborted" | "stopped" | "error" | "background";
  /** Human-readable description of what the agent is currently doing. */
  activity?: string;
  /** Current spinner frame index (for animated running indicator). */
  spinnerFrame?: number;
  /** Short model name if different from parent (e.g. "haiku", "sonnet"). */
  modelName?: string;
  /** Notable config tags (e.g. ["thinking: high", "isolated"]). */
  tags?: string[];
  agentId?: string;
  error?: string;
}

// ---- Formatting helpers ----

/** Format a token count as "33.8k tokens" or "1.2M tokens". */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M tokens`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k tokens`;
  return `${count} tokens`;
}

/** Format milliseconds as human-readable duration. */
export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Format duration from start/completed timestamps. */
export function formatDuration(startedAt: number, completedAt?: number): string {
  if (completedAt) return formatMs(completedAt - startedAt);
  return `${formatMs(Date.now() - startedAt)} (running)`;
}

/** Get display name for any agent type (built-in or custom). */
export function getDisplayName(type: SubagentType): string {
  if (type in DISPLAY_NAMES) return DISPLAY_NAMES[type as keyof typeof DISPLAY_NAMES];
  const custom = getCustomAgentConfig(type);
  return custom?.name ?? type;
}

/** Truncate text to a single line, max `len` chars. */
function truncateLine(text: string, len = 60): string {
  const line = text.split("\n").find(l => l.trim())?.trim() ?? "";
  if (line.length <= len) return line;
  return line.slice(0, len) + "…";
}

/** Build a human-readable activity string from currently-running tools or response text. */
export function describeActivity(activeTools: Map<string, string>, responseText?: string): string {
  if (activeTools.size > 0) {
    const groups = new Map<string, number>();
    for (const toolName of activeTools.values()) {
      const action = TOOL_DISPLAY[toolName] ?? toolName;
      groups.set(action, (groups.get(action) ?? 0) + 1);
    }

    const parts: string[] = [];
    for (const [action, count] of groups) {
      if (count > 1) {
        parts.push(`${action} ${count} ${action === "searching" ? "patterns" : "files"}`);
      } else {
        parts.push(action);
      }
    }
    return parts.join(", ") + "…";
  }

  // No tools active — show truncated response text if available
  if (responseText && responseText.trim().length > 0) {
    return truncateLine(responseText);
  }

  return "thinking…";
}

// ---- Widget manager ----

export class AgentWidget {
  private uiCtx: UICtx | undefined;
  private widgetFrame = 0;
  private widgetInterval: ReturnType<typeof setInterval> | undefined;
  private widgetLingering = false;

  constructor(
    private manager: AgentManager,
    private agentActivity: Map<string, AgentActivity>,
  ) {}

  /** Set the UI context (grabbed from first tool execution). */
  setUICtx(ctx: UICtx) {
    this.uiCtx = ctx;
  }

  /** Clear lingering widget — call when a new turn starts. */
  clearLingering() {
    if (this.widgetLingering && this.uiCtx) {
      this.widgetLingering = false;
      this.uiCtx.setWidget("agents", undefined);
      if (this.widgetInterval) {
        clearInterval(this.widgetInterval);
        this.widgetInterval = undefined;
      }
    }
  }

  /** Ensure the widget update timer is running. */
  ensureTimer() {
    if (!this.widgetInterval) {
      this.widgetInterval = setInterval(() => this.update(), 80);
    }
  }

  /** Force an immediate widget update. */
  update() {
    if (!this.uiCtx) return;
    const allAgents = this.manager.listAgents();
    const running = allAgents.filter(a => a.status === "running");

    if (running.length === 0) {
      // Linger: show completed agents until next turn starts
      if (!this.widgetLingering) {
        this.widgetLingering = true;
      }

      // Show recently completed agents while lingering
      const recent = allAgents.filter(a => a.status !== "running" && a.completedAt);
      if (recent.length === 0) {
        this.uiCtx.setWidget("agents", undefined);
        this.uiCtx.setStatus("subagents", undefined);
        if (this.widgetInterval) { clearInterval(this.widgetInterval); this.widgetInterval = undefined; }
        this.widgetLingering = false;
        return;
      }

      this.uiCtx.setStatus("subagents", undefined);
      this.uiCtx.setWidget("agents", (_tui, theme) => {
        const lines: string[] = [theme.fg("dim", "○") + " " + theme.fg("dim", "Agents")];
        for (let i = 0; i < recent.length; i++) {
          const a = recent[i];
          const connector = i === recent.length - 1 ? "└─" : "├─";
          const name = getDisplayName(a.type);
          const duration = formatMs((a.completedAt ?? Date.now()) - a.startedAt);
          const icon = a.status === "completed" ? theme.fg("success", "✓")
            : a.status === "steered" ? theme.fg("warning", "✓")
            : a.status === "stopped" ? theme.fg("dim", "■")
            : theme.fg("error", "✗");
          const parts: string[] = [];
          if (a.toolUses > 0) parts.push(`${a.toolUses} tool use${a.toolUses === 1 ? "" : "s"}`);
          parts.push(duration);
          lines.push(theme.fg("dim", connector) + ` ${icon} ${theme.bold(name)}  ${theme.fg("muted", a.description)} ${theme.fg("dim", "·")} ${theme.fg("dim", parts.join(" · "))}`);
        }
        return { render: () => lines, invalidate: () => {} };
      }, { placement: "aboveEditor" });
      return;
    }

    // Agents are running — not lingering
    this.widgetLingering = false;

    // Status bar: short summary
    this.uiCtx.setStatus("subagents", `${running.length} agent${running.length === 1 ? "" : "s"} running`);

    // Widget: detailed per-agent lines
    this.widgetFrame++;
    const frame = SPINNER[this.widgetFrame % SPINNER.length];

    this.uiCtx.setWidget("agents", (_tui, theme) => {
      const lines: string[] = [theme.fg("accent", "●") + " " + theme.fg("accent", "Agents")];

      for (let i = 0; i < running.length; i++) {
        const a = running[i];
        const connector = i === running.length - 1 ? "└─" : "├─";
        const name = getDisplayName(a.type);
        const elapsed = formatMs(Date.now() - a.startedAt);

        // Get live activity data
        const bg = this.agentActivity.get(a.id);
        const toolUses = bg?.toolUses ?? a.toolUses;
        let tokenText = "";
        if (bg?.session) {
          try { tokenText = formatTokens(bg.session.getSessionStats().tokens.total); } catch { /* */ }
        }

        const parts: string[] = [];
        if (toolUses > 0) parts.push(`${toolUses} tool use${toolUses === 1 ? "" : "s"}`);
        if (tokenText) parts.push(tokenText);
        parts.push(elapsed);
        const statsText = parts.join(" · ");

        const activity = bg ? describeActivity(bg.activeTools, bg.responseText) : "thinking…";

        lines.push(theme.fg("dim", connector) + ` ${theme.fg("accent", frame)} ${theme.bold(name)}  ${theme.fg("muted", a.description)} ${theme.fg("dim", "·")} ${theme.fg("dim", statsText)}`);
        const indent = i === running.length - 1 ? "   " : "│  ";
        lines.push(theme.fg("dim", indent) + theme.fg("dim", `  ⎿  ${activity}`));
      }

      return { render: () => lines, invalidate: () => {} };
    }, { placement: "aboveEditor" });
  }

  dispose() {
    if (this.widgetInterval) {
      clearInterval(this.widgetInterval);
      this.widgetInterval = undefined;
    }
    if (this.uiCtx) {
      this.uiCtx.setWidget("agents", undefined);
      this.uiCtx.setStatus("subagents", undefined);
    }
  }
}
