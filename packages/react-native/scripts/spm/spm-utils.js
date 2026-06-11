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
 * Canonical React Native binary cache root. Mirrors CocoaPods'
 * `ReactNativePodsUtils.shared_cache_dir()` (~/Library/Caches/ReactNative, added
 * in #56847) so SPM and CocoaPods share one cache root — and so SPM stops using
 * a `com.facebook.ReactNative` (bundle-id) dir that other tools may also touch.
 * Honor `RCT_SKIP_CACHES=1` (same env var as CocoaPods) to bypass the shared
 * tarball cache.
 */
function sharedCacheDir() /*: string */ {
  return path.join(os.homedir(), 'Library', 'Caches', 'ReactNative');
}

/**
 * Returns the default versioned cache directory for SPM's EXTRACTED xcframeworks,
 * nested under the canonical cache root. Downloaded tarballs themselves go in the
 * flat shared cache (sharedCacheDir()) so they are reused across SPM/CocoaPods.
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
  return path.join(sharedCacheDir(), 'spm-artifacts', versionKey, flavor);
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

// The header search-path tree is split into two roots, so consumers emit TWO
// `-I`s: the shared, app-independent RN-core/deps tree (`rnCoreHeaders`) and the
// per-app codegen/autolinking tree (`appHeaders`). Both are Swift `let`s emitted
// by renderRNPathsLoader (decoded from spm-paths.json at SPM-eval time).
// `-fno-implicit-module-maps` keeps nested <react/...> includes textual (not via
// the framework module copied into the build products dir). The shared `-I`
// precedes the per-app one to preserve the old single-tree first-wins precedence.
const SHARED_HEADERS_SUBDIR = 'ReactCoreHeaders';
const PER_APP_HEADERS_REL = 'build/xcframeworks/ReactAppHeaders';

// Marker at the top of a scaffolder-generated Package.swift. Lives here (not in
// scaffold-package-swift.js) so the autolinker can recognize scaffolded files
// without a circular import (scaffold-package-swift requires the autolinker).
const SCAFFOLDER_MARKER =
  '// AUTO-SCAFFOLDED by react-native spm scaffold — safe to edit & commit via patch-package.';

function reactHeaderCFlags() /*: Array<string> */ {
  return ['"-I", rnCoreHeaders, "-I", appHeaders'];
}
function reactHeaderCxxFlags() /*: Array<string> */ {
  return [
    '"-fno-implicit-module-maps"',
    '"-I", rnCoreHeaders, "-I", appHeaders',
  ];
}

// Absolute on-disk locations of the two header trees. Centralized so the tree
// builders and the spm-paths.json writers agree without re-deriving.
function sharedHeadersDir(
  projectRoot /*: string */,
  slotVersion /*: string */,
) /*: string */ {
  return path.join(
    projectRoot,
    '.react-native',
    'headers',
    slotVersion,
    SHARED_HEADERS_SUBDIR,
  );
}
function perAppHeadersDir(appRoot /*: string */) /*: string */ {
  return path.join(appRoot, PER_APP_HEADERS_REL);
}

// Per-app symlink (at <xcfwDir>/ReactCoreHeaders) to the shared RN-core tree,
// so the app target's pbxproj can reference it via a relocatable
// `$(SRCROOT)/build/xcframeworks/ReactCoreHeaders` (no machine-absolute paths
// committed in the project file). The shared tree itself is materialized once at
// the repo root; this is just a lightweight link.
function ensureSymlink(
  linkPath /*: string */,
  target /*: string */,
) /*: void */ {
  try {
    fs.rmSync(linkPath, {recursive: true, force: true});
  } catch {}
  fs.mkdirSync(path.dirname(linkPath), {recursive: true});
  fs.symlinkSync(target, linkPath);
}

/**
 * Renders the inlined Swift loader that every generated build-dir manifest
 * (aggregator, synth wrapper, codegen template) emits to read the per-app
 * spm-paths.json. `relPath` is the manifest's directory-relative path to the
 * `build/generated/autolinking/` dir that holds spm-paths.json ("" for the
 * aggregator, "../.." for a synth wrapper, "../autolinking" for codegen).
 *
 * Because the absolute paths live in the JSON and not in the manifest text, the
 * manifest is machine-independent and its SPM manifest hash stays stable across
 * machines and cache slots. File reads during manifest evaluation are supported
 * by SPM (the scaffolder already walks the filesystem at eval time).
 */
function renderRNPathsLoader(relPath /*: string */) /*: string */ {
  const rel = relPath === '' ? '' : `${relPath}/`;
  return `let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path

// Single source of truth for React Native header search paths (spm-paths.json,
// written by \`npx react-native spm\`). Read here so this manifest's text holds
// no absolute paths.
struct RNSpmPaths: Decodable {
    let formatVersion: Int
    let appRoot: String
    let rnCoreHeaders: String
    let appHeaders: String
}
let rnSpmPaths: RNSpmPaths = {
    let url = URL(fileURLWithPath: packageDir + "/${rel}spm-paths.json").standardized
    guard let data = try? Data(contentsOf: url),
          let decoded = try? JSONDecoder().decode(RNSpmPaths.self, from: data) else {
        fatalError("React Native SPM: cannot read \\(url.path). Run 'npx react-native spm' to (re)generate it.")
    }
    precondition(
        decoded.formatVersion == 1,
        "React Native SPM: spm-paths.json formatVersion \\(decoded.formatVersion) is unsupported (expected 1). Upgrade react-native or re-run 'npx react-native spm'."
    )
    return decoded
}()
let appRoot = rnSpmPaths.appRoot
let rnCoreHeaders = rnSpmPaths.rnCoreHeaders
let appHeaders = rnSpmPaths.appHeaders`;
}

/**
 * Creates a first-wins symlink linker rooted at `outDir`. `linkInto` maps a
 * virtual import path to a physical file; `foldDir` recursively links every
 * .h/.hpp under a source root. `seen` records virtual->realpath so identical
 * duplicates collapse to one inode and non-identical collisions are surfaced.
 * Each header tree gets its OWN linker (own `seen` map) so first-wins does not
 * span the shared/per-app boundary.
 */
function createHeaderLinker(
  outDir /*: string */,
  logger /*: {log: (msg: string) => void} */,
) /*: {
  seen: Map<string, string>,
  stats: {collisions: number},
  linkInto: (virtualPath: string, physical: string) => void,
  foldDir: (srcRoot: string) => void,
} */ {
  const seen /*: Map<string, string> */ = new Map();
  const stats = {collisions: 0};

  function linkInto(
    virtualPath /*: string */,
    physical /*: string */,
  ) /*: void */ {
    let real;
    try {
      real = fs.realpathSync(physical);
    } catch {
      return; // physical file missing — skip
    }
    const prev = seen.get(virtualPath);
    if (prev != null) {
      if (prev !== real) {
        stats.collisions++;
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

  return {seen, stats, linkInto, foldDir};
}

/**
 * Resolves React.xcframework + its VFS template under `xcfwDir` (the per-app
 * build/xcframeworks dir, whose React.xcframework is a symlink into the global
 * artifact cache). Returns null if either is missing.
 */
function resolveReactXcframework(
  xcfwDir /*: string */,
  logger /*: {log: (msg: string) => void} */,
) /*: ?{realXcfw: string, vfsTemplatePath: string} */ {
  const reactXcfw = path.join(xcfwDir, 'React.xcframework');
  if (!fs.existsSync(reactXcfw)) {
    return null;
  }
  const realXcfw = fs.realpathSync(reactXcfw);
  const vfsTemplatePath = path.join(realXcfw, 'React-VFS-template.yaml');
  if (!fs.existsSync(vfsTemplatePath)) {
    logger.log(
      'No React-VFS-template.yaml in React.xcframework — skipping shared header tree',
    );
    return null;
  }
  return {realXcfw, vfsTemplatePath};
}

/**
 * Links the React headers described by React-VFS-template.yaml into `linker`.
 * The template's `name` chain is the authoritative virtual->physical map (incl.
 * the no-`header_dir` prefix rule).
 */
function linkReactVfsHeaders(
  linker /*: {linkInto: (v: string, p: string) => void, ...} */,
  realXcfw /*: string */,
  vfsTemplatePath /*: string */,
) /*: void */ {
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
      entries.push({
        indent: m[1].length,
        name: unquote(m[2].trim()),
        external: null,
      });
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
      linker.linkInto(full.slice(rootPrefix.length), external);
    }
  }
}

/*::
type HeaderTreeResult = {path: ?string, virtualPaths: Set<string>};
*/

/**
 * Materializes the APP-INDEPENDENT React-core/deps header tree at
 * <projectRoot>/.react-native/headers/<slotVersion>/ReactCoreHeaders: the React
 * VFS-template headers, the bare React_RCTAppDelegate headers, and the
 * ReactNativeDependencies headers — all sourced from the globally-cached
 * xcframeworks, so the tree is identical for every app on a given slot.
 *
 * Always rebuilt fresh, and ALL prior slot dirs are pruned first, so an updated
 * react-native (new tooling / new artifact layout) reliably re-materializes the
 * tree — no stale tree survives behind a sentinel, and old slots don't pile up.
 * The tree is symlinks, so a rebuild is cheap. Returns {path, virtualPaths}
 * (path null if no xcfw).
 */
function buildSharedReactCoreHeaderTree(
  projectRoot /*: string */,
  slotVersion /*: string */,
  xcfwDir /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: HeaderTreeResult */ {
  const resolved = resolveReactXcframework(xcfwDir, logger);
  if (resolved == null) {
    return {path: null, virtualPaths: new Set()};
  }
  const outDir = sharedHeadersDir(projectRoot, slotVersion);
  // This app's relocatable link into the tree, so the pbxproj can reference
  // `$(SRCROOT)/build/xcframeworks/ReactCoreHeaders`.
  const appLink = path.join(xcfwDir, 'ReactCoreHeaders');
  // Prune every prior slot (the whole headers/ dir), then rebuild the current
  // slot — guarantees freshness after an RN update and prevents accumulation.
  const headersRoot = path.join(projectRoot, '.react-native', 'headers');
  fs.rmSync(headersRoot, {recursive: true, force: true});
  fs.mkdirSync(outDir, {recursive: true});

  const linker = createHeaderLinker(outDir, logger);
  linkReactVfsHeaders(linker, resolved.realXcfw, resolved.vfsTemplatePath);
  // Host apps import React_RCTAppDelegate headers BARE (e.g.
  // `#import <RCTDefaultReactNativeFactoryDelegate.h>`), so expose them at root.
  linker.foldDir(
    path.join(resolved.realXcfw, 'Headers', 'React_RCTAppDelegate'),
  );
  const depsXcfw = path.join(xcfwDir, 'ReactNativeDependencies.xcframework');
  if (fs.existsSync(depsXcfw)) {
    linker.foldDir(path.join(fs.realpathSync(depsXcfw), 'Headers'));
  }
  ensureSymlink(appLink, outDir);

  logger.log(
    `Built shared RN-core header tree (${linker.seen.size} headers` +
      (linker.stats.collisions > 0
        ? `, ${linker.stats.collisions} non-identical collisions`
        : '') +
      ')',
  );
  return {path: outDir, virtualPaths: new Set(linker.seen.keys())};
}

/**
 * Materializes the PER-APP header tree at
 * <appRoot>/build/xcframeworks/ReactAppHeaders: autolinking dep headers + codegen
 * output. Per-app because it depends on which libraries the app links and the
 * app's generated specs. Returns {path, virtualPaths}.
 */
function buildPerAppHeaderTree(
  appRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: HeaderTreeResult */ {
  const outDir = perAppHeadersDir(appRoot);
  fs.rmSync(outDir, {recursive: true, force: true});
  fs.mkdirSync(outDir, {recursive: true});

  const linker = createHeaderLinker(outDir, logger);
  linker.foldDir(
    path.join(appRoot, 'build', 'generated', 'autolinking', 'headers'),
  );
  linker.foldDir(path.join(appRoot, 'build', 'generated', 'ios'));
  linker.foldDir(
    path.join(appRoot, 'build', 'generated', 'ios', 'ReactCodegen'),
  );

  logger.log(
    `Built per-app header tree (${linker.seen.size} headers` +
      (linker.stats.collisions > 0
        ? `, ${linker.stats.collisions} non-identical collisions`
        : '') +
      ')',
  );
  return {path: outDir, virtualPaths: new Set(linker.seen.keys())};
}

/**
 * Surfaces virtual paths present in BOTH trees. The split flips one inner
 * ordering vs the old single tree (autolinking was folded before deps); the
 * shared `-I` now precedes the per-app `-I`, so a shadowed header resolves from
 * the shared tree. Logged as telemetry — the merged set is collision-free in
 * practice. No-op when either keyset is unavailable (e.g. shared-tree skip).
 */
function logCrossTreeShadows(
  sharedResult /*: HeaderTreeResult */,
  perAppResult /*: HeaderTreeResult */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: void */ {
  if (
    sharedResult.virtualPaths.size === 0 ||
    perAppResult.virtualPaths.size === 0
  ) {
    return;
  }
  let shadows = 0;
  for (const k of perAppResult.virtualPaths) {
    if (sharedResult.virtualPaths.has(k)) {
      shadows++;
      if (shadows <= 10) {
        logger.log(
          `NOTE: header in both shared and per-app trees: ${k} (shared -I wins)`,
        );
      }
    }
  }
  if (shadows > 0) {
    logger.log(
      `Cross-tree header shadows: ${shadows} (shared RN-core -I precedes per-app -I)`,
    );
  }
}

/**
 * Writes the PER-APP single-source-of-truth spm-paths.json. Generated build-dir
 * manifests read it at SPM-eval time for the two `-I` header roots. Paths are
 * deterministic (not gated on tree materialization) so the file always exists
 * for the manifest loader after setup/sync. Holds machine-absolute paths.
 */
function writeAppPathsJson(
  appRoot /*: string */,
  projectRoot /*: string */,
  slotVersion /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: void */ {
  const outDir = path.join(appRoot, 'build', 'generated', 'autolinking');
  fs.mkdirSync(outDir, {recursive: true});
  const json = {
    formatVersion: 1,
    appRoot,
    rnCoreHeaders: sharedHeadersDir(projectRoot, slotVersion),
    appHeaders: perAppHeadersDir(appRoot),
    // The generated ReactNative binary-target package (React/Hermes/deps
    // xcframeworks). Provided so consumer manifests can `.package(path:)` it
    // without hardcoding the build/xcframeworks layout.
    reactNativePackage: path.join(appRoot, 'build', 'xcframeworks'),
    cxxStd: 'c++20',
  };
  fs.writeFileSync(
    path.join(outDir, 'spm-paths.json'),
    JSON.stringify(json, null, 2) + '\n',
    'utf8',
  );
  logger.log('Wrote spm-paths.json');
}

/**
 * Writes the APP-INDEPENDENT repo-root .react-native/paths.json that
 * hand-authored community Package.swift files read (via nearest-ancestor walk)
 * for the shared RN-core `-I`. Holds machine-absolute paths — must be gitignored.
 */
function writeSharedPathsJson(
  projectRoot /*: string */,
  slotVersion /*: string */,
  reactNativeVersion /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: void */ {
  const outDir = path.join(projectRoot, '.react-native');
  fs.mkdirSync(outDir, {recursive: true});
  // Self-ignoring .gitignore: the whole .react-native/ dir is generated,
  // machine-specific build state. A folder-local `*` keeps it out of git in
  // every layout (single-app or monorepo, where .react-native/ sits at the
  // project root above the app's own .gitignore). `*` also ignores this file
  // itself, so the dir disappears from git entirely.
  fs.writeFileSync(path.join(outDir, '.gitignore'), '*\n', 'utf8');
  const json = {
    formatVersion: 1,
    rnCoreHeaders: sharedHeadersDir(projectRoot, slotVersion),
    reactNativeVersion,
    cacheSlot: slotVersion,
  };
  fs.writeFileSync(
    path.join(outDir, 'paths.json'),
    JSON.stringify(json, null, 2) + '\n',
    'utf8',
  );
  logger.log('Wrote .react-native/paths.json');
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
 * The template is copied verbatim: it embeds the renderRNPathsLoader block,
 * which reads the two header-tree paths from spm-paths.json at SPM-eval time, so
 * there are no absolute/cache-slot paths in the manifest text to substitute. The
 * trees are refreshed per slot by the split header builders, while the manifest
 * text — and thus SPM's manifest hash — stays constant.
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
  fs.writeFileSync(
    codegenPkgSwift,
    fs.readFileSync(spmTemplate, 'utf8'),
    'utf8',
  );
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
  sharedCacheDir,
  defaultCacheDir,
  toSwiftName,
  deriveAppName,
  readPackageJson,
  findProjectRoot,
  resolveReactNativeRoot,
  buildSharedReactCoreHeaderTree,
  buildPerAppHeaderTree,
  logCrossTreeShadows,
  writeAppPathsJson,
  writeSharedPathsJson,
  renderRNPathsLoader,
  reactHeaderCFlags,
  reactHeaderCxxFlags,
  installSpmCodegenTemplate,
  runCodegenAndInstallTemplate,
  SCAFFOLDER_MARKER,
};
