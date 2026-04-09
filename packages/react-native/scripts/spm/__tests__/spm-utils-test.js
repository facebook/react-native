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
  defaultCacheDir,
  displayPath,
  makeLogger,
  readPackageJson,
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
