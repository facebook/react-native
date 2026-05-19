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

/**
 * Sanitize a package/app name to a valid Swift identifier.
 * e.g. "@react-native/tester" -> "RNTester", "my-app" -> "MyApp"
 */
function toSwiftName(name /*: string */) /*: string */ {
  const base = name.replace(/^@[^/]+\//, '');
  return base
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

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
  const start = path.resolve(startDir);
  let dir = start;
  // Bounded by filesystem depth — path.dirname converges to '/' or 'C:\\'.
  // The `dir = ...` updates would otherwise drop the start-fallback narrowing.
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // At filesystem root — last check before falling back.
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }
  return start;
}

/**
 * Resolve the react-native package root from an app directory.
 * Checks appRoot/projectRoot and their ancestors for node_modules/react-native,
 * then falls back to __dirname-relative resolution (monorepo layout).
 *
 * Returns null if react-native cannot be found.
 */
function resolveReactNativeRoot(
  appRoot /*: string */,
  projectRoot /*: string */,
) /*: string | null */ {
  const candidates /*: Array<string> */ = [];
  const seen /*: Set<string> */ = new Set();

  function addAncestorCandidates(startDir /*: string */) /*: void */ {
    let dir = path.resolve(startDir);
    while (true) {
      const candidate = path.join(dir, 'node_modules', 'react-native');
      if (!seen.has(candidate)) {
        seen.add(candidate);
        candidates.push(candidate);
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }

  addAncestorCandidates(appRoot);
  addAncestorCandidates(projectRoot);
  candidates.push(path.resolve(__dirname, '../..'));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }
  return null;
}

/**
 * Resolves the VFS overlay for React.xcframework and writes it to
 * build/xcframeworks/React-VFS.yaml. Substitutes the ${ROOT_PATH}
 * placeholder in the template (produced at xcframework build time by
 * scripts/ios-prebuild/vfs.js) with the xcframework's on-disk path.
 *
 * Returns true if the overlay was written, false otherwise.
 */
function resolveAndWriteVFSOverlay(
  appRoot /*: string */,
  _reactNativeRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: boolean */ {
  const xcfwPath = path.join(
    appRoot,
    'build',
    'xcframeworks',
    'React.xcframework',
  );
  if (!fs.existsSync(xcfwPath)) {
    return false;
  }
  const realXcfwPath = fs.realpathSync(xcfwPath);
  const vfsTemplatePath = path.join(realXcfwPath, 'React-VFS-template.yaml');
  if (!fs.existsSync(vfsTemplatePath)) {
    logger.log(
      'No React-VFS-template.yaml in React.xcframework — skipping VFS overlay',
    );
    return false;
  }
  const resolvedPath = path.join(
    appRoot,
    'build',
    'xcframeworks',
    'React-VFS.yaml',
  );
  const template = fs.readFileSync(vfsTemplatePath, 'utf8');
  fs.writeFileSync(
    resolvedPath,
    template.split('${ROOT_PATH}').join(realXcfwPath),
    'utf8',
  );
  logger.log('Resolved VFS overlay (from template)');
  return true;
}

/**
 * Runs React Native codegen and installs the SPM Package.swift template
 * into build/generated/ios/. Used by both setup-apple-spm.js and
 * sync-spm-autolinking.js.
 */

/**
 * Substitutes placeholders in the SPM codegen template before writing it.
 *
 * `__SPM_XCFW_HEADERS_EXPR__` and `__SPM_DEPS_HEADERS_EXPR__` become absolute
 * string literals when the cache-slot symlinks resolve at install time, and
 * the runtime `URL(...).resolvingSymlinksInPath()...` expression otherwise.
 * Baking the absolute slot path bumps SPM's manifest hash on every slot
 * change — without it the cached evaluation sticks on the prior slot and
 * ReactCodegen compiles against stale headers.
 */
function renderCodegenTemplate(
  template /*: string */,
  appRoot /*: string */,
) /*: string */ {
  function resolveHeadersAbsolute(name /*: string */) /*: string | null */ {
    const symlinkPath = path.join(appRoot, 'build', 'xcframeworks', name);
    try {
      return fs.realpathSync(symlinkPath) + '/Headers';
    } catch {
      return null;
    }
  }
  const xcfwAbs = resolveHeadersAbsolute('React.xcframework');
  const depsAbs = resolveHeadersAbsolute('ReactNativeDependencies.xcframework');
  const xcfwExpr =
    xcfwAbs != null
      ? `"${xcfwAbs}"`
      : 'URL(fileURLWithPath: appRoot + "/build/xcframeworks/React.xcframework").resolvingSymlinksInPath().path + "/Headers"';
  const depsExpr =
    depsAbs != null
      ? `"${depsAbs}"`
      : 'URL(fileURLWithPath: appRoot + "/build/xcframeworks/ReactNativeDependencies.xcframework").resolvingSymlinksInPath().path + "/Headers"';
  return template
    .replace('__SPM_XCFW_HEADERS_EXPR__', xcfwExpr)
    .replace('__SPM_DEPS_HEADERS_EXPR__', depsExpr);
}

/**
 * Renders the SPM codegen template into build/generated/ios/Package.swift.
 * No-op when the template or the generated/ios dir is missing — codegen
 * may not have produced output yet, or the project may be SPM-only.
 */
function installSpmCodegenTemplate(
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: void */ {
  const spmTemplate = path.join(
    reactNativeRoot,
    'scripts',
    'codegen',
    'templates',
    'Package.swift.spm-template',
  );
  const codegenPkgSwift = path.join(
    appRoot,
    'build',
    'generated',
    'ios',
    'Package.swift',
  );
  if (
    !fs.existsSync(spmTemplate) ||
    !fs.existsSync(path.dirname(codegenPkgSwift))
  ) {
    return;
  }
  const rendered = renderCodegenTemplate(
    fs.readFileSync(spmTemplate, 'utf8'),
    appRoot,
  );
  fs.writeFileSync(codegenPkgSwift, rendered, 'utf8');
  logger.log('Installed SPM codegen template');
}

function runCodegenAndInstallTemplate(
  projectRoot /*: string */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: void */ {
  const codegenScript = path.join(
    reactNativeRoot,
    'scripts',
    'generate-codegen-artifacts.js',
  );
  if (!fs.existsSync(codegenScript)) {
    return;
  }
  logger.log('Running codegen...');
  const {execSync} = require('child_process');
  const codegenArgs =
    `node "${codegenScript}" -p "${projectRoot}" -t ios` +
    (projectRoot !== appRoot ? ` -o "${appRoot}"` : '');
  execSync(codegenArgs, {stdio: 'inherit', cwd: projectRoot});
  installSpmCodegenTemplate(appRoot, reactNativeRoot, logger);
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
  renderCodegenTemplate,
  installSpmCodegenTemplate,
  runCodegenAndInstallTemplate,
};
