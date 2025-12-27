/**
 * Example Files Parser Test
 * 
 * This test file validates that all example .wire files parse without errors.
 * It ensures the parser correctly handles all supported syntax.
 * SVG files are generated next to the source .wire files.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from './parser';
import { compile } from '../index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to docs directories (relative from packages/core/src/parser)
const docsDir = path.resolve(__dirname, '../../../../docs');
const examplesDir = path.join(docsDir, 'examples');
const themesDir = path.join(docsDir, 'themes');

// Get all .wire files from a directory
function getWireFiles(dir: string): { name: string; path: string }[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.wire'))
    .map(f => ({
      name: f,
      path: path.join(dir, f)
    }));
}

// Generate SVG file next to the .wire file
function generateSvgFile(wirePath: string, theme: string = 'clean'): { success: boolean; error?: string } {
  try {
    const source = fs.readFileSync(wirePath, 'utf-8');
    const { svg, errors } = compile(source, {
      width: 800,
      height: 600,
      theme: theme as 'clean' | 'sketch' | 'blueprint' | 'realistic'
    });

    if (errors.length > 0) {
      return { success: false, error: errors.map(e => e.message).join(', ') };
    }

    // Generate SVG path next to the .wire file
    const svgPath = wirePath.replace(/\.wire$/, '.svg');
    fs.writeFileSync(svgPath, svg, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

describe('Example Files Parser Validation', () => {
  const wireFiles = getWireFiles(examplesDir);

  it('should find example files in docs/examples', () => {
    expect(wireFiles.length).toBeGreaterThan(0);
    console.log(`Found ${wireFiles.length} example files`);
  });

  describe('Parser Error Checks', () => {
    wireFiles.forEach(({ name, path: filePath }) => {
      it(`${name} should parse without errors`, () => {
        const source = fs.readFileSync(filePath, 'utf-8');
        const { document, errors } = parse(source);

        // Report any errors for debugging
        if (errors.length > 0) {
          console.log(`Errors in ${name}:`);
          errors.forEach(e => console.log(`  Line ${e.location.line}: ${e.message}`));
        }

        expect(errors.length).toBe(0);
        expect(document).not.toBeNull();
        expect(document?.type).toBe('Document');
      });
    });
  });

  describe('SVG Generation (next to .wire files)', () => {
    wireFiles.forEach(({ name, path: filePath }) => {
      it(`${name} should generate SVG file`, () => {
        const result = generateSvgFile(filePath, 'clean');
        expect(result.success).toBe(true);
        
        // Verify SVG file was created
        const svgPath = filePath.replace(/\.wire$/, '.svg');
        expect(fs.existsSync(svgPath)).toBe(true);
        
        const svgContent = fs.readFileSync(svgPath, 'utf-8');
        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('</svg>');
      });
    });
  });

  describe('Parser Coverage Summary', () => {
    it('should successfully parse all examples', () => {
      let successCount = 0;
      let failCount = 0;
      const failures: { file: string; errors: string[] }[] = [];

      wireFiles.forEach(({ name, path: filePath }) => {
        const source = fs.readFileSync(filePath, 'utf-8');
        const { errors } = parse(source);

        if (errors.length === 0) {
          successCount++;
        } else {
          failCount++;
          failures.push({
            file: name,
            errors: errors.map(e => `Line ${e.location.line}: ${e.message}`)
          });
        }
      });

      console.log(`\n📊 Parser Validation Summary:`);
      console.log(`   ✅ Parsed successfully: ${successCount}/${wireFiles.length}`);
      console.log(`   ❌ Failed: ${failCount}`);

      if (failures.length > 0) {
        console.log(`\n   Failures:`);
        failures.forEach(f => {
          console.log(`   - ${f.file}:`);
          f.errors.forEach(e => console.log(`       ${e}`));
        });
      }

      expect(failCount).toBe(0);
      expect(successCount).toBe(wireFiles.length);
    });
  });
});

describe('Language Feature Coverage', () => {
  const wireFiles = getWireFiles(examplesDir);

  it('should test all modifiers', () => {
    const modifiers = [
      'primary', 'secondary', 'required', 'disabled',
      'checked', 'selected', 'readonly', 'editable',
      'active', 'expanded', 'removable', 'circle',
      'indeterminate', 'completed', 'border'
    ];

    const allSources = wireFiles
      .map(f => fs.readFileSync(f.path, 'utf-8'))
      .join('\n');

    const testedModifiers = modifiers.filter(m => allSources.includes(m));
    console.log(`Modifiers tested: ${testedModifiers.length}/${modifiers.length}`);
    console.log(`  Tested: ${testedModifiers.join(', ')}`);

    const untestedModifiers = modifiers.filter(m => !allSources.includes(m));
    if (untestedModifiers.length > 0) {
      console.log(`  Not tested: ${untestedModifiers.join(', ')}`);
    }

    expect(testedModifiers.length).toBeGreaterThan(modifiers.length / 2);
  });

  it('should test layout types', () => {
    const layouts = ['Vertical', 'Horizontal', 'Grid', 'Dock', 'Canvas', 'Scroll'];

    const allSources = wireFiles
      .map(f => fs.readFileSync(f.path, 'utf-8'))
      .join('\n');

    const testedLayouts = layouts.filter(l => allSources.includes(l));
    console.log(`Layouts tested: ${testedLayouts.length}/${layouts.length}`);

    expect(testedLayouts.length).toBeGreaterThan(2);
  });

  it('should test section types', () => {
    const sections = [
      'Header', 'Footer', 'Sidebar', 'Content',
      'Panel', 'Card', 'Toolbar', 'StatusBar',
      'Modal', 'Drawer'
    ];

    const allSources = wireFiles
      .map(f => fs.readFileSync(f.path, 'utf-8'))
      .join('\n');

    const testedSections = sections.filter(s => allSources.includes(s));
    console.log(`Sections tested: ${testedSections.length}/${sections.length}`);

    expect(testedSections.length).toBeGreaterThan(sections.length / 2);
  });

  it('should test control types', () => {
    const controls = [
      'Button', 'IconButton', 'TextInput', 'NumberInput',
      'DateInput', 'PasswordInput', 'TextArea', 'Label',
      'Heading', 'Link', 'Checkbox', 'Radio', 'Dropdown',
      'Option', 'Separator', 'Spacer', 'Icon', 'Image',
      'Avatar', 'Badge', 'Progress', 'Slider', 'Switch',
      'Chip', 'Pagination', 'Toast', 'Skeleton'
    ];

    const allSources = wireFiles
      .map(f => fs.readFileSync(f.path, 'utf-8'))
      .join('\n');

    const testedControls = controls.filter(c => allSources.includes(c));
    console.log(`Controls tested: ${testedControls.length}/${controls.length}`);

    const untestedControls = controls.filter(c => !allSources.includes(c));
    if (untestedControls.length > 0) {
      console.log(`  Not tested: ${untestedControls.join(', ')}`);
    }

    expect(testedControls.length).toBeGreaterThan(controls.length / 2);
  });

  it('should test component types', () => {
    const components = [
      'Tabs', 'Tab', 'Expander', 'Tree', 'TreeItem',
      'List', 'Menu', 'MenuItem', 'Hamburger',
      'Breadcrumb', 'BreadcrumbItem', 'Accordion',
      'AccordionSection', 'Stepper', 'Step', 'Dialog',
      'Alert', 'Hover', 'Table', 'DataGrid', 'Column'
    ];

    const allSources = wireFiles
      .map(f => fs.readFileSync(f.path, 'utf-8'))
      .join('\n');

    const testedComponents = components.filter(c => allSources.includes(c));
    console.log(`Components tested: ${testedComponents.length}/${components.length}`);

    const untestedComponents = components.filter(c => !allSources.includes(c));
    if (untestedComponents.length > 0) {
      console.log(`  Not tested: ${untestedComponents.join(', ')}`);
    }

    expect(testedComponents.length).toBeGreaterThan(components.length / 3);
  });
});

// ============ Theme Examples Tests ============

describe('Theme Examples', () => {
  const themeFiles = getWireFiles(themesDir);
  const themes = ['clean', 'sketch', 'blueprint', 'realistic'] as const;

  it('should find theme example files in docs/themes', () => {
    expect(themeFiles.length).toBeGreaterThan(0);
    console.log(`Found ${themeFiles.length} theme example files`);
  });

  describe('Theme File Parser Checks', () => {
    themeFiles.forEach(({ name, path: filePath }) => {
      it(`${name} should parse without errors`, () => {
        const source = fs.readFileSync(filePath, 'utf-8');
        const { document, errors } = parse(source);

        if (errors.length > 0) {
          console.log(`Errors in ${name}:`);
          errors.forEach(e => console.log(`  Line ${e.location.line}: ${e.message}`));
        }

        expect(errors.length).toBe(0);
        expect(document).not.toBeNull();
      });
    });
  });

  describe('Theme SVG Generation (next to .wire files)', () => {
    themeFiles.forEach(({ name, path: filePath }) => {
      // Detect theme from filename or file content
      const getThemeFromFile = (): 'clean' | 'sketch' | 'blueprint' | 'realistic' => {
        const source = fs.readFileSync(filePath, 'utf-8');
        for (const theme of themes) {
          if (source.includes(`wireframe ${theme}`)) {
            return theme;
          }
        }
        return 'clean';
      };

      it(`${name} should generate SVG with correct theme`, () => {
        const theme = getThemeFromFile();
        const result = generateSvgFile(filePath, theme);
        
        if (!result.success) {
          console.log(`Error generating ${name}: ${result.error}`);
        }
        
        expect(result.success).toBe(true);
        
        // Verify SVG file was created next to .wire file
        const svgPath = filePath.replace(/\.wire$/, '.svg');
        expect(fs.existsSync(svgPath)).toBe(true);
        
        const svgContent = fs.readFileSync(svgPath, 'utf-8');
        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('</svg>');
      });
    });
  });

  describe('Theme Comparison SVG Generation', () => {
    // For theme-comparison.wire, generate SVG for each theme
    const comparisonFile = themeFiles.find(f => f.name === 'theme-comparison.wire');
    
    if (comparisonFile) {
      themes.forEach(theme => {
        it(`theme-comparison.wire should render with ${theme} theme`, () => {
          const source = fs.readFileSync(comparisonFile.path, 'utf-8');
          const { svg, errors } = compile(source, {
            width: 800,
            height: 800,
            theme
          });

          expect(errors.length).toBe(0);
          expect(svg).toContain('<svg');

          // Save theme-specific SVG
          const svgPath = comparisonFile.path.replace('.wire', `-${theme}.svg`);
          fs.writeFileSync(svgPath, svg, 'utf-8');
          expect(fs.existsSync(svgPath)).toBe(true);
        });
      });
    }
  });

  describe('Theme Summary', () => {
    it('should successfully generate all theme examples', () => {
      let successCount = 0;
      let failCount = 0;
      const results: { file: string; theme: string; success: boolean }[] = [];

      themeFiles.forEach(({ name, path: filePath }) => {
        const source = fs.readFileSync(filePath, 'utf-8');
        let theme: 'clean' | 'sketch' | 'blueprint' | 'realistic' = 'clean';
        
        for (const t of themes) {
          if (source.includes(`wireframe ${t}`)) {
            theme = t;
            break;
          }
        }

        const result = generateSvgFile(filePath, theme);
        results.push({ file: name, theme, success: result.success });
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      });

      console.log(`\n🎨 Theme Generation Summary:`);
      console.log(`   ✅ Generated: ${successCount}/${themeFiles.length}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`\n   Theme breakdown:`);
      results.forEach(r => {
        console.log(`   - ${r.file} (${r.theme}): ${r.success ? '✅' : '❌'}`);
      });

      expect(failCount).toBe(0);
    });
  });
});
