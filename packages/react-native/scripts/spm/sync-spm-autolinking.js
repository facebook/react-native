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
const {defaultCacheDir, findProjectRoot, makeLogger, readPackageJson} = require('./spm-utils');
const {execSync} = require('child_process');
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
  const scriptsDir = path.join(reactNativeRoot, 'scripts');
  const codegenScript = path.join(scriptsDir, 'generate-codegen-artifacts.js');
  if (fs.existsSync(codegenScript)) {
    log('Re-running codegen...');
    try {
      // -p points to projectRoot (where package.json lives); -o points to
      // appRoot so output lands in the current working directory (may be ios/).
      const codegenArgs = `node "${codegenScript}" -p "${projectRoot}" -t ios` +
        (projectRoot !== appRoot ? ` -o "${appRoot}"` : '');
      execSync(
        codegenArgs,
        {stdio: 'inherit', cwd: projectRoot},
      );

      // Install SPM codegen template
      const codegenPkgSwift = path.join(
        appRoot, 'build', 'generated', 'ios', 'Package.swift',
      );
      const spmTemplate = path.join(
        scriptsDir, 'codegen', 'templates', 'Package.swift.spm-template',
      );
      if (fs.existsSync(spmTemplate) && fs.existsSync(path.dirname(codegenPkgSwift))) {
        fs.copyFileSync(spmTemplate, codegenPkgSwift);
        log('Installed SPM codegen template');
      }
    } catch {
      log('Codegen failed — continuing with existing output');
    }
  }

  // Step 1: Ensure xcframework artifacts are available
  const xcfwLinksDir = path.join(appRoot, 'build', 'xcframeworks');
  const artifactsJsonPath = path.join(xcfwLinksDir, 'artifacts.json');
  let artifactsDir /*: string | null */ = null;

  let needsDownload = !fs.existsSync(artifactsJsonPath);
  // Also check if symlinks are broken (pointing to deleted cache)
  if (!needsDownload) {
    const reactXcfw = path.join(xcfwLinksDir, 'React.xcframework');
    needsDownload = !fs.existsSync(reactXcfw);
  }

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
  const xcfwPath = path.join(
    appRoot,
    'build',
    'xcframeworks',
    'React.xcframework',
  );
  if (fs.existsSync(xcfwPath)) {
    const realXcfwPath = fs.realpathSync(xcfwPath);
    const vfsTemplatePath = path.join(realXcfwPath, 'React-VFS-template.yaml');
    const resolvedPath = path.join(
      appRoot,
      'build',
      'xcframeworks',
      'React-VFS.yaml',
    );

    if (fs.existsSync(vfsTemplatePath)) {
      const {resolveVFSOverlay} = require('../ios-prebuild/vfs');
      const template = fs.readFileSync(vfsTemplatePath, 'utf8');
      const resolved = resolveVFSOverlay(template, realXcfwPath);
      fs.writeFileSync(resolvedPath, resolved, 'utf8');
      log('Resolved VFS overlay (from template)');
    } else {
      const {
        createVFSOverlay,
        resolveVFSOverlay,
      } = require('../ios-prebuild/vfs');
      const template = createVFSOverlay(reactNativeRoot);
      const resolved = resolveVFSOverlay(template, realXcfwPath);
      fs.writeFileSync(resolvedPath, resolved, 'utf8');
      log('Generated VFS overlay (from podspecs)');
    }
  }

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
