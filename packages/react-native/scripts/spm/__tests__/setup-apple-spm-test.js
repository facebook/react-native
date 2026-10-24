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

// `pod` is faked so the CocoaPods conversion tests need no CocoaPods install,
// and the autolinking config command (spawnSync → npx) fails fast instead of
// reaching the network. A test that sets mockAutolinkingSourceDir lets the
// config command succeed instead, so `main` gets far enough to write
// build/generated/ — what "refuses before any change" has to rule out. git and
// everything else run for real.
const mockPodCalls = [];
let mockAutolinkingSourceDir = null;
jest.mock('node:child_process', () => {
  const actual = jest.requireActual('node:child_process');
  return {
    ...actual,
    execFileSync: (command, args, options) => {
      if (command === 'pod') {
        mockPodCalls.push(args);
        return '';
      }
      return actual.execFileSync(command, args, options);
    },
    spawnSync: () =>
      mockAutolinkingSourceDir == null
        ? {status: 1, stdout: '', stderr: 'stubbed in test'}
        : {
            status: 0,
            stdout: JSON.stringify({
              project: {ios: {sourceDir: mockAutolinkingSourceDir}},
              dependencies: {},
            }),
            stderr: '',
          },
  };
});

// A test that sets mockInjectorCalls to an array runs `add` to the end: the
// xcframeworks package (which needs real XCFramework slices) is skipped, and
// the injector (which needs that package's output) only records its options.
let mockInjectorCalls = null;
jest.mock('../generate-spm-package', () => {
  const actual = jest.requireActual('../generate-spm-package');
  return {
    ...actual,
    main: argv => (mockInjectorCalls == null ? actual.main(argv) : undefined),
  };
});
jest.mock('../generate-spm-xcodeproj', () => {
  const actual = jest.requireActual('../generate-spm-xcodeproj');
  return {
    ...actual,
    injectSpmIntoExistingXcodeproj: opts => {
      if (mockInjectorCalls == null) {
        return actual.injectSpmIntoExistingXcodeproj(opts);
      }
      mockInjectorCalls.push(opts);
      return {status: 'injected', target: 'MyApp'};
    },
  };
});

const {
  detectStandardRnLayoutRedirect,
  determineVersion,
  ensureBothArtifactFlavors,
  ensureGitignoreSpmEntries,
  findInjectedXcodeproj,
  generateAutolinkingConfigOrFailClosed,
  main,
  parseArgs,
  resolveAction,
  resolveAppIosDeploymentTarget,
  resolveConfigCommandToPin,
  resolveCxxApiDefines,
  resolveExplicitConfigCommand,
  runDeintegrate,
  shouldAutoDeintegrate,
} = require('../../setup-apple-spm');
const {REQUIRED_ARTIFACTS} = require('../download-spm-artifacts');
const {SPM_INJECTED_MARKER} = require('../generate-spm-xcodeproj');
const {twoAppTargets} = require('./pbxproj-variants');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Create an in-place-injected xcodeproj fixture: a directory carrying the
// `.spm-injected.json` marker (what injectSpmIntoExistingXcodeproj writes).
function mkInjectedXcodeproj(appRoot, name, markerFields = {}) {
  const dir = path.join(appRoot, name);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(
    path.join(dir, SPM_INJECTED_MARKER),
    JSON.stringify({
      rootUuid: 'X',
      target: 'MyApp',
      injectedUuids: [],
      ...markerFields,
    }),
  );
  return dir;
}

// Create a (CocoaPods or plain) xcodeproj fixture with a minimal pbxproj.
function mkXcodeproj(appRoot, name, {cocoapods = false} = {}) {
  const dir = path.join(appRoot, name);
  fs.mkdirSync(dir, {recursive: true});
  const baseConfig = cocoapods
    ? 'baseConfigurationReference = ABC /* Pods-MyApp.debug.xcconfig */;\n'
    : '';
  fs.writeFileSync(
    path.join(dir, 'project.pbxproj'),
    `// !$*UTF8*$!\n{\n\tobjects = {\n${baseConfig}\t};\n}\n`,
  );
  return dir;
}

// A Debug or Release artifact slot that passes validation: every required
// XCFramework directory, listed in artifacts.json.
function writeCompleteArtifactSlot(root, flavor) {
  const slot = path.join(root, flavor);
  fs.mkdirSync(path.join(slot, 'hermes-headers', 'hermes'), {
    recursive: true,
  });
  const artifacts = {};
  for (const name of REQUIRED_ARTIFACTS) {
    const xcframeworkPath = path.join(slot, `${name}.xcframework`);
    fs.mkdirSync(xcframeworkPath, {recursive: true});
    artifacts[name] = {xcframeworkPath};
  }
  fs.writeFileSync(
    path.join(slot, 'artifacts.json'),
    JSON.stringify(artifacts),
  );
  return slot;
}

function gitInitAndCommit(dir) {
  const opts = {cwd: dir, stdio: 'ignore'};
  execFileSync('git', ['init'], opts);
  execFileSync('git', ['config', 'user.email', 'test@example.com'], opts);
  execFileSync('git', ['config', 'user.name', 'Test'], opts);
  execFileSync('git', ['add', '-A'], opts);
  execFileSync('git', ['commit', '-m', 'init'], opts);
}

describe('parseArgs', () => {
  it('parses --config-command as a JSON argv array', () => {
    const args = parseArgs([
      'update',
      '--config-command',
      '["a","b","config"]',
    ]);

    expect(args.action).toBe('update');
    expect(args.configCommand).toEqual(['a', 'b', 'config']);
  });

  it('sets configCommand to null when --config-command is omitted', () => {
    expect(parseArgs(['update']).configCommand).toBeNull();
  });

  it('throws for an invalid --config-command value', () => {
    expect(() => parseArgs(['update', '--config-command', 'not json'])).toThrow(
      /--config-command/,
    );
  });
});

