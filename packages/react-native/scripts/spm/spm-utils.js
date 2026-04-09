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

const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

/**
 * Creates a logger trio {log, warn, die} that prefixes messages with [name].
 *   log  – green prefix, writes to stdout
 *   warn – yellow prefix, writes to stderr
 *   die  – red prefix, writes to stderr, sets exitCode=1, throws
 */
function makeLogger(name /*: string */) /*: {
  log: (msg: string) => void,
  warn: (msg: string) => void,
  die: (msg: string) => empty,
} */ {
  return {
    log(msg /*: string */) /*: void */ {
      console.log(`\x1b[32m[${name}]\x1b[0m ${msg}`);
    },
    warn(msg /*: string */) /*: void */ {
      console.warn(`\x1b[33m[${name}]\x1b[0m ${msg}`);
    },
    die(msg /*: string */) /*: empty */ {
      console.error(`\x1b[31m[${name}]\x1b[0m ${msg}`);
      process.exitCode = 1;
      throw new Error(msg);
    },
  };
}

// ---------------------------------------------------------------------------
// Path display
// ---------------------------------------------------------------------------

/**
 * Returns a short, human-readable representation of an absolute path:
 *   - Paths under $HOME are shown as ~/...
 *   - Paths under cwd are shown as relative (if ≤2 levels up)
 *   - Otherwise the absolute path is returned unchanged
 */
function displayPath(p /*: string */) /*: string */ {
  const home = os.homedir();
  if (p === home) return '~';
  if (p.startsWith(home + path.sep)) {
    return '~' + p.slice(home.length);
  }
  const rel = path.relative(process.cwd(), p);
  if (rel && !rel.startsWith('../../..')) {
    return rel;
  }
  return p;
}

// ---------------------------------------------------------------------------
// Cache directory
// ---------------------------------------------------------------------------

/**
 * Returns the default versioned cache directory for SPM artifacts.
 *
 * @param {string} versionKey  Version string used as directory name.
 *                             Pass the raw --version arg (e.g. 'nightly') so the
 *                             cache slot is stable regardless of the resolved hash.
 * @param {string} flavor      'debug' or 'release'
 */
function defaultCacheDir(
  versionKey /*: string */,
  flavor /*: string */,
) /*: string */ {
  return path.join(
    os.homedir(),
    'Library',
    'Caches',
    'com.facebook.ReactNative',
    'spm-artifacts',
    versionKey,
    flavor,
  );
}

// ---------------------------------------------------------------------------
// Name helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize a package/app name to a valid Swift identifier.
 * e.g. "@react-native/tester" -> "RNTester", "my-app" -> "MyApp"
 */
