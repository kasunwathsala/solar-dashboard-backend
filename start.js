#!/usr/bin/env node
/* Startup wrapper: ensure built JS exists before starting.
   If dist/index.js is missing, run `npm run build` and then start it.
*/
const { existsSync } = require('fs');
const { execSync, spawn } = require('child_process');
const path = require('path');

const distEntry = path.join(__dirname, 'dist', 'index.js');

function log(...args) { console.log('[start]', ...args); }

async function main() {
  try {
    if (!existsSync(distEntry)) {
      log('dist/index.js not found — running build...');

      // Try to run the build with an increased Node heap limit to avoid
      // `FATAL ERROR: Ineffective mark-compacts near heap limit` during tsc.
      const buildEnv = Object.assign({}, process.env);
      if (!buildEnv.NODE_OPTIONS) {
        buildEnv.NODE_OPTIONS = '--max_old_space_size=4096';
        log('Setting NODE_OPTIONS=--max_old_space_size=4096 for build');
      }

      try {
        execSync('npm run build', { stdio: 'inherit', env: buildEnv });
      } catch (err) {
        console.error('Build failed during startup wrapper.');
        console.error('If this is due to memory limits, try one of:');
        console.error(' - Set Render env var NODE_OPTIONS=--max_old_space_size=4096');
        console.error(' - Configure Render to run the build during the Deploy phase (Build Command: npm run build)');
        console.error(' - Build the project locally / in CI and deploy the compiled dist/');
        throw err;
      }

      if (!existsSync(distEntry)) {
        throw new Error('Build completed but dist/index.js still missing');
      }
    }

    log('Starting node', distEntry);
    const child = spawn(process.execPath, [distEntry], { stdio: 'inherit' });
    child.on('exit', code => process.exit(code));
    child.on('error', err => {
      console.error('Failed to start server process:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Startup wrapper error:', err);
    process.exit(1);
  }
}

main();
