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
  SCAFFOLDER_MARKER,
  emitScaffoldedPackageSwift,
  scaffoldAll,
  scaffoldPackageSwiftForDep,
  translatePodspecToSpmTarget,
} = require('../scaffold-package-swift');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Minimal PodspecModel fixture builder so each test stays focused on the
// field it exercises.
function podspec(overrides /*: Object */ = {}) {
  return {
    name: 'react-native-foo',
    version: '1.0',
    sourceFiles: [],
    publicHeaderFiles: [],
    privateHeaderFiles: [],
    excludeFiles: [],
    headerMappingsDir: null,
    headerDir: null,
    frameworks: [],
    weakFrameworks: [],
    libraries: [],
    dependencies: [],
    compilerFlags: [],
    headerSearchPaths: [],
    resources: [],
    requiresArc: true,
    warnings: [],
    partial: false,
    ...overrides,
  };
}

function autolinkedDep(overrides = {}) {
  return {
    name: 'react-native-foo',
    root: '/fake/node_modules/react-native-foo',
    platforms: {
      ios: {
        podspecPath:
          '/fake/node_modules/react-native-foo/react-native-foo.podspec',
      },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// translatePodspecToSpmTarget — pure: PodspecModel + AutolinkedDep →
// SpmScaffoldSpec. Buckets deps, substitutes Xcode tokens, validates names.
// ---------------------------------------------------------------------------

describe('translatePodspecToSpmTarget', () => {
  it('always uses toSwiftName(npm-name) as the SPM target name — header_dir does NOT change the target name', () => {
    // The autolinker registers every autolinked dep under toSwiftName(npmName)
    // in its aggregator. The scaffolded Package.swift's product MUST match
    // that or SPM resolution fails on the .product(name:, package:) lookup.
    // header_dir flows through headerSearchPaths instead.
    const model = podspec({
      headerDir: 'react/renderer/components/safeareacontext',
    });
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-safe-area-context'}),
    );
    expect(spec.swiftName).toBe('ReactNativeSafeAreaContext');
  });

  it('still uses toSwiftName(npm-name) even when header_dir is a plain identifier (matches autolinker registration)', () => {
    const model = podspec({headerDir: 'reanimated'});
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-reanimated'}),
    );
    expect(spec.swiftName).toBe('ReactNativeReanimated');
  });

  it('falls back cleanly when header_dir is absent', () => {
    const model = podspec({headerDir: null});
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-foo-bar'}),
    );
    expect(spec.swiftName).toBe('ReactNativeFooBar');
  });

  it('substitutes $(PODS_TARGET_SRCROOT) in HEADER_SEARCH_PATHS with the target-relative form', () => {
    const model = podspec({
      headerSearchPaths: ['$(PODS_TARGET_SRCROOT)/common/cpp'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.headerSearchPaths).toEqual(['common/cpp']);
  });

  it('drops HEADER_SEARCH_PATHS entries with unresolved Xcode tokens and warns', () => {
    const model = podspec({
      headerSearchPaths: [
        '$(PODS_TARGET_SRCROOT)/ok',
        '$(SOMETHING_UNKNOWN)/foo',
      ],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.headerSearchPaths).toEqual(['ok']);
    expect(spec.warnings.some(w => /SOMETHING_UNKNOWN/.test(w))).toBe(true);
  });

  it('buckets React-Core / React-jsi / RCT-Folly / glog into the single ReactNative product', () => {
    const model = podspec({
      dependencies: ['React-Core', 'React-jsi', 'RCT-Folly', 'glog'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.coreReactNative).toBe(true);
    expect(spec.siblingNames).toEqual([]);
  });

  it('routes sibling RN deps (react-native-*) into siblingNames', () => {
    const model = podspec({
      dependencies: ['React-Core', 'react-native-worklets'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.coreReactNative).toBe(true);
    expect(spec.siblingNames).toEqual(['react-native-worklets']);
  });

  it('warns + drops unknown non-RN dependencies (MMKV, AFNetworking)', () => {
    const model = podspec({dependencies: ['MMKV', 'AFNetworking']});
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.coreReactNative).toBe(false);
    expect(spec.siblingNames).toEqual([]);
    expect(spec.warnings.some(w => /MMKV/.test(w))).toBe(true);
    expect(spec.warnings.some(w => /AFNetworking/.test(w))).toBe(true);
  });

  it('silently drops cross-subspec refs like "react-native-foo/common" from the same podspec', () => {
    // CocoaPods uses this for one subspec depending on another from the
    // SAME spec — after flattenSubspecs merges everything into one SPM
    // target the ref is meaningless. Must not be treated as a sibling.
    const model = podspec({
      name: 'react-native-safe-area-context',
      dependencies: ['React-Core', 'react-native-safe-area-context/common'],
    });
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-safe-area-context'}),
    );
    expect(spec.siblingNames).toEqual([]);
    expect(spec.coreReactNative).toBe(true);
  });

  it('strips subspec suffix from sibling RN deps ("react-native-worklets/foo" → "react-native-worklets")', () => {
    const model = podspec({
      dependencies: ['react-native-worklets/foo', 'react-native-worklets/bar'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.siblingNames).toEqual(['react-native-worklets']);
  });

  it('passes through frameworks, weak frameworks, compiler flags, resources', () => {
    const model = podspec({
      frameworks: ['UIKit', 'CoreMotion'],
      weakFrameworks: ['SafariServices'],
      compilerFlags: ['-Wno-documentation'],
      resources: ['Foo.png'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.extraFrameworks).toEqual(['UIKit', 'CoreMotion']);
    expect(spec.weakFrameworks).toEqual(['SafariServices']);
    expect(spec.compilerFlags).toEqual(['-Wno-documentation']);
    expect(spec.resources).toEqual(['Foo.png']);
  });

  it('expands podspec source globs into explicit file paths against the dep root, and infers publicHeadersPath', () => {
    // Fake a dep on disk so glob expansion can find real files.
    const depDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-translate-'));
    try {
      fs.mkdirSync(path.join(depDir, 'ios', 'Sub'), {recursive: true});
      fs.writeFileSync(path.join(depDir, 'ios', 'Foo.h'), '');
      fs.writeFileSync(path.join(depDir, 'ios', 'Foo.mm'), '');
      fs.writeFileSync(path.join(depDir, 'ios', 'Sub', 'Bar.h'), '');
      const model = podspec({sourceFiles: ['ios/**/*.{h,m,mm}']});
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({root: depDir}),
      );
      // SPM rejects globs — these must be explicit relative paths now.
      expect(spec.sources).toEqual(
        expect.arrayContaining(['ios/Foo.h', 'ios/Foo.mm', 'ios/Sub/Bar.h']),
      );
      // publicHeadersPath is inferred from the first existing prefix dir
      // (so SPM's "publicHeadersPath defaults to non-existent include/"
      // error doesn't fire).
      expect(spec.publicHeadersPath).toBe('ios');
    } finally {
      fs.rmSync(depDir, {recursive: true, force: true});
    }
  });

  it('filters out files matching exclude_files globs after expansion', () => {
    const depDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-translate-'));
    try {
      fs.mkdirSync(path.join(depDir, 'ios', 'Fabric'), {recursive: true});
      fs.writeFileSync(path.join(depDir, 'ios', 'KeepMe.h'), '');
      fs.writeFileSync(path.join(depDir, 'ios', 'Fabric', 'SkipMe.h'), '');
      const model = podspec({
        sourceFiles: ['ios/**/*.h'],
        excludeFiles: ['ios/Fabric/**'],
      });
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({root: depDir}),
      );
      expect(spec.sources).toContain('ios/KeepMe.h');
      expect(spec.sources).not.toContain('ios/Fabric/SkipMe.h');
    } finally {
      fs.rmSync(depDir, {recursive: true, force: true});
    }
  });
});

// ---------------------------------------------------------------------------
// emitScaffoldedPackageSwift — pure: SpmScaffoldSpec → Swift string.
// Snapshot-style "contains" assertions on the key emitted lines.
// ---------------------------------------------------------------------------

describe('emitScaffoldedPackageSwift', () => {
  function baseSpec(overrides = {}) {
    return {
      swiftName: 'foo',
      sources: [],
      headerSearchPaths: [],
      coreReactNative: false,
      siblingNames: [],
      extraFrameworks: [],
      weakFrameworks: [],
      compilerFlags: [],
      publicHeadersPath: null,
      resources: [],
      warnings: [],
      ...overrides,
    };
  }

  it('starts with the SCAFFOLDER marker (and NOT the autolinker AUTOGEN marker)', () => {
    const out = emitScaffoldedPackageSwift(baseSpec());
    expect(out.startsWith(SCAFFOLDER_MARKER)).toBe(true);
    // The autolinker's marker — must be absent so isSelfManagedPackage
    // treats this file as self-managed.
    expect(out).not.toContain(
      '// AUTO-GENERATED by scripts/generate-spm-autolinking.js',
    );
  });

  it('includes a cache-slot label comment when provided (bumps SPM manifest hash on slot change)', () => {
    const out = emitScaffoldedPackageSwift(baseSpec(), {
      cacheSlotLabel: '0.87.0-nightly-20260513-abc/debug',
    });
    expect(out).toContain('// Cache slot: 0.87.0-nightly-20260513-abc/debug');
  });

  it('emits the appRoot walk-up Swift helper so the file works at any node_modules depth', () => {
    const out = emitScaffoldedPackageSwift(baseSpec());
    expect(out).toContain('let packageDir = URL(fileURLWithPath: #filePath)');
    expect(out).toContain('build/xcframeworks/Package.swift');
  });

  it('emits a header-search-path directive per podspec entry (.headerSearchPath("common/cpp"))', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({headerSearchPaths: ['common/cpp']}),
    );
    expect(out).toContain('.headerSearchPath("common/cpp")');
  });

  it('declares the ReactNative package + product when coreReactNative is true', () => {
    const out = emitScaffoldedPackageSwift(baseSpec({coreReactNative: true}));
    expect(out).toContain(
      '.package(name: "ReactNative", path: appRoot + "/build/xcframeworks")',
    );
    expect(out).toContain(
      '.product(name: "ReactNative", package: "ReactNative")',
    );
  });

  it('emits sibling .package(path: siblingPath("...")) + .product entries for sibling RN deps', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({siblingNames: ['react-native-worklets']}),
    );
    expect(out).toContain(
      '.package(name: "ReactNativeWorklets", path: siblingPath("react-native-worklets"))',
    );
    expect(out).toContain(
      '.product(name: "ReactNativeWorklets", package: "ReactNativeWorklets")',
    );
    // siblingPath helper itself
    expect(out).toContain('func siblingPath(_ name: String) -> String');
  });

  it('emits sources: array when podspec declared globs', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({sources: ['ios/**/*.{h,m,mm}', 'common/cpp/**/*.{cpp,h}']}),
    );
    expect(out).toContain('sources: [');
    expect(out).toContain('"ios/**/*.{h,m,mm}"');
    expect(out).toContain('"common/cpp/**/*.{cpp,h}"');
  });

  it('omits sources: line when no globs (SPM auto-scans target dir)', () => {
    const out = emitScaffoldedPackageSwift(baseSpec({sources: []}));
    expect(out).not.toContain('sources: [');
  });

  it('emits publicHeadersPath when header_mappings_dir set', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({publicHeadersPath: 'common/cpp/foo'}),
    );
    expect(out).toContain('publicHeadersPath: "common/cpp/foo"');
  });

  it('dedups linker frameworks (default + extras = no UIKit twice)', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({extraFrameworks: ['UIKit', 'CoreMotion']}),
    );
    const uikitCount = (out.match(/\.linkedFramework\("UIKit"\)/g) || [])
      .length;
    expect(uikitCount).toBe(1);
    expect(out).toContain('.linkedFramework("CoreMotion")');
  });

  it('embeds podspec compiler_flags into cxxSettings unsafeFlags', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({compilerFlags: ['-Wno-documentation']}),
    );
    expect(out).toContain('"-Wno-documentation"');
  });
});

