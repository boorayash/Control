const winstaller = require('electron-winstaller');
const path = require('path');
const fs = require('fs');

async function main() {
  const agentDir = __dirname;
  const distPackager = path.join(agentDir, 'dist-packager'); // This matches where electron-packager outputted
  const distInstaller = path.join(agentDir, 'dist-installer');
  const appFolder = path.join(distPackager, 'ControlAgent-win32-x64');

  console.log('--- Fresh Build Process ---');
  console.log('App Source:', appFolder);
  console.log('Installer Dest:', distInstaller);

  if (!fs.existsSync(distInstaller)) {
    fs.mkdirSync(distInstaller);
  }

  try {
    console.log('Step 1: Creating installer package (This may take several minutes)...');
    await winstaller.createWindowsInstaller({
      appDirectory: appFolder,
      outputDirectory: distInstaller,
      authors: 'Control Team',
      author: 'Control Team', // Singular just in case
      exe: 'ControlAgent.exe',
      description: 'Ultra-low latency remote desktop host agent for Control.',
      version: '1.0.0',
      title: 'Control Agent',
      name: 'ControlAgent',
      setupExe: 'ControlAgentInstaller.exe',
      noMsi: true,
      loadingGif: null // Optional
    });
    console.log('SUCCESS: Installer created at dist-installer/ControlAgentInstaller.exe');
  } catch (err) {
    console.error('ERROR creating installer:', err.message);
    process.exit(1);
  }
}

main();
