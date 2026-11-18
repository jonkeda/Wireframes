import { describe, expect, it } from 'vitest';
import { renderWireframeToHtml } from './render';

const malicious = 'wireframe\n  Vertical "<img src=x onerror=alert(1)>"\n  /Vertical\n/wireframe';

describe('renderWireframeToHtml', () => {
  it('escapes parse error messages', () => {
    for (const inlineStyles of [false, true]) {
      const html = renderWireframeToHtml(malicious, 'clean', { inlineStyles });
      expect(html).toContain('wireframe-error');
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    }
  });

  it('uses the style the wireframe declares over the default theme', () => {
    const html = renderWireframeToHtml('wireframe sketch\n  Label "hi"\n/wireframe', 'blueprint');
    expect(html).toContain('data-theme="sketch"');
    expect(html).toContain('<svg');
  });

  it('uses the default theme when the wireframe declares no style', () => {
    const html = renderWireframeToHtml('wireframe\n  Label "hi"\n/wireframe', 'blueprint');
    expect(html).toContain('data-theme="blueprint"');
  });

  it('rejects sources over the maximum size', () => {
    const html = renderWireframeToHtml('wireframe\n  Label "hi"\n/wireframe', 'clean', { maxSize: 5 });
    expect(html).toContain('exceeds maximum size of 5 characters');
    expect(html).not.toContain('<svg');
  });
});
