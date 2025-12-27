// Script to add 4-space indent to all wireframe content
const fs = require('fs');
const path = require('path');

function indentWireframeContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let inWireframe = false;
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Start of wireframe block
    if (trimmed.startsWith('wireframe ') || trimmed === 'wireframe') {
      result.push(line);
      inWireframe = true;
      continue;
    }
    
    // End of wireframe block
    if (trimmed === '/wireframe') {
      result.push(line);
      inWireframe = false;
      continue;
    }
    
    // Comments before wireframe (keep as-is)
    if (!inWireframe && trimmed.startsWith('//')) {
      result.push(line);
      continue;
    }
    
    // Content inside wireframe - add 4-space indent
    if (inWireframe) {
      if (trimmed === '') {
        // Keep blank lines blank
        result.push('');
      } else {
        // Add 4 spaces to existing indentation
        result.push('    ' + line);
      }
    } else {
      result.push(line);
    }
  }
  
  fs.writeFileSync(filePath, result.join('\n'), 'utf8');
  console.log(`Updated: ${path.basename(filePath)}`);
}

// Process all .wire files
const examplesDir = './docs/examples';
const themesDir = './docs/themes';

const exampleFiles = fs.readdirSync(examplesDir)
  .filter(f => f.endsWith('.wire'))
  .map(f => path.join(examplesDir, f));

const themeFiles = fs.readdirSync(themesDir)
  .filter(f => f.endsWith('.wire'))
  .map(f => path.join(themesDir, f));

[...exampleFiles, ...themeFiles].forEach(indentWireframeContent);

console.log('\nDone! All files updated.');
