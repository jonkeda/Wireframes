const esbuild = require('esbuild');

const production = process.argv.includes('--production');

// Main extension bundle (Node.js context)
const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'], // VS Code API is provided at runtime
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: !production,
  minify: production,
};

// Markdown preview bundle (Browser context)
const markdownPreviewConfig = {
  entryPoints: ['src/markdown/preview-script.ts'],
  bundle: true,
  outfile: 'dist/markdown-preview.js',
  format: 'iife',
  globalName: 'wireframeMarkdownPreview',
  platform: 'browser',
  target: 'es2020',
  sourcemap: !production,
  minify: production,
  // Bundle everything for browser, no externals
};

// Notebook renderer bundle (Browser context)
const notebookRendererConfig = {
  entryPoints: ['src/markdown/notebook-renderer.ts'],
  bundle: true,
  outfile: 'dist/notebook-renderer.js',
  format: 'iife',
  globalName: 'wireframeNotebookRenderer',
  platform: 'browser',
  target: 'es2020',
  sourcemap: !production,
  minify: production,
};

async function build() {
  try {
    await Promise.all([
      esbuild.build(extensionConfig),
      esbuild.build(markdownPreviewConfig),
      esbuild.build(notebookRendererConfig),
    ]);
    console.log('Build complete');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
