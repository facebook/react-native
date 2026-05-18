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

/*:: import type {PodspecModel} from './spm-types'; */

/**
 * read-podspec.js — produces a flattened, SPM-friendly view of an iOS
 * podspec for the scaffolder.
 *
 * Strategy: prefer `pod ipc spec <path>` (CocoaPods evaluates the Ruby DSL,
 * including `install_modules_dependencies(s)` and `$config[:...]`
 * interpolation, so the JSON output reflects the real spec). Fall back to a
 * best-effort regex parser when CocoaPods isn't available — handles simple
 * RN libs but skips subspec blocks and Ruby helpers with a warning.
 *
 * The output `PodspecModel` collapses the spec's default subspecs into a
 * single logical target view, since that's how RN consumers compile these
 * libraries in practice.
 */

const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

/*::
type RawSpec = {[string]: mixed};
*/

// ---------------------------------------------------------------------------
// Pod-IPC primary path
// ---------------------------------------------------------------------------

/**
 * Runs `pod ipc spec <path>` and parses the JSON it prints. Returns null
 * on any failure: CocoaPods missing, command threw, output not JSON, etc.
 * Callers should treat null as a signal to fall back to the regex parser.
 */
/**
 * Strips RN-specific Ruby helpers from a podspec source so `pod ipc spec`
 * can evaluate it without RN's Podfile-side helpers loaded. The stripped
 * helpers (`install_modules_dependencies(s)`) typically inject the React-Core
 * / React-Fabric family — all of which the scaffolder collapses into the
 * single `ReactNative` product anyway, so dropping them is safe as long as
 * the podspec also has an explicit `s.dependency "React-Core"` (almost all
 * RN libs do). Writes the patched content to a temp file and returns its
 * path; caller deletes when done.
 */
function patchPodspecForPodIpc(podspecPath /*: string */) /*: string */ {
  const content = fs.readFileSync(podspecPath, 'utf8');
  // Comment out RN-Podfile-only helpers. We do NOT remove the lines so
  // line numbers in any pod ipc errors still match the original file.
  const patched = content
    .replace(
      /^(\s*)install_modules_dependencies\(([^)]*)\)/gm,
      '$1# install_modules_dependencies($2) # stripped for pod ipc',
    )
    .replace(
      /^(\s*)use_react_native!\(([^)]*)\)/gm,
      '$1# use_react_native!($2) # stripped for pod ipc',
    );
  // Write the patched copy NEXT TO the original podspec, not in os.tmpdir.
  // Podspecs commonly do `File.read(File.join(__dir__, 'package.json'))` or
  // similar, expecting the package.json sibling. Keeping the patched file
  // in the same directory makes those reads continue to work.
  const depDir = path.dirname(podspecPath);
  // pod ipc only accepts files ending in `.podspec` or `.podspec.json`.
  // Use a dotfile prefix so the patched copy is invisible to normal listing
  // but the suffix CocoaPods requires is preserved.
  const tmpFile = path.join(
    depDir,
    `.spm-scaffold-${process.pid}-${path.basename(podspecPath)}`,
  );
  fs.writeFileSync(tmpFile, patched, 'utf8');
  return tmpFile;
}

