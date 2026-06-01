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
  buildMergedHeaderTree,
  defaultCacheDir,
  displayPath,
  makeLogger,
  readPackageJson,
  resolveReactNativeRoot,
  runCodegenAndInstallTemplate,
  toSwiftName,
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

describe('defaultCacheDir', () => {
  it('returns versioned cache path', () => {
    const result = defaultCacheDir('0.80.0', 'debug');
    expect(result).toBe(
      path.join(
        os.homedir(),
        'Library',
        'Caches',
        'com.facebook.ReactNative',
        'spm-artifacts',
        '0.80.0',
        'debug',
      ),
    );
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
describe('buildMergedHeaderTree', () => {
  let tempDir;
  let appRoot;
  let xcfwDir;
  let outDir;

  function writeFile(p, contents) {
    fs.mkdirSync(path.dirname(p), {recursive: true});
    fs.writeFileSync(p, contents);
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-merged-test-'));
    appRoot = path.join(tempDir, 'app');
    xcfwDir = path.join(appRoot, 'build', 'xcframeworks');
    outDir = path.join(xcfwDir, 'ReactHeadersAll');

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
        "case-sensitive: false",
        'roots:',
        "  - name: '${ROOT_PATH}/Headers'",
        "    type: 'directory'",
        "    contents:",
        "      - name: 'react'",
        "        type: 'directory'",
        "        contents:",
        "          - name: 'foo'",
        "            type: 'directory'",
        "            contents:",
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

  it('materializes a merged tree of symlinks from the VFS template + folded dirs', () => {
    const result = buildMergedHeaderTree(appRoot);
    expect(result).toBe(outDir);

    const reactHeader = path.join(outDir, 'react', 'foo', 'Bar.h');
    const follyHeader = path.join(outDir, 'folly', 'dynamic.h');
    const codegenHeader = path.join(
      outDir,
      'react',
      'renderer',
      'EventEmitters.h',
    );
    // React header resolves via its natural import path...
    expect(fs.existsSync(reactHeader)).toBe(true);
    expect(fs.lstatSync(reactHeader).isSymbolicLink()).toBe(true);
    // ...and deps + codegen headers are folded into the same tree.
    expect(fs.existsSync(follyHeader)).toBe(true);
    expect(fs.existsSync(codegenHeader)).toBe(true);
    // ...including the symlinked autolinking-farm header (foldDir follows symlinks).
    expect(fs.existsSync(path.join(outDir, 'MyLib', 'Provider.h'))).toBe(true);
  });

  it('exposes React_RCTAppDelegate headers BARE at the root (host apps import them unprefixed)', () => {
    buildMergedHeaderTree(appRoot);
    // bare — what `#import <RCTDefaultReactNativeFactoryDelegate.h>` needs.
    expect(
      fs.existsSync(path.join(outDir, 'RCTDefaultReactNativeFactoryDelegate.h')),
    ).toBe(true);
  });

  it('collapses a duplicate virtual path to the first (React) source', () => {
    buildMergedHeaderTree(appRoot);
    // build/generated/ios also has react/foo/Bar.h, but React is folded first,
    // so the merged entry must resolve to the React copy.
    const merged = fs.readFileSync(
      path.join(outDir, 'react', 'foo', 'Bar.h'),
      'utf8',
    );
    expect(merged).toContain('react Bar');
    expect(merged).not.toContain('should NOT win');
  });

  it('returns null when the xcframework is absent', () => {
    fs.rmSync(path.join(xcfwDir, 'React.xcframework'), {
      recursive: true,
      force: true,
    });
    expect(buildMergedHeaderTree(appRoot)).toBe(null);
  });
});
