const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
  const agentDir = __dirname;
  const distDir = path.join(agentDir, 'dist');
  const distInstaller = path.join(agentDir, 'dist-installer');

  console.log('=== Control Agent Installer Build ===\n');

  // --- Step 1: Build with electron-builder ---
  console.log('Step 1: Building installer with electron-builder (NSIS)...');
  console.log('  This may take several minutes...\n');

  try {
    execSync('npx electron-builder --win --config', {
      cwd: agentDir,
      stdio: 'inherit',
      env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }
    });
  } catch (err) {
    console.error('ERROR: electron-builder failed:', err.message);
    process.exit(1);
  }

  // --- Step 2: Copy installer to dist-installer for backwards compatibility ---
  console.log('\nStep 2: Copying installer to dist-installer...');
  if (!fs.existsSync(distInstaller)) {
    fs.mkdirSync(distInstaller, { recursive: true });
  }

  const builtInstaller = path.join(distDir, 'ControlAgentInstaller.exe');
  const installerDest = path.join(distInstaller, 'ControlAgentInstaller.exe');

  if (fs.existsSync(builtInstaller)) {
    fs.copyFileSync(builtInstaller, installerDest);
    console.log(`  - Copied to ${installerDest}`);
  } else {
    console.error('ERROR: Built installer not found at', builtInstaller);
    console.log('  Checking dist folder contents:');
    fs.readdirSync(distDir).forEach(f => console.log(`    - ${f}`));
    process.exit(1);
  }

  // --- Step 3: Sync to server public directory ---
  console.log('\nStep 3: Syncing to Server public directory...');
  const serverPublicPath = path.join(agentDir, '..', 'server', 'public', 'downloads');
  const serverDest = path.join(serverPublicPath, 'ControlAgentInstaller.exe');

  if (!fs.existsSync(serverPublicPath)) {
    fs.mkdirSync(serverPublicPath, { recursive: true });
  }

  fs.copyFileSync(installerDest, serverDest);
  console.log(`  - Synced to ${serverDest}`);

  console.log('\n=== BUILD COMPLETE ===');
  console.log('Installer ready at: dist-installer/ControlAgentInstaller.exe');
  console.log('Server download link updated automatically.');
}

main();