// ---------------------------------------------------------------------------
// generateAutolinkingConfigOrFailClosed — the fail-closed policy main() applies
// to the autolinking config step. Swallowing a config-command error (the old
// behavior) let the build proceed with a silently-empty Autolinked package that
// only surfaced later as `unable to resolve module dependency`. A native-
// module-free app does NOT hit the error path: its command exits 0 with valid
// empty-dependency JSON and the generator returns normally.
// ---------------------------------------------------------------------------

describe('generateAutolinkingConfigOrFailClosed', () => {
  let prevExitCode;
  let warnSpy;

  beforeEach(() => {
    prevExitCode = process.exitCode;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = prevExitCode;
    jest.restoreAllMocks();
  });

  it('returns the config result and leaves the exit code untouched on success', () => {
    const result = {
      config: {},
      outputPath: '/app/ios/autolinking.json',
      rawJson: '{}',
    };
    const out = generateAutolinkingConfigOrFailClosed({
      projectRoot: '/app',
      generate: () => result,
    });

    expect(out).toBe(result);
    expect(process.exitCode).not.toBe(2);
  });

  it('passes projectRoot and configCommand through to the generator', () => {
    let received;
    generateAutolinkingConfigOrFailClosed({
      projectRoot: '/proj',
      configCommand: ['my-cli', 'config'],
      generate: opts => {
        received = opts;
        return {config: {}, outputPath: '', rawJson: ''};
      },
    });

    expect(received).toEqual({
      projectRoot: '/proj',
      configCommand: ['my-cli', 'config'],
    });
  });

  it('fails closed (null, exit 2, actionable error) when the config command errors', () => {
    const out = generateAutolinkingConfigOrFailClosed({
      projectRoot: '/app',
      generate: () => {
        throw new Error("'my-cli config' exited with status 1");
      },
    });

    expect(out).toBeNull();
    expect(process.exitCode).toBe(2);
    const warnings = warnSpy.mock.calls.map(c => c.join(' ')).join('\n');
    // Names the override so the next person can fix it...
    expect(warnings).toMatch(/RCT_SPM_AUTOLINKING_CONFIG_COMMAND/);
    // ...and preserves the underlying cause.
    expect(warnings).toMatch(/exited with status 1/);
  });
});

// ---------------------------------------------------------------------------
// resolveExplicitConfigCommand — the autolinking config command every action
// (add/update/sync/scaffold) runs with: `--config-command` →
// RCT_SPM_AUTOLINKING_CONFIG_COMMAND → the value pinned in `.spm-injected.json`
// → the built-in default. undefined means "let generateAutolinkingConfig pick
// the env var or the default".
// ---------------------------------------------------------------------------

describe('resolveCxxApiDefines', () => {
  const ENV_VARS = ['RN_STRICT_API', 'RN_ALLOW_FRAMEWORKS'];
  let tempDir;
  let prevEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-cxx-api-'));
    prevEnv = ENV_VARS.map(name => process.env[name]);
    ENV_VARS.forEach(name => delete process.env[name]);
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    ENV_VARS.forEach((name, i) => {
      if (prevEnv[i] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = prevEnv[i];
      }
    });
  });

  it('defines, on add/update, each opt-in whose env var is 1, whatever was recorded', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cxxApiDefines: ['RN_STRICT_API', 'RN_ALLOW_FRAMEWORKS'],
    });
    process.env.RN_STRICT_API = '1';
    process.env.RN_ALLOW_FRAMEWORKS = 'true';
    expect(resolveCxxApiDefines('add', tempDir)).toEqual(['RN_STRICT_API']);
    delete process.env.RN_STRICT_API;
    process.env.RN_ALLOW_FRAMEWORKS = '1';
    expect(resolveCxxApiDefines('update', tempDir)).toEqual([
      'RN_ALLOW_FRAMEWORKS',
    ]);
  });

  it('reuses the recorded macros on sync/codegen, which Xcode runs without the shell env', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cxxApiDefines: ['RN_ALLOW_FRAMEWORKS', 'NOT_A_CXX_API_MACRO'],
    });
    process.env.RN_STRICT_API = '1';
    expect(resolveCxxApiDefines('sync', tempDir)).toEqual([
      'RN_ALLOW_FRAMEWORKS',
    ]);
    expect(resolveCxxApiDefines('codegen', tempDir)).toEqual([
      'RN_ALLOW_FRAMEWORKS',
    ]);
  });

  it('defines nothing on sync before anything is injected', () => {
    expect(resolveCxxApiDefines('sync', tempDir)).toEqual([]);
  });
});