function toSwiftName(name /*: string */) /*: string */ {
  // Strip scope
  const base = name.replace(/^@[^/]+\//, '');
  // Split on non-alphanumeric, capitalize each part
  return base
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

// ---------------------------------------------------------------------------
// App name derivation
// ---------------------------------------------------------------------------

/**
 * Derive a default app name from the raw package name and source path.
 * Prefers the source directory name when it's meaningful (e.g. "RNTester"),
 * falls back to the package name for generic dirs like "ios" or "src".
 */
function deriveAppName(
  rawName /*: string */,
  sourcePath /*: string */,
) /*: string */ {
  const genericSourceDirs = new Set(['ios', 'app', 'sources', 'src']);
  const cleanName = rawName.replace(/^@[^/]+\//, '');
  return toSwiftName(
    sourcePath !== toSwiftName(cleanName) &&
      !genericSourceDirs.has(sourcePath.toLowerCase())
      ? sourcePath
      : cleanName,
  );
}

// ---------------------------------------------------------------------------
// Package.json reader
// ---------------------------------------------------------------------------

// $FlowFixMe[unclear-type] JSON data has dynamic shape
function readPackageJson(dir /*: string */) /*: Object | null */ {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  // $FlowFixMe[incompatible-return] JSON.parse returns any
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

/**
 * Walk up from startDir until we find a directory containing package.json.
 * Returns startDir itself if it contains package.json, or startDir as fallback
 * if no package.json is found anywhere up the tree.
 */
function findProjectRoot(startDir /*: string */) /*: string */ {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return path.resolve(startDir);
    }
    dir = parent;
  }
}

// ---------------------------------------------------------------------------
// React-native root resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the react-native package root from an app directory.
 * Checks appRoot/node_modules, then projectRoot/node_modules,
 * then falls back to __dirname-relative resolution (monorepo layout).
 *
 * Returns null if react-native cannot be found.
 */
function resolveReactNativeRoot(
  appRoot /*: string */,
  projectRoot /*: string */,
) /*: string | null */ {
  const candidates = [
    path.join(appRoot, 'node_modules', 'react-native'),
    path.join(projectRoot, 'node_modules', 'react-native'),
    path.resolve(__dirname, '../..'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// VFS overlay resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the VFS overlay for React.xcframework and writes it to
 * build/xcframeworks/React-VFS.yaml. Prefers the template embedded in the
 * xcframework; falls back to generating one from podspecs.
 *
 * Returns true if the overlay was written, false if xcframework not found.
 */
function resolveAndWriteVFSOverlay(
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: boolean */ {
  const xcfwPath = path.join(appRoot, 'build', 'xcframeworks', 'React.xcframework');
  if (!fs.existsSync(xcfwPath)) {
    return false;
  }
  const realXcfwPath = fs.realpathSync(xcfwPath);
  const vfsTemplatePath = path.join(realXcfwPath, 'React-VFS-template.yaml');
  const resolvedPath = path.join(appRoot, 'build', 'xcframeworks', 'React-VFS.yaml');

  if (fs.existsSync(vfsTemplatePath)) {
    const {resolveVFSOverlay} = require('../ios-prebuild/vfs');
    const template = fs.readFileSync(vfsTemplatePath, 'utf8');
    const resolved = resolveVFSOverlay(template, realXcfwPath);
    fs.writeFileSync(resolvedPath, resolved, 'utf8');
    logger.log('Resolved VFS overlay (from template)');
  } else {
    const {createVFSOverlay, resolveVFSOverlay} = require('../ios-prebuild/vfs');
    const template = createVFSOverlay(reactNativeRoot);
    const resolved = resolveVFSOverlay(template, realXcfwPath);
    fs.writeFileSync(resolvedPath, resolved, 'utf8');
    logger.log('Generated VFS overlay (from podspecs)');
  }
  return true;
}

// ---------------------------------------------------------------------------
// Codegen + SPM template
// ---------------------------------------------------------------------------

/**
 * Runs React Native codegen and installs the SPM Package.swift template
 * into build/generated/ios/. Used by both setup-ios-spm.js and
 * sync-spm-autolinking.js.
 */
function runCodegenAndInstallTemplate(
  projectRoot /*: string */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: void */ {
  const scriptsDir = path.join(reactNativeRoot, 'scripts');
  const codegenScript = path.join(scriptsDir, 'generate-codegen-artifacts.js');
  if (!fs.existsSync(codegenScript)) {
    return;
  }

  logger.log('Running codegen...');
  const {execSync} = require('child_process');
  const codegenArgs =
    `node "${codegenScript}" -p "${projectRoot}" -t ios` +
    (projectRoot !== appRoot ? ` -o "${appRoot}"` : '');
  execSync(codegenArgs, {stdio: 'inherit', cwd: projectRoot});

  // Install SPM codegen template
  const codegenPkgSwift = path.join(appRoot, 'build', 'generated', 'ios', 'Package.swift');
  const spmTemplate = path.join(scriptsDir, 'codegen', 'templates', 'Package.swift.spm-template');
  if (fs.existsSync(spmTemplate) && fs.existsSync(path.dirname(codegenPkgSwift))) {
    fs.copyFileSync(spmTemplate, codegenPkgSwift);
    logger.log('Installed SPM codegen template');
  }
}

module.exports = {
  makeLogger,
  displayPath,
  defaultCacheDir,
  toSwiftName,
  deriveAppName,
  readPackageJson,
  findProjectRoot,
  resolveReactNativeRoot,
  resolveAndWriteVFSOverlay,
  runCodegenAndInstallTemplate,
};
