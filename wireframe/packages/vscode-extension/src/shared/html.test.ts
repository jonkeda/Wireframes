import { describe, expect, it } from 'vitest';
import { buildPreviewCsp, buildPreviewHtml, createNonce, declaredStyle, escapeHtml } from './html';

describe('escapeHtml', () => {
  it('escapes markup and quote characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;'
    );
  });

  it('leaves plain text alone', () => {
    expect(escapeHtml('Line 3: unexpected token')).toBe('Line 3: unexpected token');
  });
});

describe('createNonce', () => {
  it('returns 32 hex characters', () => {
    expect(createNonce()).toMatch(/^[0-9a-f]{32}$/);
  });

  it('is different on every call', () => {
    const nonces = new Set(Array.from({ length: 50 }, () => createNonce()));
    expect(nonces.size).toBe(50);
  });
});

describe('buildPreviewCsp', () => {
  it('denies by default and allows scripts only with the nonce', () => {
    const csp = buildPreviewCsp('vscode-webview://abc', 'n0nce');
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'nonce-n0nce'");
    expect(csp).toContain('img-src vscode-webview://abc data:');
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  });
});

describe('declaredStyle', () => {
  it('reads the style from the header line', () => {
    expect(declaredStyle('wireframe sketch\n  Label "x"\n/wireframe')).toBe('sketch');
    expect(declaredStyle('  wireframe Blueprint\n')).toBe('blueprint');
  });

  it('is undefined when the header declares none', () => {
    expect(declaredStyle('wireframe\n  Label "sketch"\n/wireframe')).toBeUndefined();
  });
});

describe('buildPreviewHtml', () => {
  const base = {
    svg: '<svg width="10" height="10"></svg>',
    errors: [],
    zoom: 100,
    themeLabel: 'clean',
    width: 800,
    height: 600,
    cspSource: 'vscode-webview://abc',
    nonce: 'abc123',
  };

  it('has a CSP meta tag and puts the nonce on every script', () => {
    const html = buildPreviewHtml(base);
    expect(html).toContain('<meta http-equiv="Content-Security-Policy"');
    expect(html).toContain('script-src &#39;nonce-abc123&#39;');
    const scripts = html.match(/<script\b[^>]*>/g) ?? [];
    expect(scripts.length).toBeGreaterThan(0);
    for (const tag of scripts) {
      expect(tag).toContain('nonce="abc123"');
    }
  });

  it('has no inline event handler attributes', () => {
    const html = buildPreviewHtml(base);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it('escapes error messages and the theme label', () => {
    const html = buildPreviewHtml({
      ...base,
      themeLabel: '<b>x</b>',
      errors: [{ line: 2, message: '<img src=x onerror=alert(1)>' }],
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('Theme: &lt;b&gt;x&lt;/b&gt;');
    expect(html).toContain('1 warning(s)');
  });
});