describe('resolveExplicitConfigCommand', () => {
  const ENV = 'RCT_SPM_AUTOLINKING_CONFIG_COMMAND';
  const PINNED = ['npx', 'expo-modules-autolinking', 'react-native-config'];
  let tempDir;
  let prevEnv;
  let logSpy;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-config-command-'));
    prevEnv = process.env[ENV];
    delete process.env[ENV];
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    if (prevEnv === undefined) {
      delete process.env[ENV];
    } else {
      process.env[ENV] = prevEnv;
    }
    jest.restoreAllMocks();
  });

  function pin(configCommand) {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj', {configCommand});
  }

  it('prefers an explicit --config-command over the env var and the pin', () => {
    process.env[ENV] = '["from-env","config"]';
    pin(PINNED);
    expect(
      resolveExplicitConfigCommand(
        {configCommand: ['flag', 'config']},
        tempDir,
      ),
    ).toEqual(['flag', 'config']);
  });

  it('lets the env var win over the pin (a stale pin must not shadow it)', () => {
    process.env[ENV] = '["from-env","config"]';
    pin(PINNED);
    expect(resolveExplicitConfigCommand({configCommand: null}, tempDir)).toBe(
      undefined,
    );
  });

  it('uses the pin when neither the flag nor the env var is set', () => {
    pin(PINNED);
    expect(
      resolveExplicitConfigCommand({configCommand: null}, tempDir),
    ).toEqual(PINNED);
    // Names the source, so a stale pin is diagnosable from the build log.
    expect(logSpy.mock.calls.map(c => c.join(' ')).join('\n')).toMatch(
      /\.spm-injected\.json/,
    );
  });

  it('ignores a blank env var and falls through to the pin', () => {
    process.env[ENV] = '   ';
    pin(PINNED);
    expect(
      resolveExplicitConfigCommand({configCommand: null}, tempDir),
    ).toEqual(PINNED);
  });

  it('falls back to the default (undefined) with no flag, env var or pin', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveExplicitConfigCommand({configCommand: null}, tempDir)).toBe(
      undefined,
    );
  });

  it('falls back to the default when the pinned value is malformed', () => {
    pin('npx expo-modules-autolinking');
    expect(resolveExplicitConfigCommand({configCommand: null}, tempDir)).toBe(
      undefined,
    );
  });

  it('falls back to the default when no project is injected yet', () => {
    expect(resolveExplicitConfigCommand({configCommand: null}, tempDir)).toBe(
      undefined,
    );
  });
});

// ---------------------------------------------------------------------------
// resolveConfigCommandToPin — what `add`/`update` records in the injection
// marker: the explicit `--config-command`, else the env override, since the
// Xcode build phase inherits neither. null pins nothing (and preserves any
// earlier pin).
// ---------------------------------------------------------------------------

describe('resolveConfigCommandToPin', () => {
  const ENV = 'RCT_SPM_AUTOLINKING_CONFIG_COMMAND';
  const FROM_ENV = ['npx', 'expo-modules-autolinking', 'react-native-config'];
  let tempDir;
  let prevEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-config-command-pin-'));
    prevEnv = process.env[ENV];
    delete process.env[ENV];
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    if (prevEnv === undefined) {
      delete process.env[ENV];
    } else {
      process.env[ENV] = prevEnv;
    }
    jest.restoreAllMocks();
  });

  it('pins the env-derived command when only the env var is set', () => {
    process.env[ENV] = JSON.stringify(FROM_ENV);
    expect(resolveConfigCommandToPin({configCommand: null})).toEqual(FROM_ENV);
  });

  it('pins the explicit --config-command over the env var', () => {
    process.env[ENV] = JSON.stringify(FROM_ENV);
    expect(
      resolveConfigCommandToPin({configCommand: ['flag', 'config']}),
    ).toEqual(['flag', 'config']);
  });

  it('pins nothing when the env var is blank', () => {
    process.env[ENV] = '  \t ';
    expect(resolveConfigCommandToPin({configCommand: null})).toBeNull();
  });

  it('pins nothing when neither the flag nor the env var is set', () => {
    expect(resolveConfigCommandToPin({configCommand: null})).toBeNull();
  });

  it('fails loud rather than pinning garbage from an invalid env var', () => {
    process.env[ENV] = 'npx expo-modules-autolinking';
    expect(() => resolveConfigCommandToPin({configCommand: null})).toThrow(
      /RCT_SPM_AUTOLINKING_CONFIG_COMMAND/,
    );
  });

  it('is resolved back by a later run with neither flag nor env var', () => {
    process.env[ENV] = JSON.stringify(FROM_ENV);
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj', {
      configCommand: resolveConfigCommandToPin({configCommand: null}),
    });
    delete process.env[ENV];

    expect(
      resolveExplicitConfigCommand({configCommand: null}, tempDir),
    ).toEqual(FROM_ENV);
  });
});

// ---------------------------------------------------------------------------
// resolveAction — zero-arg default. Explicit action wins; otherwise `update`
// when an injection marker exists, else `add` (first run).
// ---------------------------------------------------------------------------

describe('resolveAction', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-resolve-action-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns the requested action verbatim when one is given', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveAction('add', tempDir)).toBe('add');
    expect(resolveAction('update', tempDir)).toBe('update');
    expect(resolveAction('deinit', tempDir)).toBe('deinit');
    expect(resolveAction('scaffold', tempDir)).toBe('scaffold');
  });

  it('defaults to `add` on first run (no injection marker)', () => {
    expect(resolveAction(null, tempDir)).toBe('add');
  });

  it('defaults to `add` even when a (non-injected) xcodeproj exists', () => {
    mkXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveAction(null, tempDir)).toBe('add');
  });

  it('defaults to `update` once an injection marker is present', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveAction(null, tempDir)).toBe('update');
  });
});

// ---------------------------------------------------------------------------
// findInjectedXcodeproj — locates the `.xcodeproj` carrying the injection marker
// ---------------------------------------------------------------------------

describe('findInjectedXcodeproj', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-find-injected-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns the injected project path when a marker is present', () => {
    mkInjectedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(findInjectedXcodeproj(tempDir)).toBe(
      path.join(tempDir, 'MyApp.xcodeproj'),
    );
  });

  it('returns null when no injected project exists', () => {
    mkXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(findInjectedXcodeproj(tempDir)).toBeNull();
  });
});

describe('dual-flavor artifact input', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-dual-artifacts-'));
  });

  afterEach(() => fs.rmSync(root, {recursive: true, force: true}));

  function writeCompleteSlot(flavor) {
    return writeCompleteArtifactSlot(root, flavor);
  }

  function args() {
    return {
      version: null,
      artifacts: root,
      downloadPolicy: 'skip',
    };
  }

  it('requires and returns complete Debug and Release slots', async () => {
    const debug = writeCompleteSlot('debug');
    const release = writeCompleteSlot('release');
    await expect(ensureBothArtifactFlavors(args(), '0.85.0')).resolves.toEqual({
      debug,
      release,
    });
  });

  it('fails if either flavor is incomplete', async () => {
    writeCompleteSlot('debug');
    await expect(ensureBothArtifactFlavors(args(), '0.85.0')).rejects.toThrow(
      /complete release slot/,
    );
  });

  it('rejects a single XCFramework as local artifact input', async () => {
    const single = path.join(root, 'React.xcframework');
    fs.mkdirSync(single);
    await expect(
      ensureBothArtifactFlavors({...args(), artifacts: single}, '0.85.0'),
    ).rejects.toThrow(/single XCFramework cannot satisfy automatic switching/);
  });
});

