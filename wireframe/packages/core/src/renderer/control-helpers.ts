/**
 * Helpers shared by the layout engine and the SVG renderer.
 * Internal: not re-exported from the renderer index.
 */
import { ComponentNode, ControlNode, SectionNode, TreeItemNode } from '../parser/ast.js';

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

// ============ Components ============

/** The room a title takes at the top of a dialog, an alert or a section */
export const COMPONENT_TITLE_HEIGHT = 28;
/** The height of a row of a table, written out or drawn as a placeholder */
export const TABLE_ROW_HEIGHT = 36;
/** The room a menu's title takes, and the room above and below its items */
export const MENU_TITLE_HEIGHT = 28;
export const MENU_PADDING = 4;
/** The room of the "/" between two items of a breadcrumb */
export const BREADCRUMB_SEPARATOR_WIDTH = 16;
/** The room of the names under the circles of a stepper */
export const STEP_LABEL_HEIGHT = 20;
/** The room above and below the items of a tree */
export const TREE_PADDING = 4;
export const LIST_ITEM_HEIGHT = 24;
/** The header of an accordion section or an expander */
export const FOLD_HEADER_HEIGHT = 40;
export const HOVER_TIP_HEIGHT = 28;
export const HOVER_TIP_GAP = 4;
/** The bar of a Tabs, a line of a tree, and where the circles of a stepper stand */
export const TAB_BAR_HEIGHT = 40;
export const TREE_ITEM_HEIGHT = 32;
export const STEPPER_CIRCLE_Y = 30;

/** The title of a dialog: its quoted string, else its `title="…"` */
export function componentTitle(node: ComponentNode | SectionNode): string | undefined {
  const text = (node as ComponentNode).text;
  if (text) {
    return text;
  }
  const title = node.attributes['title'];
  return typeof title === 'string' && title !== '' ? title : undefined;
}

/** The items of a breadcrumb written as one text, "Home, Products, Details" */
export function breadcrumbTexts(text: string | undefined): string[] {
  return text ? text.split(',').map((s) => s.trim()) : ['Home', 'Section', 'Page'];
}

/** An attribute that is a number, also when it was written as text (`page="2"`); else the default */
export function numberAttribute(value: unknown, fallback: number): number {
  if (typeof value === 'number') {
    return value || fallback;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed || fallback;
  }
  return fallback;
}

/** A text without the `**` that makes a part of it bold */
export function withoutBoldMarks(text: string | undefined): string | undefined {
  return text === undefined ? undefined : text.replace(/\*\*/g, '');
}

/** A count of rows or columns: the attribute when it is a number above zero, else the default */
export function tableSize(value: unknown, fallback: number): number {
  return typeof value === 'number' && value > 0 ? value : fallback;
}

/** The lines a tree of `+ branch` and `- leaf` takes */
export function countTreeItems(items: TreeItemNode[]): number {
  return items.reduce((count, item) => count + 1 + countTreeItems(item.children), 0);
}

/** The width of the tip of a Hover */
export function hoverTipWidth(text: string | undefined): number {
  return (text?.length || 3) * 7 + 16;
}
