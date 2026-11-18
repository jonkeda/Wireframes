/**
 * Helpers shared by the layout engine and the SVG renderer.
 * Internal: not re-exported from the renderer index.
 */
import { ControlNode } from '../parser/ast.js';

/**
 * Height reserved above an input for its `label="..."` line
 */
export const INPUT_LABEL_HEIGHT = 20;

/**
 * The control kinds that draw their `label` above the input box
 */
const LABELLED_INPUTS = new Set(['TextInput', 'NumberInput', 'DateInput', 'PasswordInput', 'TextArea', 'Dropdown']);

/**
 * Whether a control draws a label line above its box
 */
export function hasInputLabel(node: ControlNode): boolean {
  return LABELLED_INPUTS.has(node.controlType) && !!node.label;
}

/**
 * The text a control shows: its quoted string, or the placeholder for older trees
 */
export function controlText(node: ControlNode): string | undefined {
  return node.text ?? node.placeholder;
}

/**
 * Escape a string for XML text content and for double- or single-quoted attribute values
 */
export function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Round every number in the attribute values of an SVG string to at most 2 decimals.
 * Text content and the aria-*, role, class, id and xml:lang attributes are left as written.
 */
export function roundSvgNumbers(svg: string): string {
  return svg.replace(/<[^>]+>/g, (tag) =>
    tag.replace(/(\s)([\w:-]+)="([^"]*)"/g, (whole, space: string, name: string, value: string) => {
      if (/^(aria-|role$|class$|id$|xml:lang$)/.test(name)) return whole;
      const rounded = value.replace(/-?\d*\.\d{3,}(e[-+]?\d+)?/gi, (num) => {
        const r = Math.round(parseFloat(num) * 100) / 100;
        return String(Object.is(r, -0) ? 0 : r);
      });
      return `${space}${name}="${rounded}"`;
    })
  );
}