// ---------------------------------------------------------------------------
// scaffoldPackageSwiftForDep — orchestrator with I/O. Tested via temp dirs;
// covers each skip rule + the happy path.
// ---------------------------------------------------------------------------

describe('scaffoldPackageSwiftForDep', () => {
  let appRoot;
  let depRoot;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-scaffold-app-'));
    depRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-scaffold-dep-'));
  });

  afterEach(() => {
    fs.rmSync(appRoot, {recursive: true, force: true});
    fs.rmSync(depRoot, {recursive: true, force: true});
  });

  function makePodspec() {
    // Minimal valid podspec — exercises the regex-parser fallback path.
    const podspecPath = path.join(depRoot, 'react-native-foo.podspec');
    fs.writeFileSync(
      podspecPath,
      `
Pod::Spec.new do |s|
  s.name = "react-native-foo"
  s.version = "1.0"
  s.source_files = "ios/**/*.{h,m,mm}"
  s.dependency "React-Core"
end
`,
    );
    return podspecPath;
  }

  function makeCtx(overrides = {}) {
    return {
      appRoot,
      projectRoot: appRoot,
      reactNativeRoot: appRoot,
      force: false,
      dryRun: false,
      cacheSlotLabel: null,
      ...overrides,
    };
  }

  function makeDep(overrides = {}) {
    return {
      name: 'react-native-foo',
      root: depRoot,
      platforms: {ios: {}},
      ...overrides,
    };
  }

  it('writes Package.swift into the dep root on the happy path', () => {
    makePodspec();
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('written');
    expect(fs.existsSync(path.join(depRoot, 'Package.swift'))).toBe(true);
    const content = fs.readFileSync(
      path.join(depRoot, 'Package.swift'),
      'utf8',
    );
    expect(content.startsWith(SCAFFOLDER_MARKER)).toBe(true);
  });

  it('reports previouslyExisted=false for first-time scaffolds (so the CLI can prompt)', () => {
    makePodspec();
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('written');
    if (result.status === 'written') {
      expect(result.previouslyExisted).toBe(false);
    }
  });

  it('reports previouslyExisted=true when regenerating an existing scaffolder-marker file (slot change)', () => {
    makePodspec();
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      `${SCAFFOLDER_MARKER}\n// Cache slot: OLD\n`,
    );
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({cacheSlotLabel: 'NEW'}),
    );
    expect(result.status).toBe('written');
    if (result.status === 'written') {
      expect(result.previouslyExisted).toBe(true);
    }
  });

  it('skips with skipped-no-ios when autolinking.json has no ios platform', () => {
    const result = scaffoldPackageSwiftForDep(
      makeDep({platforms: {ios: null}}),
      makeCtx(),
    );
    expect(result.status).toBe('skipped-no-ios');
  });

  it('skips with skipped-no-podspec when no .podspec exists in dep root', () => {
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-no-podspec');
  });

  it('refuses to touch a Package.swift that lacks the scaffolder marker (user/upstream-managed)', () => {
    makePodspec();
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      '// Hand-written. Do not touch.',
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-self-managed');
    // File unchanged
    expect(fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8')).toBe(
      '// Hand-written. Do not touch.',
    );
  });

  it('refuses to overwrite a Package.swift carrying the autolinker AUTOGEN_MARKER', () => {
    makePodspec();
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      '// AUTO-GENERATED by scripts/generate-spm-autolinking.js – do not edit.\n',
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-autogen');
  });

  it('skips re-scaffolding when the existing file carries the scaffolder marker AND the same cache slot', () => {
    makePodspec();
    // Pre-existing scaffold from same slot
    const prior =
      SCAFFOLDER_MARKER + '\n// Cache slot: 0.87.0-X/debug\n// rest unchanged';
    fs.writeFileSync(path.join(depRoot, 'Package.swift'), prior);
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({cacheSlotLabel: '0.87.0-X/debug'}),
    );
    expect(result.status).toBe('skipped-scaffolder-marker');
    expect(fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8')).toBe(
      prior,
    );
  });

  it('REGENERATES when the existing scaffolder file is from a different cache slot (manifest hash bump)', () => {
    makePodspec();
    const prior =
      SCAFFOLDER_MARKER + '\n// Cache slot: OLD-slot/debug\n// rest';
    fs.writeFileSync(path.join(depRoot, 'Package.swift'), prior);
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({cacheSlotLabel: 'NEW-slot/debug'}),
    );
    expect(result.status).toBe('written');
    expect(
      fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8'),
    ).toContain('// Cache slot: NEW-slot/debug');
  });

  it('--force re-overwrites a scaffolder-marker file even when the slot is unchanged', () => {
    makePodspec();
    const prior =
      SCAFFOLDER_MARKER +
      '\n// Cache slot: SLOT-A/debug\n// hand edits here will be lost';
    fs.writeFileSync(path.join(depRoot, 'Package.swift'), prior);
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({cacheSlotLabel: 'SLOT-A/debug', force: true}),
    );
    expect(result.status).toBe('written');
    expect(
      fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8'),
    ).not.toContain('hand edits here will be lost');
  });

  it('--dry-run produces a ScaffoldResult but writes nothing', () => {
    makePodspec();
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({dryRun: true}),
    );
    expect(result.status).toBe('written');
    expect(fs.existsSync(path.join(depRoot, 'Package.swift'))).toBe(false);
  });

  it("honors a dep's spm: { scaffold: false } opt-out in its react-native.config.js", () => {
    makePodspec();
    fs.writeFileSync(
      path.join(depRoot, 'react-native.config.js'),
      'module.exports = { spm: { scaffold: false } };',
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-opt-out');
  });

  it('returns skipped-is-react-native for `react-native` itself (handled by the xcframework path)', () => {
    const result = scaffoldPackageSwiftForDep(
      makeDep({name: 'react-native'}),
      makeCtx(),
    );
    expect(result.status).toBe('skipped-is-react-native');
  });
});

