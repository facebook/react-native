// @ts-check

const {REPO_ROOT} = require('../../scripts/consts');
const JsVersionActions = require('@nx/js/src/release/version-actions').default;
const fs = require('node:fs');
const path = require('node:path');

async function runSetVersion() {
  const rnmPkgJsonPath = path.join(REPO_ROOT, 'packages', 'react-native', 'package.json');
  const {updateReactNativeArtifacts} = require('../../scripts/releases/set-rn-artifacts-version');

  const manifest = fs.readFileSync(rnmPkgJsonPath, {encoding: 'utf-8'});
  const {version} = JSON.parse(manifest);

  await updateReactNativeArtifacts(version);

  return [
    path.join(
      REPO_ROOT,
      'packages',
      'react-native',
      'ReactAndroid',
      'gradle.properties',
    ),
    path.join(
      REPO_ROOT,
      'packages',
      'react-native',
      'ReactAndroid',
      'src',
      'main',
      'java',
      'com',
      'facebook',
      'react',
      'modules',
      'systeminfo',
      'ReactNativeVersion.java',
    ),
    path.join(REPO_ROOT,
      'packages',
      'react-native',
      'React',
      'Base',
      'RCTVersion.m',
    ),
    path.join(
      REPO_ROOT,
      'packages',
      'react-native',
      'ReactCommon',
      'cxxreact',
      'ReactNativeVersion.h',
    ),
    path.join(
      REPO_ROOT,
      'packages',
      'react-native',
      'Libraries',
      'Core',
      'ReactNativeVersion.js',
    ),
  ];
}

/**
 * Custom afterAllProjectsVersioned hook for React Native macOS
 * Updates React Native artifacts after all projects have been versioned
 * @param {string} _cwd - Current working directory (unused)
 * @param {object} _opts - Options object containing versioning information (unused)
 * @returns {Promise<{changedFiles: string[], deletedFiles: string[]}>}
 */
const afterAllProjectsVersioned = async (_cwd, _opts) => {
  const changedFiles = [];

  try {
    // Create the .rnm-publish file to indicate versioning has occurred
    fs.writeFileSync(path.join(REPO_ROOT, '.rnm-publish'), '');

    // Update React Native artifacts
    const versionedFiles = await runSetVersion();

    // Return the versioned files so Nx can track them
    changedFiles.push(...versionedFiles);

    console.log('✅ Updated React Native artifacts');
    console.log('🏷️  Created .rnm-publish marker file');

  } catch (error) {
    console.error('Failed to update React Native artifacts:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to update React Native artifacts: ${errorMessage}`);
    throw error;
  }

  return {
    changedFiles,
    deletedFiles: [],
  };
};

module.exports = JsVersionActions;
module.exports.default = JsVersionActions;
module.exports.afterAllProjectsVersioned = afterAllProjectsVersioned;
