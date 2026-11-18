/**
 * HTML helpers shared by the preview panel and the Markdown integrations.
 *
 * This module must not import `vscode` (it is unit-tested and bundled into
 * the browser-side Markdown preview script).
 */

/**
 * Escape a string for use in HTML text or a quoted attribute value.
 */
export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Create a random nonce for a Content Security Policy (32 hex characters).
 */
export function createNonce(byteCount = 16): string {
  const bytes = new Uint8Array(byteCount);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build the Content Security Policy for the preview webview.
 *
 * Nothing is loaded from the network; scripts run only with the nonce.
 * Inline styles are allowed because the rendered SVG uses `<style>` and
 * `style="..."` attributes.
 */
export function buildPreviewCsp(cspSource: string, nonce: string): string {
  return [
    "default-src 'none'",
    `img-src ${cspSource} data:`,
    `style-src ${cspSource} 'unsafe-inline'`,
    `font-src ${cspSource}`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');
}

/**
 * The style a wireframe declares on its header line (`wireframe sketch`),
 * or undefined when it declares none.
 *
 * The parser always fills `document.style` (defaulting to `clean`), so this
 * tells an explicit style apart from the default.
 */
export function declaredStyle(source: string): string | undefined {
  const match = /^[ \t]*wireframe[ \t]+(sketch|blueprint|clean|realistic)\b/im.exec(source);
  return match ? match[1].toLowerCase() : undefined;
}

export interface PreviewError {
  line: number;
  message: string;
}

export interface PreviewHtmlOptions {
  svg: string;
  errors: PreviewError[];
  zoom: number;
  /** Label shown in the toolbar for the active theme */
  themeLabel: string;
  width: number;
  height: number;
  /** `webview.cspSource` */
  cspSource: string;
  /** A fresh nonce for this render */
  nonce: string;
}

/**
 * Build the full HTML document of the preview webview.
 */
export function buildPreviewHtml(options: PreviewHtmlOptions): string {
  const { svg, errors, themeLabel, cspSource, nonce } = options;
  const zoom = Number(options.zoom) || 100;
  const width = Number(options.width) || 800;
  const height = Number(options.height) || 600;

  const errorHtml =
    errors.length > 0
      ? `<div class="errors">
        <div class="error-title">⚠️ ${errors.length} warning(s)</div>
        ${errors
          .map((e) => `<div class="error">Line ${escapeHtml(String(e.line))}: ${escapeHtml(e.message)}</div>`)
          .join('')}
       </div>`
      : '';

  return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="${escapeHtml(buildPreviewCsp(cspSource, nonce))}">
      <style>
        body {
          margin: 0;
          padding: 16px;
          background: var(--vscode-editor-background);
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px;
          background: var(--vscode-sideBar-background);
          border-radius: 4px;
          flex-shrink: 0;
        }
        .toolbar-btn {
          padding: 4px 12px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          min-width: 32px;
        }
        .toolbar-btn:hover {
          background: var(--vscode-button-hoverBackground);
        }
        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .toolbar-separator {
          width: 1px;
          background: var(--vscode-panel-border);
          margin: 0 4px;
        }
        .toolbar-info {
          margin-left: auto;
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
          align-self: center;
        }
        .zoom-display {
          font-size: 12px;
          min-width: 50px;
          text-align: center;
          align-self: center;
          color: var(--vscode-foreground);
        }
        .preview-container {
          flex: 1;
          overflow: auto;
          background: #f0f0f0;
          border-radius: 8px;
          padding: 16px;
        }
        .preview {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 16px;
          display: inline-block;
          transform-origin: top left;
          transform: scale(${zoom / 100});
          min-width: ${width}px;
        }
        .errors {
          background: var(--vscode-inputValidation-warningBackground);
          border: 1px solid var(--vscode-inputValidation-warningBorder);
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
          flex-shrink: 0;
        }
        .error-title {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .error {
          font-size: 12px;
          margin: 4px 0;
          font-family: var(--vscode-editor-font-family);
        }
        svg {
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <button class="toolbar-btn" id="zoomOut" title="Zoom Out (Ctrl+-)">−</button>
        <span class="zoom-display">${zoom}%</span>
        <button class="toolbar-btn" id="zoomIn" title="Zoom In (Ctrl++)">+</button>
        <button class="toolbar-btn" id="zoomReset" title="Reset Zoom">100%</button>
        <button class="toolbar-btn" id="zoomFit" title="Fit to Window">Fit</button>
        <div class="toolbar-separator"></div>
        <span class="toolbar-info">Theme: ${escapeHtml(themeLabel)} | ${width}×${height}</span>
      </div>
      ${errorHtml}
      <div class="preview-container" id="previewContainer">
        <div class="preview" id="preview">
          ${svg}
        </div>
      </div>
      <script nonce="${escapeHtml(nonce)}">
        const vscode = acquireVsCodeApi();
        let zoom = ${zoom};

        function updateZoom(newZoom) {
          zoom = Math.max(25, Math.min(200, newZoom));
          document.querySelector('.zoom-display').textContent = zoom + '%';
          document.getElementById('preview').style.transform = 'scale(' + (zoom / 100) + ')';
        }

        function zoomIn() {
          vscode.postMessage({ command: 'zoomIn' });
        }

        function zoomOut() {
          vscode.postMessage({ command: 'zoomOut' });
        }

        function zoomReset() {
          vscode.postMessage({ command: 'zoomReset' });
        }

        function zoomFit() {
          const container = document.getElementById('previewContainer');
          const preview = document.getElementById('preview');
          const svg = preview.querySelector('svg');
          if (!svg) return;

          const containerWidth = container.clientWidth - 32;
          const containerHeight = container.clientHeight - 32;
          const svgWidth = svg.getAttribute('width') || ${width};
          const svgHeight = svg.getAttribute('height') || ${height};

          const scaleX = containerWidth / svgWidth;
          const scaleY = containerHeight / svgHeight;
          const newZoom = Math.floor(Math.min(scaleX, scaleY) * 100);

          updateZoom(newZoom);
        }

        document.getElementById('zoomIn').addEventListener('click', zoomIn);
        document.getElementById('zoomOut').addEventListener('click', zoomOut);
        document.getElementById('zoomReset').addEventListener('click', zoomReset);
        document.getElementById('zoomFit').addEventListener('click', zoomFit);

        // Mouse wheel zoom
        document.getElementById('previewContainer').addEventListener('wheel', function(e) {
          if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -10 : 10;
            updateZoom(zoom + delta);
          }
        }, { passive: false });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
          if (e.ctrlKey) {
            if (e.key === '=' || e.key === '+') {
              e.preventDefault();
              zoomIn();
            } else if (e.key === '-') {
              e.preventDefault();
              zoomOut();
            } else if (e.key === '0') {
              e.preventDefault();
              zoomReset();
            }
          }
        });
      </script>
    </body>
    </html>
  `;
}
