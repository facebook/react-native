const path = require('path');
const fs = require('fs');
const { downloadHermesSourceTarball, expandHermesSourceTarball } = require('./hermes/hermes-utils');
const { cp } = require('shelljs');
const { generateiOSArtifacts } = require('./release-utils');

/**
 * Much of this code is copied from test-e2e-local.js
 *
 * The main goal is to build hermesc so it can be checked in to our built
 * version.
 */
async function buildIosArtifacts() {
  const repoRoot = path.join(__dirname, '..');
  const jsiFolder = `${repoRoot}/ReactCommon/jsi`;
  const hermesCoreSourceFolder = `${repoRoot}/sdks/hermes`;

  if (!fs.existsSync(hermesCoreSourceFolder)) {
    console.info('The Hermes source folder is missing. Downloading...');
    downloadHermesSourceTarball();
    expandHermesSourceTarball();
  }

  // need to move the scripts inside the local hermes cloned folder
  // cp sdks/hermes-engine/utils/*.sh <your_hermes_checkout>/utils/.
  cp(
    `${repoRoot}/sdks/hermes-engine/utils/*.sh`,
    `${repoRoot}/sdks/hermes/utils/.`,
  );

  // the android ones get set into /private/tmp/maven-local
  const localMavenPath = '/private/tmp/maven-local';
  const buildTypeiOSArtifacts = 'Release';

  generateiOSArtifacts(
    jsiFolder,
    hermesCoreSourceFolder,
    buildTypeiOSArtifacts,
    localMavenPath,
  );

  // Copy the built hermesc into the correct destination. We only build and copy
  // osx since that's the only platform we currently build the app on.
  //
  // We figured out `osxBinDir` by looking at the directory structure of React
  // Native installed from npm.
  const osxBinDir = `${repoRoot}/sdks/hermesc/osx-bin`;
  await fs.promises.mkdir(osxBinDir, { recursive: true });
  cp(`${repoRoot}/sdks/hermes/build_macosx/bin/hermesc`, osxBinDir);
}

buildIosArtifacts();