function runPodIpcSpec(podspecPath /*: string */) /*: RawSpec | null */ {
  // RN podspecs often call `install_modules_dependencies(s)`, a helper
  // defined by RN's Podfile-side scripts. `pod ipc spec` doesn't load
  // those, so the helper is undefined and the whole spec fails to parse.
  // Pre-process to strip those calls before invoking pod ipc.
  let patchedPath /*: ?string */ = null;
  try {
    patchedPath = patchPodspecForPodIpc(podspecPath);
  } catch {
    return null;
  }
  let result;
  try {
    result = spawnSync('pod', ['ipc', 'spec', patchedPath], {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 8 * 1024 * 1024,
      // Many RN podspecs gate subspec definitions on `RCT_NEW_ARCH_ENABLED`
      // (e.g. safe-area-context wraps its Fabric `common` + `fabric`
      // subspecs in `if fabric_enabled`). RN 0.76+ defaults to the new
      // architecture, so unless the caller has explicitly opted out, set
      // the env var here so `pod ipc spec` evaluates the full podspec.
      env: {
        ...process.env,
        RCT_NEW_ARCH_ENABLED: process.env.RCT_NEW_ARCH_ENABLED ?? '1',
      },
    });
  } catch {
    cleanupPatchedPodspec(patchedPath);
    return null;
  }
  cleanupPatchedPodspec(patchedPath);
  if (result == null || result.error != null) {
    return null;
  }
  if (typeof result.status !== 'number' || result.status !== 0) {
    return null;
  }
  if (typeof result.stdout !== 'string' || result.stdout.length === 0) {
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

function cleanupPatchedPodspec(patchedPath /*: ?string */) /*: void */ {
  if (patchedPath == null) return;
  try {
    fs.unlinkSync(patchedPath);
  } catch {
    // best-effort cleanup; the file is named with `.spm-scaffold-...tmp`
    // so a leftover is identifiable.
  }
}

// ---------------------------------------------------------------------------
// Regex fallback
// ---------------------------------------------------------------------------

/**
 * Best-effort Ruby podspec parser. Extracts the literal-string and
 * literal-array fields most RN libs use. Skips subspec blocks, Ruby helper
 * calls (install_modules_dependencies, ENV[], $config[:...]), and
 * interpolation — appends a warning so the caller can surface it to the
 * user. Always returns a RawSpec; pure-JS, no Ruby dep required.
 */
function regexPodspec(podspecPath /*: string */) /*: RawSpec */ {
  const content = fs.readFileSync(podspecPath, 'utf8');
  const warnings /*: Array<string> */ = [];

  // Matches:  s.<field> = "value"   or   s.<field> = 'value'
  function getStringField(name /*: string */) /*: string | null */ {
    const re = new RegExp(`(?:s|spec)\\.${name}\\s*=\\s*["']([^"']+)["']`);
    const m = content.match(re);
    return m ? m[1] : null;
  }

  // Matches:
  //   s.<field> = ["a", "b"]            (array)
  //   s.<field> = "single"              (single value treated as 1-element array)
  function getArrayField(name /*: string */) /*: Array<string> */ {
    const reArr = new RegExp(`(?:s|spec)\\.${name}\\s*=\\s*\\[([^\\]]*)\\]`);
    const mArr = content.match(reArr);
    if (mArr != null) {
      const inner = mArr[1];
      const out /*: Array<string> */ = [];
      const itemRe = /["']([^"']+)["']/g;
      while (true) {
        const m = itemRe.exec(inner);
        if (m == null) break;
        out.push(m[1]);
      }
      return out;
    }
    const single = getStringField(name);
    return single != null ? [single] : [];
  }

  // Matches:  s.dependency "Name"  (with optional version constraint)
  function getDependencies() /*: Array<string> */ {
    const out /*: Array<string> */ = [];
    const re = /(?:s|spec)\.dependency\s+["']([^"']+)["']/g;
    while (true) {
      const m = re.exec(content);
      if (m == null) break;
      out.push(m[1]);
    }
    return out;
  }

  // Matches:
  //   s.framework "X"          → ["X"]
  //   s.framework = "X"        → ["X"]
  //   s.frameworks = ["X","Y"] → ["X","Y"]
  function getFrameworks(weak /*: boolean */) /*: Array<string> */ {
    const prefix = weak ? 'weak_framework' : 'framework';
    const out /*: Array<string> */ = [];
    // Plural form: s.frameworks = [...] or s.frameworks = "Foo"
    out.push(...getArrayField(`${prefix}s`));
    // Singular form: s.framework = "Foo" — single value treated as a 1-elem list
    out.push(...getArrayField(prefix));
    // Method-call form: s.framework "Foo", "Bar" — no `=`. `getArrayField`
    // only matches assignment, so handle this case separately.
    const callRe = new RegExp(
      `(?:s|spec)\\.${prefix}s?\\s+((?:["'][^"']+["']\\s*,?\\s*)+)`,
      'g',
    );
    while (true) {
      const m = callRe.exec(content);
      if (m == null) break;
      const itemRe = /["']([^"']+)["']/g;
      while (true) {
        const im = itemRe.exec(m[1]);
        if (im == null) break;
        out.push(im[1]);
      }
    }
    return Array.from(new Set(out));
  }

  // Matches:  'HEADER_SEARCH_PATHS' => '...'   or  => ["...","..."]
  // Returns the raw token strings (still containing $(PODS_TARGET_SRCROOT)
  // etc.); substitution happens at translation time.
  function getHeaderSearchPaths() /*: Array<string> */ {
    const out /*: Array<string> */ = [];
    // Array form
    const arrRe = /["']HEADER_SEARCH_PATHS["']\s*=>\s*\[([\s\S]*?)\]/g;
    while (true) {
      const m = arrRe.exec(content);
      if (m == null) break;
      const itemRe = /["']((?:[^"'\\]|\\.)+)["']/g;
      while (true) {
        const im = itemRe.exec(m[1]);
        if (im == null) break;
        // Each entry can be a single path or a space-separated list of paths.
        for (const token of im[1].split(/\s+/)) {
          if (token.length > 0) {
            out.push(stripWrappingQuotes(token));
          }
        }
      }
    }
    // String form
    const strRe =
      /["']HEADER_SEARCH_PATHS["']\s*=>\s*["']((?:[^"'\\]|\\.)+)["']/g;
    while (true) {
      const m = strRe.exec(content);
      if (m == null) break;
      for (const token of m[1].split(/\s+/)) {
        if (token.length > 0) {
          out.push(stripWrappingQuotes(token));
        }
      }
    }
    return Array.from(new Set(out));
  }

  // Surface known unparseable constructs so the caller can warn the user.
  if (/(?:s|spec)\.subspec\s+["']/.test(content)) {
    warnings.push(
      'Subspecs detected — regex parser only extracts top-level fields. Install CocoaPods (`gem install cocoapods`) to enable full `pod ipc spec` parsing.',
    );
  }
  if (/install_modules_dependencies/.test(content)) {
    warnings.push(
      '`install_modules_dependencies(s)` detected — dependency wiring may be incomplete without CocoaPods.',
    );
  }
  if (/\bENV\[/.test(content) || /\$config\[/.test(content)) {
    warnings.push(
      'Env-var or Ruby-config interpolation detected — values may not translate cleanly without CocoaPods.',
    );
  }

  return {
    name: getStringField('name'),
    version: getStringField('version'),
    source_files: getArrayField('source_files'),
    public_header_files: getArrayField('public_header_files'),
    private_header_files: getArrayField('private_header_files'),
    exclude_files: getArrayField('exclude_files'),
    header_mappings_dir: getStringField('header_mappings_dir'),
    header_dir: getStringField('header_dir'),
    frameworks: getFrameworks(false),
    weak_frameworks: getFrameworks(true),
    libraries: getArrayField('libraries'),
    dependencies: getDependencies(),
    compiler_flags: tokenizeFlags(getStringField('compiler_flags')),
    pod_target_xcconfig: {HEADER_SEARCH_PATHS: getHeaderSearchPaths()},
    resources: getArrayField('resources'),
    requires_arc: /(?:s|spec)\.requires_arc\s*=\s*true/.test(content),
    __regex_partial__: true,
    __warnings__: warnings,
  };
}

// Strips outer quote-like characters from a captured token. Handles bare
// quotes (`"foo"`, `'foo'`) AND Ruby-escaped quotes (`\"foo\"`) which show
// up verbatim when the regex captures something like
// `"HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/x\""`.
function stripWrappingQuotes(s /*: string */) /*: string */ {
  return s.replace(/^\\?["']/, '').replace(/\\?["']$/, '');
}

function tokenizeFlags(value /*: string | null */) /*: Array<string> */ {
  if (value == null) return [];
  return value.split(/\s+/).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Subspec flattening
// ---------------------------------------------------------------------------

/**
 * Merges a podspec's default subspecs (or all subspecs when no defaults are
 * declared) into a single logical view. RN libraries use subspecs for
 * platform/feature gating (`apple` vs `common`); consumers compile the
 * union anyway, so the flat view matches the actual build.
 *
 * Merge rules:
 *   - Array fields  → concat + dedup
 *   - String fields → top-level wins; if absent, take the first subspec's value
 *   - pod_target_xcconfig HEADER_SEARCH_PATHS → array-union across all selected subspecs
 *   - dependencies  → array-union of name strings (version constraints dropped)
 */
function flattenSubspecs(rawSpec /*: RawSpec */) /*: PodspecModel */ {
  const warnings /*: Array<string> */ = [];
  // $FlowFixMe[prop-missing] dynamic shape
  const partial /*: boolean */ = rawSpec.__regex_partial__ === true;
  if (Array.isArray(rawSpec.__warnings__)) {
    // $FlowFixMe[incompatible-type] runtime-validated dynamic shape
    const rawWarnings /*: $ReadOnlyArray<string> */ = rawSpec.__warnings__;
    for (const w of rawWarnings) {
      warnings.push(w);
    }
  }

  // Determine which subspecs to merge. pod ipc returns:
  //   - `subspecs`: array of nested specs (or undefined)
  //   - `default_subspecs`: array of names (or undefined → use all subspecs)
  const subspecs = Array.isArray(rawSpec.subspecs) ? rawSpec.subspecs : [];
  let selected = subspecs;
  if (Array.isArray(rawSpec.default_subspecs)) {
    const wanted = new Set(rawSpec.default_subspecs);
    selected = subspecs.filter(s => {
      // $FlowFixMe[prop-missing] dynamic shape
      const name = s != null && typeof s.name === 'string' ? s.name : null;
      return name != null && wanted.has(name);
    });
  }
  const layers = [rawSpec, ...selected];

  function mergeArrayField(key /*: string */) /*: Array<string> */ {
    const out /*: Array<string> */ = [];
    for (const layer of layers) {
      // $FlowFixMe[incompatible-use] layer narrowed from `mixed`; runtime-validated below
      const value = layer != null ? layer[key] : null;
      if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === 'string') out.push(v);
        }
      } else if (typeof value === 'string') {
        out.push(value);
      }
    }
    return Array.from(new Set(out));
  }

  function mergeStringField(key /*: string */) /*: string | null */ {
    for (const layer of layers) {
      // $FlowFixMe[incompatible-use] layer narrowed from `mixed`; runtime-validated below
      const value = layer != null ? layer[key] : null;
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
    return null;
  }

  function mergeHeaderSearchPaths() /*: Array<string> */ {
    const out /*: Array<string> */ = [];
    for (const layer of layers) {
      // $FlowFixMe[incompatible-use] layer narrowed from `mixed`; runtime-validated below
      const xc =
        layer != null && typeof layer === 'object'
          ? layer.pod_target_xcconfig
          : null;
      if (xc == null || typeof xc !== 'object') continue;
      // $FlowFixMe[incompatible-use] xc narrowed from `mixed`; HEADER_SEARCH_PATHS access is intentional
      const hsp = xc.HEADER_SEARCH_PATHS;
      if (typeof hsp === 'string') {
        // Single string — split on whitespace, strip quotes
        for (const tok of hsp.split(/\s+/)) {
          if (tok.length > 0) out.push(stripWrappingQuotes(tok));
        }
      } else if (Array.isArray(hsp)) {
        for (const v of hsp) {
          if (typeof v !== 'string') continue;
          for (const tok of v.split(/\s+/)) {
            if (tok.length > 0) out.push(stripWrappingQuotes(tok));
          }
        }
      }
    }
    return Array.from(new Set(out));
  }

  function mergeDependencies() /*: Array<string> */ {
    const out /*: Array<string> */ = [];
    for (const layer of layers) {
      // $FlowFixMe[incompatible-use] layer narrowed from `mixed`; runtime-validated below
      const deps = layer != null ? layer.dependencies : null;
      if (deps == null) continue;
      // pod ipc returns deps as: {name: [versionConstraint, ...], ...}
      // regex returns deps as: [name, name, ...]
      if (Array.isArray(deps)) {
        for (const d of deps) {
          if (typeof d === 'string') out.push(d);
        }
      } else if (typeof deps === 'object') {
        for (const name of Object.keys(deps)) {
          out.push(name);
        }
      }
    }
    return Array.from(new Set(out));
  }

  function mergeCompilerFlags() /*: Array<string> */ {
    const out /*: Array<string> */ = [];
    for (const layer of layers) {
      // $FlowFixMe[incompatible-use] layer narrowed from `mixed`; runtime-validated below
      const value = layer != null ? layer.compiler_flags : null;
      if (typeof value === 'string') {
        for (const tok of value.split(/\s+/)) {
          if (tok.length > 0) out.push(tok);
        }
      } else if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === 'string') {
            for (const tok of v.split(/\s+/)) {
              if (tok.length > 0) out.push(tok);
            }
          }
        }
      }
    }
    return out;
  }

  // $FlowFixMe[prop-missing] dynamic shape
  const reqArc /*: mixed */ = rawSpec.requires_arc;
  const requiresArc =
    reqArc === false || (Array.isArray(reqArc) && reqArc.length === 0)
      ? false
      : true; // RN ecosystem default

  return {
    name: mergeStringField('name') ?? '',
    version: mergeStringField('version') ?? '',
    sourceFiles: mergeArrayField('source_files'),
    publicHeaderFiles: mergeArrayField('public_header_files'),
    privateHeaderFiles: mergeArrayField('private_header_files'),
    excludeFiles: mergeArrayField('exclude_files'),
    headerMappingsDir: mergeStringField('header_mappings_dir'),
    headerDir: mergeStringField('header_dir'),
    frameworks: mergeArrayField('frameworks'),
    weakFrameworks: mergeArrayField('weak_frameworks'),
    libraries: mergeArrayField('libraries'),
    dependencies: mergeDependencies(),
    compilerFlags: mergeCompilerFlags(),
    headerSearchPaths: mergeHeaderSearchPaths(),
    resources: mergeArrayField('resources'),
    requiresArc,
    warnings,
    partial,
  };
}

// ---------------------------------------------------------------------------
// Top-level entry
// ---------------------------------------------------------------------------

/**
 * Reads and flattens a podspec at `podspecPath`. Tries `pod ipc spec` first
 * (full Ruby DSL evaluation); falls back to a regex parser when CocoaPods
 * isn't available.
 *
 * Throws when the file doesn't exist. Otherwise always returns a
 * PodspecModel — warnings on the model surface partial parses to the
 * caller, who can decide whether to proceed or abort scaffolding for that
 * dep.
 */
function readPodspec(podspecPath /*: string */) /*: PodspecModel */ {
  if (!fs.existsSync(podspecPath)) {
    throw new Error(`readPodspec: file does not exist: ${podspecPath}`);
  }
  const podIpc = runPodIpcSpec(podspecPath);
  const raw = podIpc != null ? podIpc : regexPodspec(podspecPath);
  return flattenSubspecs(raw);
}

module.exports = {
  readPodspec,
  runPodIpcSpec,
  regexPodspec,
  flattenSubspecs,
};
