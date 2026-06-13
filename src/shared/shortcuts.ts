import type { ToolName } from './messages';

// Pure, DOM/storage-free helpers shared by the popup recorder and the content
// keydown matcher so both agree on a single canonical shortcut format.
//
// Canonical form: `+`-joined tokens, e.g. `Mod+Shift+1`.
//  - `Mod`  = the platform's primary modifier (Cmd on macOS, Ctrl elsewhere).
//  - `Meta` = the platform's secondary command key (Ctrl on macOS, Win/Meta
//             elsewhere) — rarely used, but supported for custom bindings.
//  - The final token is the physical key derived from `event.code`, so it is
//    stable regardless of keyboard layout or whether Shift alters the glyph
//    (e.g. Shift+1 still resolves to `1`, not `!`).

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');

export const MASTER_SHORTCUT = 'Mod+Shift+L';

export const DEFAULT_TOOL_SHORTCUTS: Record<ToolName, string> = {
  laser: 'Mod+Shift+1',
  pen: 'Mod+Shift+2',
  shapes: 'Mod+Shift+3',
  stickers: 'Mod+Shift+4',
};

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);

const NAMED_CODES: Record<string, string> = {
  Space: 'Space',
  Enter: 'Enter',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
};

function keyTokenFromCode(code: string): string | null {
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad[0-9]$/.test(code)) return code.slice(6);
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^F[1-9][0-9]?$/.test(code)) return code; // function keys
  return NAMED_CODES[code] ?? null;
}

/**
 * Convert a keydown event into a canonical shortcut string, or `null` if the
 * combo is not a valid binding (modifier-only press, or no non-Shift modifier).
 * Requiring a non-Shift modifier avoids hijacking ordinary typing.
 */
export function eventToShortcut(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;

  const keyToken = keyTokenFromCode(event.code);
  if (!keyToken) return null;

  const mod = isMac ? event.metaKey : event.ctrlKey;
  const crossMod = isMac ? event.ctrlKey : event.metaKey;
  const alt = event.altKey;
  const shift = event.shiftKey;

  if (!mod && !crossMod && !alt) return null;

  const parts: string[] = [];
  if (mod) parts.push('Mod');
  if (crossMod) parts.push(isMac ? 'Ctrl' : 'Meta');
  if (alt) parts.push('Alt');
  if (shift) parts.push('Shift');
  parts.push(keyToken);

  return parts.join('+');
}

/** True when the event produces exactly the given canonical shortcut. */
export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  return !!shortcut && eventToShortcut(event) === shortcut;
}

/** Human-readable, OS-aware rendering of a canonical shortcut for display. */
export function formatShortcut(shortcut: string): string {
  if (!shortcut) return '—';
  return shortcut
    .split('+')
    .map((part) => {
      if (part === 'Mod') return isMac ? 'Cmd' : 'Ctrl';
      if (part === 'Meta') return isMac ? 'Cmd' : 'Win';
      return part;
    })
    .join(' + ');
}

/**
 * Returns what a candidate shortcut would collide with: another tool's name,
 * `'master'` for the reserved master toggle, or `null` if it is free.
 */
export function findShortcutConflict(
  map: Record<ToolName, string>,
  candidate: string,
  excludingTool: ToolName,
): ToolName | 'master' | null {
  if (candidate === MASTER_SHORTCUT) return 'master';
  for (const [tool, combo] of Object.entries(map) as [ToolName, string][]) {
    if (tool !== excludingTool && combo === candidate) return tool;
  }
  return null;
}
