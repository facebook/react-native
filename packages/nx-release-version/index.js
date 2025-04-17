// @ts-check

const { releaseVersionGenerator } = require('@nx/js/src/generators/release-version/release-version');
const fs = require('node:fs');
const path = require('node:path');
const { REPO_ROOT } = require('../../scripts/consts');

async function runSetVersion() {
  const rnmPkgJson = require.resolve('react-native-macos/package.json');
  const { REPO_ROOT } = require('../../scripts/consts');
  const { updateReactNativeArtifacts } = require('../../scripts/releases/set-rn-artifacts-version');

  const manifest = fs.readFileSync(rnmPkgJson, { encoding: 'utf-8' });
  const { version } = JSON.parse(manifest);

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

/** @type {typeof releaseVersionGenerator} */
module.exports = async function(tree, options) {
  const { data, callback } = await releaseVersionGenerator(tree, options);
  return {
    data,
    callback: async (tree, options) => {
      const result = await callback(tree, options);

      const versionedFiles = await runSetVersion();
      if (versionedFiles) {
        const changedFiles = Array.isArray(result) ? result : result.changedFiles;
        changedFiles.push(...versionedFiles);
      }

      return result;
    },
  };
};
