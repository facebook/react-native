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
  // Prefix every newline-separated line of the message so multi-line output
  // wraps cleanly when terminal log scrapers look for the `[name]` tag.
  function format(color /*: string */, msg /*: string */) /*: string */ {
    const prefix = `\x1b[${color}m[${name}]\x1b[0m`;
    return msg
      .split('\n')
      .map(line => `${prefix} ${line}`)
      .join('\n');
  }
  return {
    log(msg /*: string */) /*: void */ {
      console.log(format('32', msg));
    },
    warn(msg /*: string */) /*: void */ {
      console.warn(format('33', msg));
    },
    die(msg /*: string */) /*: empty */ {
      console.error(format('31', msg));
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

// Merged header tree path + the manifest snippet consuming targets use. One
// `-I rnHeaders` replaces the VFS overlay + xcfwHeaders/depsHeaders derivation;
// `-fno-implicit-module-maps` keeps nested <react/...> includes textual (not via
// the framework module copied into the build products dir).
const MERGED_HEADERS_REL = 'build/xcframeworks/ReactHeadersAll';
const REACT_HEADERS_LET = `let rnHeaders = appRoot + "/${MERGED_HEADERS_REL}"`;

function reactHeaderCFlags() /*: Array<string> */ {
  return ['"-I", rnHeaders'];
}
function reactHeaderCxxFlags() /*: Array<string> */ {
  return ['"-fno-implicit-module-maps"', '"-I", rnHeaders'];
}

/**
 * Materializes a single natural-layout merged header tree at
 * build/xcframeworks/ReactHeadersAll (returns its path, or null if the
 * xcframework / VFS template is missing). Replaces the per-app VFS overlay:
 * symlinks one canonical file per import path, then folds in the
 * ReactNativeDependencies, codegen, and autolinking headers, so consumers need
 * a single `-I <ReactHeadersAll>`. The React mapping is reused from the
 * React-VFS-template.yaml shipped inside React.xcframework (its `name` chain is
 * the authoritative virtual->physical map, incl. the no-`header_dir` prefix rule).
 */
function buildMergedHeaderTree(
  appRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: ?string */ {
  const xcfwDir = path.join(appRoot, 'build', 'xcframeworks');
  const reactXcfw = path.join(xcfwDir, 'React.xcframework');
  if (!fs.existsSync(reactXcfw)) {
    return null;
  }
  const realXcfw = fs.realpathSync(reactXcfw);
  const vfsTemplatePath = path.join(realXcfw, 'React-VFS-template.yaml');
  if (!fs.existsSync(vfsTemplatePath)) {
    logger.log(
      'No React-VFS-template.yaml in React.xcframework — skipping merged header tree',
    );
    return null;
  }

  const outDir = path.join(xcfwDir, 'ReactHeadersAll');
  fs.rmSync(outDir, {recursive: true, force: true});
  fs.mkdirSync(outDir, {recursive: true});

  // virtual import path -> realpath of the file we linked. First write wins, so
  // identical duplicates collapse to one inode; a differing realpath for the
  // same virtual path is a real collision worth surfacing (the merged set is
  // collision-free in practice).
  const seen /*: Map<string, string> */ = new Map();
  let collisions = 0;

  function linkInto(virtualPath /*: string */, physical /*: string */) /*: void */ {
    let real;
    try {
      real = fs.realpathSync(physical);
    } catch {
      return; // physical file missing — skip
    }
    const prev = seen.get(virtualPath);
    if (prev != null) {
      if (prev !== real) {
        collisions++;
        logger.log(
          `WARNING: merged headers: non-identical collision for ${virtualPath} (kept first)`,
        );
      }
      return;
    }
    seen.set(virtualPath, real);
    const dest = path.join(outDir, virtualPath);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.symlinkSync(real, dest);
  }

  // --- React headers: parse the VFS template's indentation tree ---
  const unquote = (s /*: string */) /*: string */ =>
    s.replace(/^['"]/, '').replace(/['"]$/, '');
  const template = fs
    .readFileSync(vfsTemplatePath, 'utf8')
    .split('${ROOT_PATH}')
    .join(realXcfw);
  const entries /*: Array<{indent: number, name: string, external: ?string}> */ =
    [];
  for (const line of template.split('\n')) {
    let m = line.match(/^(\s*)- name:\s*(.*)$/);
    if (m) {
      entries.push({indent: m[1].length, name: unquote(m[2].trim()), external: null});
      continue;
    }
    m = line.match(/^\s*external-contents:\s*(.*)$/);
    if (m && entries.length > 0) {
      entries[entries.length - 1].external = unquote(m[1].trim());
    }
  }
  const stack /*: Array<{indent: number, name: string}> */ = [];
  let rootPrefix /*: ?string */ = null;
  for (const e of entries) {
    while (stack.length > 0 && stack[stack.length - 1].indent >= e.indent) {
      stack.pop();
    }
    stack.push({indent: e.indent, name: e.name});
    const full = stack.map(s => s.name).join('/');
    if (rootPrefix == null && full.endsWith('/Headers')) {
      rootPrefix = full + '/';
    }
    const external = e.external;
    if (external != null && rootPrefix != null && full.startsWith(rootPrefix)) {
      linkInto(full.slice(rootPrefix.length), external);
    }
  }

  // --- Fold in the remaining include roots (first-wins, mirroring the former
  // -I order: autolinking, deps, generated/ios, ReactCodegen) ---
  function foldDir(srcRoot /*: string */) /*: void */ {
    let real;
    try {
      real = fs.realpathSync(srcRoot);
    } catch {
      return;
    }
    if (!fs.statSync(real).isDirectory()) {
      return;
    }
    const dirs /*: Array<string> */ = [real];
    while (dirs.length > 0) {
      const dir = dirs.pop();
      if (dir == null) {
        break;
      }
      for (const ent of fs.readdirSync(dir, {withFileTypes: true})) {
        const name = String(ent.name);
        const child = path.join(dir, name);
        // statSync (not the Dirent flags) so symlinks are followed — the
        // autolinking header farm is itself a symlink farm, so its leaf
        // headers are symlinks, not regular files.
        let st;
        try {
          st = fs.statSync(child);
        } catch {
          continue; // broken symlink — skip
        }
        if (st.isDirectory()) {
          dirs.push(child);
        } else if (
          st.isFile() &&
          (name.endsWith('.h') || name.endsWith('.hpp'))
        ) {
          linkInto(path.relative(real, child), child);
        }
      }
    }
  }

  // Host apps import React_RCTAppDelegate headers BARE (e.g.
  // `#import <RCTDefaultReactNativeFactoryDelegate.h>`), so expose them at the
  // root too (the old dedicated `-I .../React_RCTAppDelegate` absorbed here).
  foldDir(path.join(realXcfw, 'Headers', 'React_RCTAppDelegate'));

  foldDir(path.join(appRoot, 'build', 'generated', 'autolinking', 'headers'));
  const depsXcfw = path.join(xcfwDir, 'ReactNativeDependencies.xcframework');
  if (fs.existsSync(depsXcfw)) {
    foldDir(path.join(fs.realpathSync(depsXcfw), 'Headers'));
  }
  foldDir(path.join(appRoot, 'build', 'generated', 'ios'));
  foldDir(path.join(appRoot, 'build', 'generated', 'ios', 'ReactCodegen'));

  logger.log(
    `Built merged header tree (${seen.size} headers` +
      (collisions > 0 ? `, ${collisions} non-identical collisions` : '') +
      ')',
  );
  return outDir;
}

/**
 * Runs React Native codegen and installs the SPM Package.swift template
 * into build/generated/ios/. Used by both setup-apple-spm.js and
 * sync-spm-autolinking.js.
 */

/**
 * Installs the SPM codegen template into build/generated/ios/Package.swift.
 * No-op when the template or the generated/ios dir is missing — codegen
 * may not have produced output yet, or the project may be SPM-only.
 *
 * The template is copied verbatim: it references the merged header tree via a
 * stable `let rnHeaders = appRoot + "/build/xcframeworks/ReactHeadersAll"`, so
 * there are no cache-slot paths to substitute. The tree's symlink contents are
 * refreshed per slot by buildMergedHeaderTree, while the manifest text — and
 * thus SPM's manifest hash — stays constant.
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
  fs.writeFileSync(codegenPkgSwift, fs.readFileSync(spmTemplate, 'utf8'), 'utf8');
  logger.log('Installed SPM codegen template');
}

function runCodegenAndInstallTemplate(
  projectRoot /*: string */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
  opts /*: {installTemplate?: boolean} */ = {},
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
  // Callers that re-point the xcframework symlinks after codegen (e.g. the SPM
  // sync, which runs generate-spm-package afterwards) install the template
  // themselves once the symlinks are final; they pass installTemplate: false to
  // avoid a wasted write that the later install would immediately supersede.
  if (opts.installTemplate !== false) {
    installSpmCodegenTemplate(appRoot, reactNativeRoot, logger);
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
  buildMergedHeaderTree,
  REACT_HEADERS_LET,
  reactHeaderCFlags,
  reactHeaderCxxFlags,
  installSpmCodegenTemplate,
  runCodegenAndInstallTemplate,
};
