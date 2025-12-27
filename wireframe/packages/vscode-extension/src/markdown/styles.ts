/**
 * CSS styles for wireframe diagrams in markdown preview
 */
export const wireframeStyles = `
.wireframe-diagram {
  margin: 16px 0;
  padding: 16px;
  background: var(--vscode-editor-background, #ffffff);
  border: 1px solid var(--vscode-panel-border, #e0e0e0);
  border-radius: 4px;
  overflow-x: auto;
}

.wireframe-diagram svg {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.wireframe-diagram[data-theme="blueprint"] {
  background: #1a365d;
  border-color: #2a4a7f;
}

.wireframe-error {
  margin: 16px 0;
  padding: 12px 16px;
  background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
  border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
  border-radius: 4px;
  color: var(--vscode-errorForeground, #f48771);
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 13px;
  white-space: pre-wrap;
}

.wireframe-error strong {
  display: block;
  margin-bottom: 4px;
}
`;
