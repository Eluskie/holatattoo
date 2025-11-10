const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/widget.js'],
  bundle: true,
  minify: true,
  outfile: 'dist/widget.js',
  format: 'iife',
  target: 'es2015',
  banner: {
    js: '/* Hola Tattoo Widget v1.0.0 | MIT License */'
  }
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('👀 Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('✅ Widget built successfully!');

      // Show file size
      const stats = fs.statSync(path.join(__dirname, 'dist/widget.js'));
      const fileSizeInKB = (stats.size / 1024).toFixed(2);
      console.log(`📦 Size: ${fileSizeInKB} KB`);
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
