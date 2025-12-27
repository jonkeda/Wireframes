/**
 * Renderer Types
 *
 * Type definitions for the layout engine and SVG renderer.
 */

/**
 * Layout direction for containers
 */
export enum LayoutDirection {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
  Grid = 'grid',
  Dock = 'dock',
}

/**
 * Alignment within layouts
 */
export enum LayoutAlignment {
  Start = 'start',
  Center = 'center',
  End = 'end',
  Stretch = 'stretch',
  SpaceBetween = 'space-between',
  SpaceAround = 'space-around',
}

/**
 * Dock position for dock layouts
 */
export type DockPosition = 'top' | 'bottom' | 'left' | 'right' | 'fill';

/**
 * Padding specification
 */
export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Size specification
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Position specification
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Layout configuration for a container
 */
export interface LayoutConfig {
  direction: LayoutDirection;
  alignment: LayoutAlignment;
  gap: number;
  padding: Padding;
  columns?: number; // For grid layout
}

/**
 * Render node - intermediate representation for layout
 */
export interface RenderNode {
  id: string;
  type: 'container' | 'control' | 'section';
  layout?: LayoutConfig;
  size?: Size;
  position?: Position;
  flex?: number;
  dock?: DockPosition;
  children: RenderNode[];
  properties?: Record<string, unknown>;
  controlType?: string;
  text?: string;
}

/**
 * Laid out node - render node after layout calculation
 */
export interface LaidOutNode extends RenderNode {
  position: Position;
  size: Size;
  children: LaidOutNode[];
}

/**
 * Render options
 */
export interface RenderOptions {
  width: number;
  height: number;
  theme: string;
}

/**
 * Render result
 */
export interface RenderResult {
  svg: string;
  errors: RenderError[];
}

/**
 * Render error
 */
export interface RenderError {
  line: number;
  message: string;
}

/**
 * Available bounds for layout
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Control style variant
 */
export type StyleVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Badge variant (for colored badges)
 */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Button style
 */
export type ButtonStyle = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';

/**
 * Input type
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time';

/**
 * Heading level
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Chart type
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';
