/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {
  buildPerAppHeaderTree,
  buildSharedReactCoreHeaderTree,
  defaultCacheDir,
  displayPath,
  logCrossTreeShadows,
  makeLogger,
  reactHeaderCFlags,
  reactHeaderCxxFlags,
  readPackageJson,
  renderRNPathsLoader,
  resolveReactNativeRoot,
  runCodegenAndInstallTemplate,
  sharedCacheDir,
  toSwiftName,
  writeAppPathsJson,
  writeSharedPathsJson,
} = require('../spm-utils');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// toSwiftName
// ---------------------------------------------------------------------------

describe('toSwiftName', () => {
  it.each([
    ['@react-native/tester', 'Tester'],
    ['my-app', 'MyApp'],
    ['@scope/foo-bar', 'FooBar'],
    ['simple', 'Simple'],
    ['a--b', 'AB'],
    ['my_great_app', 'MyGreatApp'],
  ])('toSwiftName(%j) => %j', (input, expected) => {
    expect(toSwiftName(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// defaultCacheDir
// ---------------------------------------------------------------------------

describe('sharedCacheDir', () => {
  it('matches CocoaPods shared_cache_dir (~/Library/Caches/ReactNative)', () => {
    expect(sharedCacheDir()).toBe(
      path.join(os.homedir(), 'Library', 'Caches', 'ReactNative'),
    );
  });
});

describe('defaultCacheDir', () => {
  it('nests SPM artifacts under the canonical ReactNative cache root', () => {
    const result = defaultCacheDir('0.80.0', 'debug');
    expect(result).toBe(
      path.join(
        os.homedir(),
        'Library',
        'Caches',
        'ReactNative',
        'spm-artifacts',
        '0.80.0',
        'debug',
      ),
    );
    // No bundle-id-named dir that other tools might also use.
    expect(result).not.toContain('com.facebook.ReactNative');
  });

  it('varies by flavor', () => {
    const debug = defaultCacheDir('1.0.0', 'debug');
    const release = defaultCacheDir('1.0.0', 'release');
    expect(debug).not.toBe(release);
    expect(debug).toContain('debug');
    expect(release).toContain('release');
  });
});

// ---------------------------------------------------------------------------
// displayPath
// ---------------------------------------------------------------------------

describe('displayPath', () => {
  it('replaces homedir with ~', () => {
    const home = os.homedir();
    expect(displayPath(path.join(home, 'projects', 'app'))).toBe(
      '~/projects/app',
    );
  });

  it('returns ~ for exact homedir', () => {
    expect(displayPath(os.homedir())).toBe('~');
  });

  it('returns relative path when close to cwd and not under $HOME', () => {
    // displayPath prefers ~/ for paths under $HOME, so use a non-home path
    // to test the relative-path logic. On macOS cwd is typically under $HOME,
    // so we verify the ~/... behavior instead.
    const cwd = process.cwd();
    const child = path.join(cwd, 'sub', 'dir');
    const result = displayPath(child);
    // Either relative (sub/dir) or ~/... depending on whether cwd is under $HOME
    const home = os.homedir();
    if (cwd.startsWith(home + path.sep)) {
      expect(result).toMatch(/^~\//);
    } else {
      expect(result).toBe(path.join('sub', 'dir'));
    }
  });

  it('returns absolute path for deep relative', () => {
    // Paths more than 2 levels above cwd should stay absolute
    // (unless they fall under $HOME)
    const home = os.homedir();
    const p = path.join(home, 'deep', 'nested', 'path');
    // This is under $HOME, so it should use ~/
    expect(displayPath(p)).toBe('~/deep/nested/path');
  });
});

// ---------------------------------------------------------------------------
// makeLogger
// ---------------------------------------------------------------------------

describe('makeLogger', () => {
  let spies;

  afterEach(() => {
    if (spies) {
      spies.forEach(s => s.mockRestore());
      spies = null;
    }
  });

  function mockConsole(...methods) {
    spies = methods.map(m =>
      jest.spyOn(console, m).mockImplementation(() => {}),
    );
    return spies;
  }

  it('log writes to stdout with green prefix', () => {
    const [spy] = mockConsole('log');
    const {log} = makeLogger('test');
    log('hello');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[test]'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('hello'));
  });

  it('warn writes to stderr with yellow prefix', () => {
    const [spy] = mockConsole('warn');
    const {warn} = makeLogger('test');
    warn('caution');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[test]'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('caution'));
  });

  it('die throws, sets exitCode, writes to stderr', () => {
    const [spy] = mockConsole('error');
    const origExitCode = process.exitCode;
    const {die} = makeLogger('test');
    expect(() => die('fatal')).toThrow('fatal');
    expect(process.exitCode).toBe(1);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('fatal'));
    process.exitCode = origExitCode;
  });
});

// ---------------------------------------------------------------------------
// readPackageJson
// ---------------------------------------------------------------------------

describe('readPackageJson', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns parsed JSON for valid file', () => {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({name: 'test-pkg', version: '1.0.0'}),
    );
    const result = readPackageJson(tempDir);
    expect(result).toEqual({name: 'test-pkg', version: '1.0.0'});
  });

  it('returns null for missing file', () => {
    expect(readPackageJson(tempDir)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveReactNativeRoot
// ---------------------------------------------------------------------------

describe('resolveReactNativeRoot', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('finds react-native hoisted above the app package root', () => {
    const workspaceRoot = path.join(tempDir, 'workspace');
    const appRoot = path.join(workspaceRoot, 'packages', 'app', 'ios');
    const rnRoot = path.join(workspaceRoot, 'node_modules', 'react-native');
    fs.mkdirSync(appRoot, {recursive: true});
    fs.mkdirSync(rnRoot, {recursive: true});

    expect(
      resolveReactNativeRoot(
        appRoot,
        path.join(workspaceRoot, 'packages', 'app'),
      ),
    ).toBe(rnRoot);
  });
});

// ---------------------------------------------------------------------------
// runCodegenAndInstallTemplate
// ---------------------------------------------------------------------------

describe('runCodegenAndInstallTemplate', () => {
  let tempDir;
  let reactNativeRoot;
  let appRoot;
  let codegenPkgSwift;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-codegen-test-'));
    reactNativeRoot = path.join(tempDir, 'react-native');
    appRoot = path.join(tempDir, 'app');

    // Minimal fake codegen script (no-op) so the execSync call exits cleanly.
    fs.mkdirSync(path.join(reactNativeRoot, 'scripts'), {recursive: true});
    fs.writeFileSync(
      path.join(reactNativeRoot, 'scripts', 'generate-codegen-artifacts.js'),
      '// no-op codegen for tests\n',
    );
    // Codegen template that installSpmCodegenTemplate renders + writes.
    fs.mkdirSync(
      path.join(reactNativeRoot, 'scripts', 'codegen', 'templates'),
      {
        recursive: true,
      },
    );
    fs.writeFileSync(
      path.join(
        reactNativeRoot,
        'scripts',
        'codegen',
        'templates',
        'Package.swift.spm-template',
      ),
      '// template\n',
    );
    // build/generated/ios must exist for the template to be installed.
    fs.mkdirSync(path.join(appRoot, 'build', 'generated', 'ios'), {
      recursive: true,
    });
    codegenPkgSwift = path.join(
      appRoot,
      'build',
      'generated',
      'ios',
      'Package.swift',
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('installs the codegen template by default', () => {
    runCodegenAndInstallTemplate(appRoot, appRoot, reactNativeRoot);
    expect(fs.existsSync(codegenPkgSwift)).toBe(true);
  });

  it('skips the template install when installTemplate is false', () => {
    runCodegenAndInstallTemplate(appRoot, appRoot, reactNativeRoot, undefined, {
      installTemplate: false,
    });
    // The SPM sync re-points the xcframework symlinks and installs the template
    // itself afterwards, so this in-codegen install must be suppressed.
    expect(fs.existsSync(codegenPkgSwift)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildMergedHeaderTree
// ---------------------------------------------------------------------------
describe('split header trees', () => {
  let tempDir;
  let projectRoot;
  let appRoot;
  let xcfwDir;
  let sharedDir;
  let perAppDir;
  const SLOT = 'test-slot';

  function writeFile(p, contents) {
    fs.mkdirSync(path.dirname(p), {recursive: true});
    fs.writeFileSync(p, contents);
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-merged-test-'));
    projectRoot = tempDir;
    appRoot = path.join(tempDir, 'app');
    xcfwDir = path.join(appRoot, 'build', 'xcframeworks');
    sharedDir = path.join(
      projectRoot,
      '.react-native',
      'headers',
      SLOT,
      'ReactCoreHeaders',
    );
    perAppDir = path.join(xcfwDir, 'ReactAppHeaders');

    const reactXcfw = path.join(xcfwDir, 'React.xcframework');
    // Namespaced physical React headers (as shipped in the xcframework).
    writeFile(
      path.join(reactXcfw, 'Headers', 'React_Fabric', 'react', 'foo', 'Bar.h'),
      '#pragma once\n// react Bar\n',
    );
    // React_RCTAppDelegate headers — host apps import these BARE, so they must
    // also surface at the merged-tree root.
    writeFile(
      path.join(
        reactXcfw,
        'Headers',
        'React_RCTAppDelegate',
        'RCTDefaultReactNativeFactoryDelegate.h',
      ),
      '#pragma once\n// app delegate\n',
    );
    // VFS template mapping the virtual <react/foo/Bar.h> to that physical file.
    writeFile(
      path.join(reactXcfw, 'React-VFS-template.yaml'),
      [
        'version: 0',
        'case-sensitive: false',
        'roots:',
        "  - name: '${ROOT_PATH}/Headers'",
        "    type: 'directory'",
        '    contents:',
        "      - name: 'react'",
        "        type: 'directory'",
        '        contents:',
        "          - name: 'foo'",
        "            type: 'directory'",
        '            contents:',
        "              - name: 'Bar.h'",
        "                type: 'file'",
        "                external-contents: '${ROOT_PATH}/Headers/React_Fabric/react/foo/Bar.h'",
        '',
      ].join('\n'),
    );
    // Deps headers (natural layout, folded in).
    writeFile(
      path.join(
        xcfwDir,
        'ReactNativeDependencies.xcframework',
        'Headers',
        'folly',
        'dynamic.h',
      ),
      '#pragma once\n// folly\n',
    );
    // Autolinking header farm — a SYMLINK farm (leaf headers are symlinks to
    // the dep's real source). foldDir must follow symlinks, not skip them.
    const realProviderHeader = path.join(tempDir, 'src', 'Provider.h');
    writeFile(realProviderHeader, '#pragma once\n// provider\n');
    const farmHeader = path.join(
      appRoot,
      'build',
      'generated',
      'autolinking',
      'headers',
      'MyLib',
      'Provider.h',
    );
    fs.mkdirSync(path.dirname(farmHeader), {recursive: true});
    fs.symlinkSync(realProviderHeader, farmHeader);
    // Codegen header (folded in) + a duplicate of the React virtual path with
    // DIFFERENT content, to prove React (folded first) wins.
    writeFile(
      path.join(
        appRoot,
        'build',
        'generated',
        'ios',
        'ReactCodegen',
        'react',
        'renderer',
        'EventEmitters.h',
      ),
      '#pragma once\n// codegen\n',
    );
    writeFile(
      path.join(appRoot, 'build', 'generated', 'ios', 'react', 'foo', 'Bar.h'),
      '#pragma once\n// codegen Bar (should NOT win)\n',
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('shared tree: only app-independent React/deps/RCTAppDelegate headers', () => {
    const result = buildSharedReactCoreHeaderTree(projectRoot, SLOT, xcfwDir);
    expect(result.path).toBe(sharedDir);

    // React header resolves via its natural import path (symlink)...
    const reactHeader = path.join(sharedDir, 'react', 'foo', 'Bar.h');
    expect(fs.existsSync(reactHeader)).toBe(true);
    expect(fs.lstatSync(reactHeader).isSymbolicLink()).toBe(true);
    // ...deps headers folded in...
    expect(fs.existsSync(path.join(sharedDir, 'folly', 'dynamic.h'))).toBe(
      true,
    );
    // ...React_RCTAppDelegate exposed BARE at the root.
    expect(
      fs.existsSync(
        path.join(sharedDir, 'RCTDefaultReactNativeFactoryDelegate.h'),
      ),
    ).toBe(true);
    // ...but NOT per-app codegen/autolinking headers.
    expect(fs.existsSync(path.join(sharedDir, 'MyLib', 'Provider.h'))).toBe(
      false,
    );
    expect(
      fs.existsSync(
        path.join(sharedDir, 'react', 'renderer', 'EventEmitters.h'),
      ),
    ).toBe(false);
  });

  it('shared tree: creates the per-app ReactCoreHeaders symlink into the shared tree', () => {
    buildSharedReactCoreHeaderTree(projectRoot, SLOT, xcfwDir);
    const link = path.join(xcfwDir, 'ReactCoreHeaders');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.realpathSync(link)).toBe(fs.realpathSync(sharedDir));
  });

  it('prunes stale slot dirs and rebuilds fresh (so an RN update reliably applies)', () => {
    // A prior run left an old slot dir behind.
    const oldSlotDir = path.join(
      projectRoot,
      '.react-native',
      'headers',
      'old-slot',
      'ReactCoreHeaders',
    );
    fs.mkdirSync(oldSlotDir, {recursive: true});
    fs.writeFileSync(path.join(oldSlotDir, 'stale.h'), '// stale\n');

    const result = buildSharedReactCoreHeaderTree(projectRoot, SLOT, xcfwDir);

    // The old slot is gone (pruned), the current slot is freshly built.
    expect(fs.existsSync(oldSlotDir)).toBe(false);
    expect(result.path).toBe(sharedDir);
    expect(fs.existsSync(path.join(sharedDir, 'react', 'foo', 'Bar.h'))).toBe(
      true,
    );
    // No sentinel file lingers in the tree.
    expect(fs.existsSync(path.join(sharedDir, '.slot-complete'))).toBe(false);
  });

  it('per-app tree: only codegen/autolinking headers (no React/deps)', () => {
    const result = buildPerAppHeaderTree(appRoot);
    expect(result.path).toBe(perAppDir);
    expect(fs.existsSync(path.join(perAppDir, 'MyLib', 'Provider.h'))).toBe(
      true,
    );
    expect(
      fs.existsSync(
        path.join(perAppDir, 'react', 'renderer', 'EventEmitters.h'),
      ),
    ).toBe(true);
    // the codegen copy of react/foo/Bar.h lives here (its own seen map)...
    const bar = path.join(perAppDir, 'react', 'foo', 'Bar.h');
    expect(fs.existsSync(bar)).toBe(true);
    expect(fs.readFileSync(bar, 'utf8')).toContain('should NOT win');
    // ...and React/deps headers are NOT in the per-app tree.
    expect(fs.existsSync(path.join(perAppDir, 'folly', 'dynamic.h'))).toBe(
      false,
    );
  });

  it('shared tree: returns null path when the xcframework is absent', () => {
    fs.rmSync(path.join(xcfwDir, 'React.xcframework'), {
      recursive: true,
      force: true,
    });
    expect(
      buildSharedReactCoreHeaderTree(projectRoot, SLOT, xcfwDir).path,
    ).toBe(null);
  });

  it('logCrossTreeShadows: reports a virtual path present in both trees', () => {
    const shared = buildSharedReactCoreHeaderTree(projectRoot, SLOT, xcfwDir);
    const perApp = buildPerAppHeaderTree(appRoot);
    const msgs = [];
    logCrossTreeShadows(shared, perApp, {log: m => msgs.push(m)});
    // react/foo/Bar.h is in both (React in shared, codegen copy in per-app).
    expect(msgs.some(m => m.includes('react/foo/Bar.h'))).toBe(true);
  });

  it('writes the two SoT JSON files with the split header paths', () => {
    writeSharedPathsJson(projectRoot, SLOT, '0.99.0');
    writeAppPathsJson(appRoot, projectRoot, SLOT);

    const shared = JSON.parse(
      fs.readFileSync(
        path.join(projectRoot, '.react-native', 'paths.json'),
        'utf8',
      ),
    );
    expect(shared.formatVersion).toBe(1);
    expect(shared.rnCoreHeaders).toBe(sharedDir);
    expect(shared.reactNativeVersion).toBe('0.99.0');

    const app = JSON.parse(
      fs.readFileSync(
        path.join(
          appRoot,
          'build',
          'generated',
          'autolinking',
          'spm-paths.json',
        ),
        'utf8',
      ),
    );
    expect(app.formatVersion).toBe(1);
    expect(app.appRoot).toBe(appRoot);
    expect(app.rnCoreHeaders).toBe(sharedDir);
    expect(app.appHeaders).toBe(perAppDir);
    expect(app.reactNativePackage).toBe(
      path.join(appRoot, 'build', 'xcframeworks'),
    );
  });
});

// ---------------------------------------------------------------------------
// renderRNPathsLoader + header flags
// ---------------------------------------------------------------------------
describe('renderRNPathsLoader / reactHeader flags', () => {
  it('emits a JSON loader reading spm-paths.json at the given relative path', () => {
    const out = renderRNPathsLoader('../..');
    expect(out).toContain('URL(fileURLWithPath: #filePath)');
    expect(out).toContain('packageDir + "/../../spm-paths.json"');
    expect(out).toContain('JSONDecoder().decode(RNSpmPaths.self');
    expect(out).toContain('decoded.formatVersion == 1');
    expect(out).toContain('let rnCoreHeaders = rnSpmPaths.rnCoreHeaders');
    expect(out).toContain('let appHeaders = rnSpmPaths.appHeaders');
  });

  it('renders the same-dir path for an empty rel', () => {
    expect(renderRNPathsLoader('')).toContain('packageDir + "/spm-paths.json"');
  });

  it('header flags reference the two split vars (shared before per-app)', () => {
    expect(reactHeaderCFlags().join(', ')).toBe(
      '"-I", rnCoreHeaders, "-I", appHeaders',
    );
    const cxx = reactHeaderCxxFlags().join(', ');
    expect(cxx).toContain('"-fno-implicit-module-maps"');
    expect(cxx).toContain('"-I", rnCoreHeaders, "-I", appHeaders');
  });
});

// ---------------------------------------------------------------------------
// Multi-app monorepo: two apps in one repo share the slot-keyed RN-core tree
// while each gets its own per-app tree + SoT. Guards the "works in a monorepo"
// claim for the core mechanism (no per-app ambiguity for the shared half).
// ---------------------------------------------------------------------------
describe('multi-app monorepo header trees', () => {
  let repoRoot;
  const SLOT = 'slot-1';

  function writeFile(p, contents) {
    fs.mkdirSync(path.dirname(p), {recursive: true});
    fs.writeFileSync(p, contents);
  }

  // Minimal app with a React.xcframework + VFS template under build/xcframeworks.
  function makeApp(name) {
    const appRoot = path.join(repoRoot, 'apps', name);
    const xcfwDir = path.join(appRoot, 'build', 'xcframeworks');
    const reactXcfw = path.join(xcfwDir, 'React.xcframework');
    writeFile(
      path.join(reactXcfw, 'Headers', 'React_Fabric', 'react', 'foo', 'Bar.h'),
      '#pragma once\n',
    );
    writeFile(
      path.join(reactXcfw, 'React-VFS-template.yaml'),
      [
        'roots:',
        "  - name: '${ROOT_PATH}/Headers'",
        '    contents:',
        "      - name: 'react'",
        '        contents:',
        "          - name: 'foo'",
        '            contents:',
        "              - name: 'Bar.h'",
        "                external-contents: '${ROOT_PATH}/Headers/React_Fabric/react/foo/Bar.h'",
        '',
      ].join('\n'),
    );
    // A per-app codegen header, unique per app.
    writeFile(
      path.join(
        appRoot,
        'build',
        'generated',
        'ios',
        'ReactCodegen',
        `${name}Spec.h`,
      ),
      '#pragma once\n',
    );
    return {appRoot, xcfwDir};
  }

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-monorepo-test-'));
  });
  afterEach(() => {
    fs.rmSync(repoRoot, {recursive: true, force: true});
  });

  it('shares one RN-core tree across apps; each app gets its own per-app tree + SoT', () => {
    const a = makeApp('AppA');
    const b = makeApp('AppB');

    const sharedA = buildSharedReactCoreHeaderTree(repoRoot, SLOT, a.xcfwDir);
    // AppB on the same slot+projectRoot resolves to the same shared tree path.
    const sharedB = buildSharedReactCoreHeaderTree(repoRoot, SLOT, b.xcfwDir);
    expect(sharedA.path).toBe(sharedB.path);

    // Each app's relocatable symlink resolves to that ONE shared tree.
    const linkA = path.join(a.xcfwDir, 'ReactCoreHeaders');
    const linkB = path.join(b.xcfwDir, 'ReactCoreHeaders');
    expect(fs.realpathSync(linkA)).toBe(fs.realpathSync(sharedA.path));
    expect(fs.realpathSync(linkB)).toBe(fs.realpathSync(sharedA.path));

    // Per-app trees are distinct and carry that app's own codegen header.
    buildPerAppHeaderTree(a.appRoot);
    buildPerAppHeaderTree(b.appRoot);
    expect(
      fs.existsSync(path.join(a.xcfwDir, 'ReactAppHeaders', 'AppASpec.h')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(b.xcfwDir, 'ReactAppHeaders', 'AppBSpec.h')),
    ).toBe(true);
    // AppA's per-app tree must NOT contain AppB's spec (no cross-app leakage).
    expect(
      fs.existsSync(path.join(a.xcfwDir, 'ReactAppHeaders', 'AppBSpec.h')),
    ).toBe(false);

    // Each app's spm-paths.json: same shared rnCoreHeaders, app-specific appRoot.
    writeAppPathsJson(a.appRoot, repoRoot, SLOT);
    writeAppPathsJson(b.appRoot, repoRoot, SLOT);
    const jsonA = JSON.parse(
      fs.readFileSync(
        path.join(
          a.appRoot,
          'build',
          'generated',
          'autolinking',
          'spm-paths.json',
        ),
        'utf8',
      ),
    );
    const jsonB = JSON.parse(
      fs.readFileSync(
        path.join(
          b.appRoot,
          'build',
          'generated',
          'autolinking',
          'spm-paths.json',
        ),
        'utf8',
      ),
    );
    expect(jsonA.rnCoreHeaders).toBe(jsonB.rnCoreHeaders); // shared
    expect(jsonA.appRoot).toBe(a.appRoot);
    expect(jsonB.appRoot).toBe(b.appRoot);
    expect(jsonA.appHeaders).not.toBe(jsonB.appHeaders); // per-app
  });
});