// ---------------------------------------------------------------------------
// scaffoldAll — minimal smoke test. The orchestrator delegates everything
// to scaffoldPackageSwiftForDep (already covered above); here we just
// verify it reads autolinking.json and produces one result per dep.
// ---------------------------------------------------------------------------

describe('scaffoldAll', () => {
  let appRoot;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-scaffold-all-'));
  });

  afterEach(() => {
    fs.rmSync(appRoot, {recursive: true, force: true});
  });

  it('returns [] and logs when autolinking.json is absent', () => {
    const results = scaffoldAll({
      appRoot,
      projectRoot: appRoot,
      reactNativeRoot: appRoot,
    });
    expect(results).toEqual([]);
  });

  it('walks dependencies in autolinking.json and produces one result per entry', () => {
    const autolinkingDir = path.join(appRoot, 'build/generated/autolinking');
    fs.mkdirSync(autolinkingDir, {recursive: true});
    fs.writeFileSync(
      path.join(autolinkingDir, 'autolinking.json'),
      JSON.stringify({
        dependencies: {
          'react-native-a': {root: '/no/such/a', platforms: {ios: {}}},
          'react-native-b': {root: '/no/such/b', platforms: {ios: null}},
        },
      }),
    );
    const results = scaffoldAll({
      appRoot,
      projectRoot: appRoot,
      reactNativeRoot: appRoot,
    });
    expect(results.length).toBe(2);
    expect(results.find(r => r.depName === 'react-native-b').status).toBe(
      'skipped-no-ios',
    );
    // react-native-a's root doesn't exist → skipped-no-podspec
    expect(results.find(r => r.depName === 'react-native-a').status).toBe(
      'skipped-no-podspec',
    );
  });
});