// ---------------------------------------------------------------------------
// detectStandardRnLayoutRedirect — auto-redirect into ios/ when run from the JS
// root of a standard RN app.
// ---------------------------------------------------------------------------

describe('detectStandardRnLayoutRedirect', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-redirect-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns the ios/ subdir when cwd === projectRoot AND ios/ exists', () => {
    fs.mkdirSync(path.join(tempDir, 'ios'));
    expect(detectStandardRnLayoutRedirect(tempDir, tempDir)).toBe(
      path.join(tempDir, 'ios'),
    );
  });

  it('returns null when running from a subdirectory (already cd-ed)', () => {
    fs.mkdirSync(path.join(tempDir, 'ios'));
    expect(
      detectStandardRnLayoutRedirect(path.join(tempDir, 'ios'), tempDir),
    ).toBeNull();
  });

  it('returns null for flat layouts (no ios/ subdir, e.g. rn-tester)', () => {
    expect(detectStandardRnLayoutRedirect(tempDir, tempDir)).toBeNull();
  });

  it('returns null when `ios` is a file, not a directory', () => {
    fs.writeFileSync(path.join(tempDir, 'ios'), '');
    expect(detectStandardRnLayoutRedirect(tempDir, tempDir)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// shouldAutoDeintegrate — the zero-arg safe-gate. Auto-convert ONLY a fresh
// CocoaPods RN project: CocoaPods pbxproj + stock Podfile (no third-party pods)
// + clean git tree. Anything else → false (strict `add`, fail-loud).
// ---------------------------------------------------------------------------

describe('shouldAutoDeintegrate', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-safegate-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('false when the project is not CocoaPods-integrated', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: false,
    });
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(false);
  });

  it('false when there is no target project at all', () => {
    expect(shouldAutoDeintegrate(tempDir, null)).toBe(false);
  });

  it('false for a CocoaPods project whose Podfile has third-party pods', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(
      path.join(tempDir, 'Podfile'),
      "target 'MyApp' do\n  use_react_native!\n  pod 'MBProgressHUD'\nend\n",
    );
    gitInitAndCommit(tempDir);
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(false);
  });

  it('false when the pbxproj has uncommitted edits (not revertible)', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(
      path.join(tempDir, 'Podfile'),
      "target 'MyApp' do\n  use_react_native!\nend\n",
    );
    gitInitAndCommit(tempDir);
    // Dirty the pbxproj itself after the commit → conversion not revertible.
    fs.appendFileSync(
      path.join(xcodeproj, 'project.pbxproj'),
      '\n// local edit\n',
    );
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(false);
  });

  it('true despite an unrelated dirty file when pbxproj + Podfile are clean', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(
      path.join(tempDir, 'Podfile'),
      "target 'MyApp' do\n  config = use_native_modules!\n  use_react_native!(:path => config[:reactNativePath])\nend\n",
    );
    gitInitAndCommit(tempDir);
    // A dirty lockfile / untracked file elsewhere must NOT block — the
    // conversion only touches the pbxproj + Podfile, which stay clean.
    fs.writeFileSync(path.join(tempDir, 'package-lock.json'), '{}');
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(true);
  });

  it('false when Podfile.bak exists, which the conversion would overwrite', () => {
    const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(
      path.join(tempDir, 'Podfile'),
      "target 'MyApp' do\n  use_react_native!\nend\n",
    );
    fs.writeFileSync(
      path.join(tempDir, 'Podfile.bak'),
      "target 'Old' do\nend\n",
    );
    gitInitAndCommit(tempDir);
    expect(shouldAutoDeintegrate(tempDir, xcodeproj)).toBe(false);
  });

  describe('third-party pod detection', () => {
    function podfileWith(line) {
      return `target 'MyApp' do\n  use_react_native!\n${line}\nend\n`;
    }

    function autoDeintegrates(podfile) {
      const xcodeproj = mkXcodeproj(tempDir, 'MyApp.xcodeproj', {
        cocoapods: true,
      });
      fs.writeFileSync(path.join(tempDir, 'Podfile'), podfile);
      gitInitAndCommit(tempDir);
      return shouldAutoDeintegrate(tempDir, xcodeproj);
    }

    it.each([
      ["  pod 'MBProgressHUD'"],
      ['  pod "MBProgressHUD"'],
      ["  pod('Firebase/Analytics')"],
      ['  pod ("Firebase/Analytics")'],
      ["  pod( 'Firebase/Analytics', '~> 10.0')"],
      ["target 'App' do; pod('Foo'); end"],
      ["  use_frameworks!; pod 'Foo'"],
    ])('detects %s', line => {
      expect(autoDeintegrates(podfileWith(line))).toBe(false);
    });

    it.each([
      ["  # pod 'MBProgressHUD'"],
      ["  podspec :path => '../MyLib.podspec'"],
      ["  pods_root = 'Pods'"],
      ["  pod_targets = ['MyApp']"],
      ["  # use_frameworks!; pod 'MBProgressHUD'"],
      ["  use_frameworks!; podspec :path => '../MyLib.podspec'"],
    ])('ignores %s', line => {
      expect(autoDeintegrates(podfileWith(line))).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CocoaPods conversion is reversible: `--deintegrate` moves the Podfile aside
// as Podfile.bak instead of editing it, and `deinit` moves it back.
// ---------------------------------------------------------------------------

describe('Podfile backup and restore', () => {
  // Same shape as private/helloworld/ios/Podfile: a multi-line
  // use_react_native! call and a post_install hook, which line-based
  // stripping would leave as invalid Ruby.
  const STOCK_PODFILE = [
    'require_relative "../node_modules/react-native/scripts/react_native_pods"',
    '',
    'platform :ios, min_ios_version_supported',
    'prepare_react_native_project!',
    '',
    "target 'MyApp' do",
    '  config = use_native_modules!',
    '',
    '  use_react_native!(',
    '    :path => config[:reactNativePath],',
    '    :app_path => "#{Pod::Config.instance.installation_root}/.."',
    '  )',
    '',
    '  post_install do |installer|',
    '    react_native_post_install(',
    '      installer,',
    '      config[:reactNativePath],',
    '      :mac_catalyst_enabled => false',
    '    )',
    '  end',
    'end',
    '',
  ].join('\n');
  const PODFILE_WITH_THIRD_PARTY_POD = STOCK_PODFILE.replace(
    '  config = use_native_modules!\n',
    "  config = use_native_modules!\n  pod 'Foo'\n",
  );

  let appRoot;
  let podfilePath;
  let backupPath;
  let logSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-podfile-backup-'));
    podfilePath = path.join(appRoot, 'Podfile');
    backupPath = path.join(appRoot, 'Podfile.bak');
    mockPodCalls.length = 0;
    jest.spyOn(process, 'cwd').mockReturnValue(appRoot);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.exitCode = undefined;
    mockAutolinkingSourceDir = null;
    mockInjectorCalls = null;
    fs.rmSync(appRoot, {recursive: true, force: true});
  });

  // `spm add` that runs to the end offline: a successful config command,
  // complete local artifact slots, and a recording injector.
  function runAdd(...flags) {
    const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-artifacts-'));
    writeCompleteArtifactSlot(artifacts, 'debug');
    writeCompleteArtifactSlot(artifacts, 'release');
    mockAutolinkingSourceDir = appRoot;
    mockInjectorCalls = [];
    return main([
      'add',
      ...flags,
      '--skip-codegen',
      '--version',
      '0.85.0',
      '--download',
      'skip',
      '--artifacts',
      artifacts,
    ]).finally(() => fs.rmSync(artifacts, {recursive: true, force: true}));
  }

  function expectCocoaPodsAdvice() {
    expect(errors()).toContain('CocoaPods-integrated');
    expect(errors()).toMatch(/only React Native[^\n]*`spm add --deintegrate`/);
    expect(errors()).toContain('Keeping non-RN pods');
    expect(errors()).not.toContain('non-RN pods are fine');
  }

  function expectNoPipelineOutput(xcodeproj) {
    expect(mockPodCalls).not.toContainEqual(['deintegrate']);
    expect(fs.existsSync(path.join(appRoot, '.gitignore'))).toBe(false);
    expect(fs.existsSync(path.join(appRoot, 'build'))).toBe(false);
    expect(fs.existsSync(path.join(xcodeproj, SPM_INJECTED_MARKER))).toBe(
      false,
    );
  }

  function output(spy) {
    return spy.mock.calls.map(call => call.join(' ')).join('\n');
  }

  function errors() {
    return output(warnSpy) + '\n' + output(errorSpy);
  }

  function mkInjectedProject(markerFields = {}) {
    const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj');
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj', markerFields);
    return xcodeproj;
  }

  describe('add --deintegrate', () => {
    it('moves a stock Podfile aside as Podfile.bak, byte-identical and unedited', () => {
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      runDeintegrate(appRoot);

      expect(mockPodCalls).toContainEqual(['deintegrate']);
      expect(fs.existsSync(podfilePath)).toBe(false);
      expect(fs.readFileSync(backupPath, 'utf8')).toBe(STOCK_PODFILE);
    });

    it('fails loud and changes nothing when Podfile.bak already exists', () => {
      const olderBackup = "target 'Old' do\nend\n";
      fs.writeFileSync(podfilePath, STOCK_PODFILE);
      fs.writeFileSync(backupPath, olderBackup);

      expect(() => runDeintegrate(appRoot)).toThrow();

      expect(process.exitCode).toBe(1);
      expect(errors()).toContain('Podfile.bak already exists');
      expect(mockPodCalls).not.toContainEqual(['deintegrate']);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.readFileSync(backupPath, 'utf8')).toBe(olderBackup);
    });

    it('refuses before any change when the Podfile has non-React-Native pods', async () => {
      const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj', {
        cocoapods: true,
      });
      const pbxprojPath = path.join(xcodeproj, 'project.pbxproj');
      const pbxprojBefore = fs.readFileSync(pbxprojPath, 'utf8');
      fs.writeFileSync(podfilePath, PODFILE_WITH_THIRD_PARTY_POD);
      mockAutolinkingSourceDir = appRoot;

      await main(['add', '--deintegrate']);

      expect(process.exitCode).toBe(1);
      expect(errors()).toMatch(/pods?\b[^]*SwiftPM/i);
      expect(errors()).toMatch(/stop working/i);
      expectNoPipelineOutput(xcodeproj);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(
        PODFILE_WITH_THIRD_PARTY_POD,
      );
      expect(fs.existsSync(backupPath)).toBe(false);
      expect(fs.readFileSync(pbxprojPath, 'utf8')).toBe(pbxprojBefore);
    });

    it('refuses before any change when Podfile.bak already exists', async () => {
      const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj', {
        cocoapods: true,
      });
      const olderBackup = "target 'Old' do\nend\n";
      fs.writeFileSync(podfilePath, STOCK_PODFILE);
      fs.writeFileSync(backupPath, olderBackup);
      mockAutolinkingSourceDir = appRoot;

      await main(['add', '--deintegrate']);

      expect(process.exitCode).toBe(1);
      expect(errors()).toContain('Podfile.bak already exists');
      expectNoPipelineOutput(xcodeproj);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.readFileSync(backupPath, 'utf8')).toBe(olderBackup);
    });

    it('does not auto-convert on the zero-arg path when Podfile.bak already exists', async () => {
      const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj', {
        cocoapods: true,
      });
      const olderBackup = "target 'Old' do\nend\n";
      fs.writeFileSync(podfilePath, STOCK_PODFILE);
      fs.writeFileSync(backupPath, olderBackup);
      gitInitAndCommit(appRoot);
      mockAutolinkingSourceDir = appRoot;

      await main([]);

      expect(process.exitCode).toBe(1);
      expect(errors()).toContain('CocoaPods-integrated');
      expectNoPipelineOutput(xcodeproj);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.readFileSync(backupPath, 'utf8')).toBe(olderBackup);
    });

    it('refuses before any change when Podfile.bak is a dangling symlink', async () => {
      const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj', {
        cocoapods: true,
      });
      fs.writeFileSync(podfilePath, STOCK_PODFILE);
      fs.symlinkSync('missing-podfile', backupPath);

      await runAdd('--deintegrate');

      expect(process.exitCode).toBe(1);
      expect(errors()).toContain('Podfile.bak already exists');
      expectNoPipelineOutput(xcodeproj);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.readlinkSync(backupPath)).toBe('missing-podfile');
    });

    // Shows that expectNoPipelineOutput can fail: this run gets past every
    // refusal and writes what the refusal tests rule out.
    it('runs the pipeline when nothing refuses the conversion', async () => {
      mkXcodeproj(appRoot, 'MyApp.xcodeproj', {cocoapods: true});
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      await runAdd('--deintegrate');

      expect(mockPodCalls).toContainEqual(['deintegrate']);
      expect(fs.existsSync(path.join(appRoot, 'build'))).toBe(true);
      expect(fs.existsSync(path.join(appRoot, '.gitignore'))).toBe(true);
    });

    it('says when --deintegrate applies if the project is still CocoaPods-integrated after it', async () => {
      // The faked `pod deintegrate` leaves the pbxproj integrated.
      mkXcodeproj(appRoot, 'MyApp.xcodeproj', {cocoapods: true});
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      await runAdd('--deintegrate');

      expect(process.exitCode).toBe(1);
      expectCocoaPodsAdvice();
    });
  });

  it('says when --deintegrate applies on an explicit `spm add` of a CocoaPods project', async () => {
    const xcodeproj = mkXcodeproj(appRoot, 'MyApp.xcodeproj', {
      cocoapods: true,
    });
    fs.writeFileSync(podfilePath, PODFILE_WITH_THIRD_PARTY_POD);

    await runAdd();

    expect(process.exitCode).toBe(1);
    expectCocoaPodsAdvice();
    expectNoPipelineOutput(xcodeproj);
  });

  describe('deinit', () => {
    it('restores Podfile.bak to Podfile, byte-identical, and says to run `pod install`', async () => {
      mkInjectedProject();
      fs.writeFileSync(backupPath, STOCK_PODFILE);

      await main(['deinit']);

      expect(process.exitCode).toBeUndefined();
      expect(fs.existsSync(backupPath)).toBe(false);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(output(logSpy)).toContain('pod install');
    });

    it('leaves the Podfile untouched when there is no Podfile.bak', async () => {
      mkInjectedProject();
      fs.writeFileSync(podfilePath, STOCK_PODFILE);

      await main(['deinit']);

      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.existsSync(backupPath)).toBe(false);
    });

    it('fails loud and keeps both files when Podfile and Podfile.bak both exist', async () => {
      mkInjectedProject();
      const current = "target 'MyApp' do\nend\n";
      fs.writeFileSync(podfilePath, current);
      fs.writeFileSync(backupPath, STOCK_PODFILE);

      await main(['deinit']);

      expect(process.exitCode).toBe(1);
      expect(errors()).toContain('Podfile.bak');
      expect(errors()).toMatch(/\bPodfile\b(?!\.bak)/);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(current);
      expect(fs.readFileSync(backupPath, 'utf8')).toBe(STOCK_PODFILE);
    });

    it('fails loud and changes nothing when Podfile is a dangling symlink next to Podfile.bak', async () => {
      const xcodeproj = mkInjectedProject();
      const markerPath = path.join(xcodeproj, SPM_INJECTED_MARKER);
      const markerBefore = fs.readFileSync(markerPath, 'utf8');
      fs.symlinkSync('missing-podfile', podfilePath);
      fs.writeFileSync(backupPath, STOCK_PODFILE);

      await main(['deinit']);

      expect(process.exitCode).toBe(1);
      expect(errors()).toContain('Both Podfile and Podfile.bak exist');
      expect(fs.readlinkSync(podfilePath)).toBe('missing-podfile');
      expect(fs.readFileSync(backupPath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.readFileSync(markerPath, 'utf8')).toBe(markerBefore);
    });

    it('restores Podfile.bak even when no SPM injection is found', async () => {
      fs.writeFileSync(backupPath, STOCK_PODFILE);

      await main(['deinit']);

      expect(process.exitCode).toBeUndefined();
      expect(fs.existsSync(backupPath)).toBe(false);
      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(output(logSpy)).toContain('pod install');
    });

    it('does not claim there is nothing to do when it restores Podfile.bak', async () => {
      fs.writeFileSync(backupPath, STOCK_PODFILE);

      await main(['deinit']);

      expect(output(logSpy)).toContain('No SwiftPM injection found.');
      expect(output(logSpy)).not.toContain('nothing to remove');
    });

    it('says there is nothing to remove when there is nothing to do', async () => {
      await main(['deinit']);

      expect(output(logSpy)).toContain(
        'No SPM injection found — nothing to remove.',
      );
    });

    it('restores Podfile.bak even when removing an empty directory fails', async () => {
      mkInjectedProject();
      fs.mkdirSync(path.join(appRoot, 'ReactNativeSPM', 'Scripts'), {
        recursive: true,
      });
      fs.writeFileSync(backupPath, STOCK_PODFILE);
      jest.spyOn(fs, 'rmdirSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      await main(['deinit']);

      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.existsSync(backupPath)).toBe(false);
      expect(errors()).toContain('EACCES');
    });
  });

  describe('deinit undoes exactly the .gitignore lines add recorded', () => {
    const HEADER = '# SPM – auto-generated at build time (do not commit)';
    const ENTRIES = [
      'Package.resolved',
      'build/generated/',
      'build/xcframeworks/',
      '.build/',
    ];
    let gitignorePath;

    beforeEach(() => {
      gitignorePath = path.join(appRoot, '.gitignore');
    });

    // What `add` does to .gitignore, with its record stored in the marker.
    function add(previous = null) {
      const record = ensureGitignoreSpmEntries(appRoot, previous);
      mkInjectedProject({gitignore: record});
      return record;
    }

    // Only deinit's output counts as a note; add's own log line does not.
    async function deinit() {
      jest.clearAllMocks();
      await main(['deinit']);
    }

    function readGitignore() {
      return fs.readFileSync(gitignorePath, 'utf8');
    }

    function gitignoreNotes() {
      return [output(logSpy), errors()]
        .join('\n')
        .split('\n')
        .filter(line => line.includes('.gitignore'));
    }

    it('records the lines it appended, and none the file already had', () => {
      fs.writeFileSync(gitignorePath, 'node_modules/\nPackage.resolved\n');

      expect(add()).toEqual({
        created: false,
        lines: [HEADER, 'build/generated/', 'build/xcframeworks/', '.build/'],
      });
    });

    it('records that it created the file', () => {
      expect(add()).toEqual({created: true, lines: [HEADER, ...ENTRIES]});
    });

    it('keeps the record unchanged on a later run that appends nothing', () => {
      const first = add();

      expect(ensureGitignoreSpmEntries(appRoot, first)).toEqual(first);
    });

    it('deletes a .gitignore that add created and nobody changed', async () => {
      add();

      await deinit();

      expect(fs.existsSync(gitignorePath)).toBe(false);
    });

    it('removes only the lines add appended to an existing .gitignore', async () => {
      const userContent = 'node_modules/\n*.log\n';
      fs.writeFileSync(gitignorePath, userContent);
      add();

      await deinit();

      expect(readGitignore()).toBe(userContent);
    });

    it('keeps the entries the user already had', async () => {
      const userContent = 'node_modules/\nPackage.resolved\n';
      fs.writeFileSync(gitignorePath, userContent);
      add();
      expect(readGitignore()).not.toBe(userContent);

      await deinit();

      expect(readGitignore()).toBe(userContent);
    });

    it('leaves a .gitignore that already had every entry untouched', async () => {
      const userContent = ['node_modules/', HEADER, ...ENTRIES, ''].join('\n');
      fs.writeFileSync(gitignorePath, userContent);
      add();

      await deinit();

      expect(readGitignore()).toBe(userContent);
      expect(gitignoreNotes()).toEqual([]);
    });

    it('keeps an empty .gitignore the user had', async () => {
      fs.writeFileSync(gitignorePath, '');
      add();

      await deinit();

      expect(readGitignore()).toBe('');
    });

    it('keeps lines the user added to a .gitignore add created, and says so in one line', async () => {
      add();
      fs.appendFileSync(gitignorePath, '\n# mine\nsecrets/\n');

      await deinit();

      expect(readGitignore()).toBe('\n# mine\nsecrets/\n');
      expect(gitignoreNotes()).toHaveLength(1);
    });

    it('keeps a recorded line the user edited, and says so in one line', async () => {
      add();
      fs.writeFileSync(
        gitignorePath,
        readGitignore().replace('build/generated/\n', 'build/generated/**\n'),
      );

      await deinit();

      expect(readGitignore()).toBe('build/generated/**\n');
      expect(gitignoreNotes()).toHaveLength(1);
      expect(process.exitCode).toBeUndefined();
    });

    it('leaves .gitignore alone when the marker has no record (an older add)', async () => {
      ensureGitignoreSpmEntries(appRoot);
      mkInjectedProject();
      const before = readGitignore();

      await deinit();

      expect(readGitignore()).toBe(before);
      expect(gitignoreNotes()).toEqual([]);
    });

    it('leaves .gitignore alone when there is no marker', async () => {
      const userContent = ['node_modules/', '', HEADER, ...ENTRIES, ''].join(
        '\n',
      );
      fs.writeFileSync(gitignorePath, userContent);

      await deinit();

      expect(readGitignore()).toBe(userContent);
    });

    it('also removes an entry that a later add appended', async () => {
      const userContent = 'node_modules/\n';
      const olderLines = [HEADER, ...ENTRIES.slice(0, 3)];
      fs.writeFileSync(
        gitignorePath,
        userContent + ['', ...olderLines, ''].join('\n'),
      );
      const record = add({created: false, lines: olderLines});
      expect(record.lines).toEqual([...olderLines, HEADER, '.build/']);

      await deinit();

      expect(readGitignore()).toBe(userContent);
    });

    it('restores Podfile.bak even when the .gitignore cleanup fails', async () => {
      add();
      fs.writeFileSync(backupPath, STOCK_PODFILE);
      const readFileSync = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...rest) => {
        if (file === gitignorePath) {
          throw new Error('EIO: i/o error');
        }
        return readFileSync(file, ...rest);
      });

      await deinit();

      expect(fs.readFileSync(podfilePath, 'utf8')).toBe(STOCK_PODFILE);
      expect(fs.existsSync(backupPath)).toBe(false);
      expect(gitignoreNotes().join('\n')).toContain('EIO');
    });

    describe('add hands the injector the record it wrote', () => {
      it('records a .gitignore that add created', async () => {
        mkXcodeproj(appRoot, 'MyApp.xcodeproj');

        await runAdd();

        expect(process.exitCode).toBeUndefined();
        expect(mockInjectorCalls).toHaveLength(1);
        expect(mockInjectorCalls[0].gitignore).toEqual({
          created: true,
          lines: [HEADER, ...ENTRIES],
        });
      });

      it('extends the record of an earlier add from the marker', async () => {
        const olderLines = [HEADER, ...ENTRIES.slice(0, 3)];
        fs.writeFileSync(gitignorePath, ['', ...olderLines, ''].join('\n'));
        mkInjectedProject({gitignore: {created: true, lines: olderLines}});

        await runAdd();

        expect(mockInjectorCalls[0].gitignore).toEqual({
          created: true,
          lines: [...olderLines, HEADER, '.build/'],
        });
      });
    });
  });

  it('tells the user on the zero-arg conversion that `spm deinit` restores CocoaPods', async () => {
    mkXcodeproj(appRoot, 'MyApp.xcodeproj', {cocoapods: true});
    fs.writeFileSync(podfilePath, STOCK_PODFILE);
    gitInitAndCommit(appRoot);

    await main([]);

    const conversionMessage = output(logSpy)
      .split('\n')
      .find(line => line.includes('freshly-scaffolded CocoaPods project'));
    expect(conversionMessage).toContain('spm deinit');
    expect(conversionMessage).toMatch(/restor/i);
    expect(conversionMessage).not.toContain(
      'Revert with `git` or `spm deinit`',
    );
  });
});

