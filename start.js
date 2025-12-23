#!/usr/bin/env node
/* Startup wrapper: ensure built JS exists before starting.
   If dist/index.js is missing, try to build. If build fails, fallback to ts-node.
*/
const { existsSync, readdirSync } = require('fs');
const { execSync, spawn } = require('child_process');
const path = require('path');

const distEntry = path.join(__dirname, 'dist', 'index.js');
const srcEntry = path.join(__dirname, 'src', 'index.ts');

function log(...args) { console.log('[start]', ...args); }

async function main() {
  try {
    if (!existsSync(distEntry)) {
      log('dist/index.js not found — attempting build...');

      // Try to run the build with increased Node heap limit
      const buildEnv = Object.assign({}, process.env);
      if (!buildEnv.NODE_OPTIONS) {
        buildEnv.NODE_OPTIONS = '--max_old_space_size=4096';
        log('Setting NODE_OPTIONS=--max_old_space_size=4096 for build');
      }

      try {
        execSync('npm run build', { stdio: 'inherit', env: buildEnv });
      } catch (err) {
        console.error('Build failed. Error details:');
        console.error(err.message);
        
        // Check if dist directory exists at all
        const distDir = path.join(__dirname, 'dist');
        if (existsSync(distDir)) {
          console.log('dist/ directory exists but contents:');
          try {
            const files = readdirSync(distDir);
            console.log(files.length ? files : 'empty');
          } catch (e) {
            console.log('cannot read dist/');
          }
        } else {
          console.log('dist/ directory does not exist');
        }
        
        // Fallback to ts-node if available
        if (existsSync(srcEntry)) {
          log('Build failed, falling back to ts-node for', srcEntry);
          const child = spawn(process.execPath, ['-r', 'ts-node/register', srcEntry], { stdio: 'inherit' });
          child.on('exit', code => process.exit(code));
          child.on('error', tsErr => {
            console.error('ts-node fallback also failed:', tsErr.message);
            console.error('Both compiled JS and ts-node failed. Deploy unsuccessful.');
            process.exit(1);
          });
          return;
        } else {
          console.error('No fallback available. src/index.ts not found.');
          throw err;
        }
      }

      // Double-check the build output
      if (!existsSync(distEntry)) {
        console.error('Build appeared to succeed but dist/index.js still missing.');
        
        // List what was actually built
        const distDir = path.join(__dirname, 'dist');
        if (existsSync(distDir)) {
          try {
            const files = readdirSync(distDir);
            console.log('Files in dist/:', files);
          } catch (e) {
            console.log('Cannot read dist/ directory');
          }
        }
        
        // Try ts-node as fallback
        if (existsSync(srcEntry)) {
          log('Using ts-node fallback...');
          const child = spawn(process.execPath, ['-r', 'ts-node/register', srcEntry], { stdio: 'inherit' });
          child.on('exit', code => process.exit(code));
          child.on('error', tsErr => {
            console.error('ts-node fallback failed:', tsErr.message);
            process.exit(1);
          });
          return;
        } else {
          throw new Error('Build succeeded but no usable entry point found');
        }
      }
    }

    log('Starting compiled JS:', distEntry);
    const child = spawn(process.execPath, [distEntry], { stdio: 'inherit' });
    child.on('exit', code => process.exit(code));
    child.on('error', err => {
      console.error('Failed to start server process:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Startup wrapper error:', err.message);
    process.exit(1);
  }
}

main();
