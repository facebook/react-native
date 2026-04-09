/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * sync-spm-autolinking.js – Lightweight script invoked by the Xcode pre-build
 * phase to re-run autolinking (step 2) and package generation (step 4) when
 * dependency inputs have changed.
 *
 * Usage (called from the Xcode build phase shell script):
 *   node sync-spm-autolinking.js --app-root <path> --react-native-root <path>
 *
 * This script:
 *   0. Runs react-native codegen → build/generated/ios/
 *   1. Ensures xcframework artifacts are downloaded (auto-heals fresh clones)
 *   2. Calls generate-spm-autolinking.js → autolinked/Package.swift
 *   3. Calls generate-spm-package.js → build/xcframeworks/Package.swift + symlinks
 *   4. Resolves the VFS overlay template → build/xcframeworks/React-VFS.yaml
 *   5. Writes autolinked/.spm-sync-stamp
 */

const {main: downloadArtifacts} = require('./download-spm-artifacts');
const {main: generateAutolinking} = require('./generate-spm-autolinking');
const {main: generatePackage} = require('./generate-spm-package');
const {defaultCacheDir, findProjectRoot, makeLogger, readPackageJson, resolveAndWriteVFSOverlay, runCodegenAndInstallTemplate} = require('./spm-utils');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const {log} = makeLogger('sync-spm-autolinking');

async function main(argv /*:: ?: Array<string> */) /*: Promise<void> */ {
  const parsed = yargs(argv ?? process.argv.slice(2))
    .version(false)
    .option('app-root', {
      type: 'string',
      demandOption: true,
      describe: 'Path to the app directory',
    })
    .option('react-native-root', {
      type: 'string',
      demandOption: true,
      describe: 'Path to react-native package root',
    })
    .help()
    .parseSync();

  const appRoot = path.resolve(parsed['app-root']);
  const reactNativeRoot = path.resolve(parsed['react-native-root']);
  const projectRoot = findProjectRoot(appRoot);

  // Step 0: Re-run codegen
  try {
    runCodegenAndInstallTemplate(projectRoot, appRoot, reactNativeRoot, {log});
  } catch {
    log('Codegen failed — continuing with existing output');
  }

  // Step 1: Ensure xcframework artifacts are available
  const xcfwLinksDir = path.join(appRoot, 'build', 'xcframeworks');
  const artifactsJsonPath = path.join(xcfwLinksDir, 'artifacts.json');
  let artifactsDir /*: string | null */ = null;

  // Check if artifacts are missing or symlinks are broken (pointing to deleted cache)
  const needsDownload = !fs.existsSync(artifactsJsonPath)
    || !fs.existsSync(path.join(xcfwLinksDir, 'React.xcframework'));

  if (needsDownload) {
    const pkg = readPackageJson(reactNativeRoot);
    const version = pkg?.version ?? '0.0.0';
    const flavor = 'debug';
    const cacheDir = defaultCacheDir(version, flavor);

    log('Downloading xcframework artifacts...');
    await downloadArtifacts(['--version', version, '--flavor', flavor, '--output', cacheDir]);
    artifactsDir = cacheDir;
  } else {
    artifactsDir = xcfwLinksDir;
  }

  // Step 2: Re-generate autolinked/Package.swift
  log('Re-generating autolinked/Package.swift...');
  generateAutolinking([
    '--app-root',
    appRoot,
    '--react-native-root',
    reactNativeRoot,
  ]);

  // Step 3: Re-generate xcframeworks sub-package
  log('Re-generating xcframeworks sub-package...');
  const packageArgs = [
    '--app-root',
    appRoot,
    '--react-native-root',
    reactNativeRoot,
  ];

  if (artifactsDir != null) {
    packageArgs.push('--artifacts-dir', artifactsDir);
  }

  generatePackage(packageArgs);

  // Step 4: Resolve VFS overlay
  resolveAndWriteVFSOverlay(appRoot, reactNativeRoot, {log});

  // Step 5: Write stamp file
  const stampPath = path.join(appRoot, 'autolinked', '.spm-sync-stamp');
  fs.mkdirSync(path.dirname(stampPath), {recursive: true});
  fs.writeFileSync(stampPath, new Date().toISOString() + '\n', 'utf8');
  log('SPM autolinking sync complete.');
}

if (require.main === module) {
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
}

module.exports = {main};