// ---------------------------------------------------------------------------
// determineVersion — which RN version the artifact slots are wired to:
// explicit --version → the `artifactsVersionOverride` pinned in the injection
// marker by a previous `--version` → node_modules/react-native/package.json.
// ---------------------------------------------------------------------------

describe('determineVersion', () => {
  let appRoot;
  let reactNativeRoot;
  let logSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-version-app-'));
    reactNativeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-version-rn-'));
    fs.writeFileSync(
      path.join(reactNativeRoot, 'package.json'),
      JSON.stringify({name: 'react-native', version: '1000.0.0'}),
    );
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(appRoot, {recursive: true, force: true});
    fs.rmSync(reactNativeRoot, {recursive: true, force: true});
  });

  const logged = () => logSpy.mock.calls.map(c => c.join(' ')).join('\n');

  it('prefers an explicit --version over a pinned override', () => {
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj', {
      artifactsVersionOverride: '0.80.0',
    });

    expect(
      determineVersion({version: '0.81.0'}, reactNativeRoot, appRoot),
    ).toBe('0.81.0');
    expect(logged()).not.toMatch(/spm-injected\.json/);
  });

  it('uses the pinned override when --version is omitted', () => {
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj', {
      artifactsVersionOverride: '0.80.0',
    });

    expect(determineVersion({version: null}, reactNativeRoot, appRoot)).toBe(
      '0.80.0',
    );
  });

  it('names the marker in the log when the pin is the source', () => {
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj', {
      artifactsVersionOverride: '0.80.0',
    });
    determineVersion({version: null}, reactNativeRoot, appRoot);

    expect(logged()).toMatch(/0\.80\.0/);
    expect(logged()).toMatch(/spm-injected\.json/);
  });

  it("falls back to react-native's package.json with no pin recorded", () => {
    mkInjectedXcodeproj(appRoot, 'MyApp.xcodeproj');

    expect(determineVersion({version: null}, reactNativeRoot, appRoot)).toBe(
      '1000.0.0',
    );
    expect(logged()).not.toMatch(/spm-injected\.json/);
  });

  it("falls back to react-native's package.json when no project is injected", () => {
    mkXcodeproj(appRoot, 'MyApp.xcodeproj');

    expect(determineVersion({version: null}, reactNativeRoot, appRoot)).toBe(
      '1000.0.0',
    );
  });

  it('falls back without throwing when the marker is corrupt', () => {
    const xcodeproj = path.join(appRoot, 'MyApp.xcodeproj');
    fs.mkdirSync(xcodeproj, {recursive: true});
    fs.writeFileSync(path.join(xcodeproj, SPM_INJECTED_MARKER), '{not json');

    expect(determineVersion({version: null}, reactNativeRoot, appRoot)).toBe(
      '1000.0.0',
    );
  });
});

describe('resolveAppIosDeploymentTarget', () => {
  let appRoot;
  let logSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-setup-iosdt-'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(appRoot, {recursive: true, force: true});
  });

  function logged() {
    return logSpy.mock.calls.map(call => call.join(' ')).join('\n');
  }

  // No marker — the first `spm add`, where only --product-name identifies the
  // target among the fixture's two app targets.
  function mkTwoTargetProject() {
    const dir = path.join(appRoot, 'MyApp.xcodeproj');
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(
      path.join(dir, 'project.pbxproj'),
      twoAppTargets('16.4'),
      'utf8',
    );
  }

  it('reads the app target --product-name selects, not the lowest one', () => {
    mkTwoTargetProject();
    expect(resolveAppIosDeploymentTarget({productName: 'MyApp'}, appRoot)).toBe(
      '16.4',
    );
    expect(logged()).toContain(
      'iOS deployment target: 16.4 (from MyApp.xcodeproj)',
    );
  });

  it('names the reason alongside the default when no project could be picked', () => {
    expect(resolveAppIosDeploymentTarget({}, appRoot)).toBe('15.1');
    expect(logged()).toContain(
      'iOS deployment target: 15.1 (react-native default; no .xcodeproj found',
    );
  });
});
