const minify = require('html-minifier-terser').minify;
const fs = require('fs');
const path = require('path');
const glob = require('glob');

async function minifyHTMLFiles() {
  const htmlFiles = glob.sync('*.html', {
    ignore: 'node_modules/**'
  });

  if (htmlFiles.length === 0) {
    console.log('No HTML files found');
    return;
  }

  console.log(`Found ${htmlFiles.length} HTML file(s) to minify`);

  for (const file of htmlFiles) {
    try {
      const html = fs.readFileSync(file, 'utf-8');
      const originalSize = Buffer.byteLength(html, 'utf8');

      const minified = await minify(html, {
        minifyJS: true,
        minifyCSS: true,
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: false,
        removeRedundantAttributes: true,
        conservativeCollapse: true,
        collapseBooleanAttributes: true,
        removeEmptyAttributes: true
      });

      const minifiedSize = Buffer.byteLength(minified, 'utf8');
      const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(2);

      const outputPath = path.join('dist', file);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, minified);

      console.log(`✓ ${file}`);
      console.log(`  Original: ${originalSize} bytes → Minified: ${minifiedSize} bytes (${reduction}% reduction)`);
    } catch (error) {
      console.error(`✗ Error minifying ${file}:`, error.message);
      process.exit(1);
    }
  }

  console.log('✓ All HTML files minified successfully!');
}

minifyHTMLFiles().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Add this at the end of the minifyHTMLFiles function, before console.log success

async function updateServiceWorkerCache() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const version = packageJson.version;
  
  try {
    const swPath = 'sw.js';
    const swContent = fs.readFileSync(swPath, 'utf-8');
    const updated = swContent.replace(
      /const cacheName = 'aac[\d.]+'/,
      `const cacheName = 'aac${version}'`
    );
    
    const swDistPath = path.join('dist', 'sw.js');
    fs.writeFileSync(swDistPath, updated);
    console.log('✓ Service Worker cache version updated');
  } catch (error) {
    console.error('Warning: Could not update service worker:', error.message);
  }
}

// Call it before the success message
await updateServiceWorkerCache();
