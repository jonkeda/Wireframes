/**
 * Theme detector for markdown preview
 * Detects VS Code's light/dark mode from the document body
 */

export function detectTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') {
    return 'light';
  }

  // VS Code adds these classes to the body
  const body = document.body;
  if (
    body.classList.contains('vscode-dark') ||
    body.classList.contains('vscode-high-contrast')
  ) {
    return 'dark';
  }

  return 'light';
}

export function getThemeForMode(
  mode: 'light' | 'dark',
  lightTheme: string,
  darkTheme: string
): string {
  return mode === 'dark' ? darkTheme : lightTheme;
}
