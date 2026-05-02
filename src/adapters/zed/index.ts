/**
 * adapters/zed — Zed editor platform adapter.
 *
 * Implements HookAdapter for Zed's MCP-only paradigm.
 *
 * Zed hook specifics:
 *   - NO hook support — Zed is an editor, not a CLI with hook pipelines
 *   - Config: ~/.config/zed/settings.json (JSON format)
 *   - MCP: full support via context_servers section in settings.json
 *   - All capabilities are false — MCP is the only integration path
 *   - Session dir: ~/.config/zed/context-mode/sessions/
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

import { BaseAdapter } from "../base.js";

import type {
  HookAdapter,
  HookParadigm,
  PlatformCapabilities,
  DiagnosticResult,
  PreToolUseEvent,
  PostToolUseEvent,
  PreCompactEvent,
  SessionStartEvent,
  PreToolUseResponse,
  PostToolUseResponse,
  PreCompactResponse,
  SessionStartResponse,
  HookRegistration,
} from "../types.js";

// ─────────────────────────────────────────────────────────
// Zed raw input types (defensive — Zed is mcp-only)
// ─────────────────────────────────────────────────────────

interface ZedHookInput {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  is_error?: boolean;
  session_id?: string;
  source?: string;
  cwd?: string;
}

// ─────────────────────────────────────────────────────────
// Adapter implementation
// ─────────────────────────────────────────────────────────

export class ZedAdapter extends BaseAdapter implements HookAdapter {
  constructor() {
    super([".config", "zed"]);
  }

  readonly name = "Zed";
  readonly paradigm: HookParadigm = "mcp-only";

  readonly capabilities: PlatformCapabilities = {
    preToolUse: false,
    postToolUse: false,
    preCompact: false,
    sessionStart: false,
    canModifyArgs: false,
    canModifyOutput: false,
    canInjectSessionContext: false,
  };

  // ── Input parsing ──────────────────────────────────────
  // Zed is mcp-only and capabilities flags are all false, so these
  // parsers should never be exercised in normal operation. They exist
  // as defensive defaults so a misconfigured caller does not leak
  // undefined projectDir downstream — the standard fallback chain
  // (input.cwd > ZED_PROJECT_DIR > process.cwd()) keeps hooks safe
  // under worktrees / non-default cwd, matching cursor / opencode.

  parsePreToolUseInput(raw: unknown): PreToolUseEvent {
    const input = raw as ZedHookInput;
    return {
      toolName: input.tool_name ?? "",
      toolInput: input.tool_input ?? {},
      sessionId: this.extractSessionId(input),
      projectDir: this.getProjectDir(input),
      raw,
    };
  }

  parsePostToolUseInput(raw: unknown): PostToolUseEvent {
    const input = raw as ZedHookInput;
    return {
      toolName: input.tool_name ?? "",
      toolInput: input.tool_input ?? {},
      toolOutput: input.tool_output,
      isError: input.is_error,
      sessionId: this.extractSessionId(input),
      projectDir: this.getProjectDir(input),
      raw,
    };
  }

  parsePreCompactInput(raw: unknown): PreCompactEvent {
    const input = raw as ZedHookInput;
    return {
      sessionId: this.extractSessionId(input),
      projectDir: this.getProjectDir(input),
      raw,
    };
  }

  parseSessionStartInput(raw: unknown): SessionStartEvent {
    const input = raw as ZedHookInput;
    const rawSource = input.source ?? "startup";

    let source: SessionStartEvent["source"];
    switch (rawSource) {
      case "compact":
        source = "compact";
        break;
      case "resume":
        source = "resume";
        break;
      case "clear":
        source = "clear";
        break;
      default:
        source = "startup";
    }

    return {
      sessionId: this.extractSessionId(input),
      source,
      projectDir: this.getProjectDir(input),
      raw,
    };
  }

  // ── Response formatting ────────────────────────────────
  // Zed does not support hooks. Return undefined for all responses.

  formatPreToolUseResponse(_response: PreToolUseResponse): unknown {
    return undefined;
  }

  formatPostToolUseResponse(_response: PostToolUseResponse): unknown {
    return undefined;
  }

  formatPreCompactResponse(_response: PreCompactResponse): unknown {
    return undefined;
  }

  formatSessionStartResponse(_response: SessionStartResponse): unknown {
    return undefined;
  }

  // ── Configuration ──────────────────────────────────────

  getSettingsPath(): string {
    return resolve(homedir(), ".config", "zed", "settings.json");
  }

  getInstructionFiles(): string[] {
    return ["AGENTS.md"];
  }

  generateHookConfig(_pluginRoot: string): HookRegistration {
    // Zed does not support hooks — return empty registration
    return {};
  }

  readSettings(): Record<string, unknown> | null {
    try {
      const raw = readFileSync(this.getSettingsPath(), "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  writeSettings(settings: Record<string, unknown>): void {
    const settingsPath = this.getSettingsPath();
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  }

  // ── Diagnostics (doctor) ─────────────────────────────────

  validateHooks(_pluginRoot: string): DiagnosticResult[] {
    return [
      {
        check: "Hook support",
        status: "warn",
        message:
          "Zed does not support hooks. Only MCP integration is available.",
      },
    ];
  }

  checkPluginRegistration(): DiagnosticResult {
    // Check for context-mode in context_servers section of settings.json
    try {
      const raw = readFileSync(this.getSettingsPath(), "utf-8");
      const settings = JSON.parse(raw);
      const hasContextServers = settings.context_servers !== undefined;
      const hasContextMode = raw.includes("context-mode");

      if (hasContextServers && hasContextMode) {
        return {
          check: "MCP registration",
          status: "pass",
          message: "context-mode found in context_servers config",
        };
      }

      if (hasContextServers) {
        return {
          check: "MCP registration",
          status: "fail",
          message:
            "context_servers section exists but context-mode not found",
          fix: 'Add context-mode to context_servers in ~/.config/zed/settings.json',
        };
      }

      return {
        check: "MCP registration",
        status: "fail",
        message: "No context_servers section in settings.json",
        fix: 'Add context_servers.context-mode to ~/.config/zed/settings.json',
      };
    } catch {
      return {
        check: "MCP registration",
        status: "warn",
        message: "Could not read ~/.config/zed/settings.json",
      };
    }
  }

  getInstalledVersion(): string {
    // Zed has no marketplace or plugin system for context-mode
    return "not installed";
  }

  // ── Upgrade ────────────────────────────────────────────

  configureAllHooks(_pluginRoot: string): string[] {
    // Zed does not support hooks — nothing to configure
    return [];
  }


  setHookPermissions(_pluginRoot: string): string[] {
    // No hook scripts for Zed
    return [];
  }

  updatePluginRegistry(_pluginRoot: string, _version: string): void {
    // Zed has no plugin registry
  }

  getRoutingInstructions(): string {
    const instructionsPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "..",
      "configs",
      "zed",
      "AGENTS.md",
    );
    try {
      return readFileSync(instructionsPath, "utf-8");
    } catch {
      // Fallback inline instructions
      return "# context-mode\n\nUse context-mode MCP tools (execute, execute_file, batch_execute, fetch_and_index, search) instead of bash/cat/curl for data-heavy operations.";
    }
  }

  // ── Internal helpers ───────────────────────────────────

  /**
   * Resolve the project directory for a Zed hook input.
   * Priority: input.cwd > ZED_PROJECT_DIR env > process.cwd().
   * Mirrors the cursor / opencode pattern so any caller that bypasses
   * the capability flags still receives a defined projectDir.
   */
  private getProjectDir(input: ZedHookInput): string {
    return input.cwd ?? process.env.ZED_PROJECT_DIR ?? process.cwd();
  }

  private extractSessionId(input: ZedHookInput): string {
    if (input.session_id) return input.session_id;
    return `pid-${process.ppid}`;
  }
}
