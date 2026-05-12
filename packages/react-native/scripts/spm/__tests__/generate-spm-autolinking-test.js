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
  collectSpmSources,
  expandSpmSourceGlobs,
  generateAutolinkedPackageSwift,
  generateSynthPackageSwift,
  linkHeaderTree,
} = require('../generate-spm-autolinking');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// generateAutolinkedPackageSwift — top-level aggregator
//
// Post-refactor shape: autolinked/Package.swift is a thin meta-package that
// references each autolinked dep as its own sub-package via .package(path:),
// and re-exports them via a single AutolinkedAggregate target. Per-dep
// settings (cFlags, cxxFlags, header paths, link order) live in each synth
// sub-package — see generateSynthPackageSwift below.
// ---------------------------------------------------------------------------

describe('generateAutolinkedPackageSwift (aggregator)', () => {
  it('emits a valid swift-tools-version 6.0 package with an Autolinked product backed by AutolinkedAggregate', () => {
    const result = generateAutolinkedPackageSwift({});
    expect(result).toContain('// swift-tools-version: 6.0');
    expect(result).toContain('import PackageDescription');
    expect(result).toContain(
      '.library(name: "Autolinked", targets: ["AutolinkedAggregate"])',
    );
    expect(result).toContain('name: "AutolinkedAggregate"');
  });

  it('references each npm dep as .package(path: "packages/<SwiftName>") and depends on its product', () => {
    const result = generateAutolinkedPackageSwift({
      npmDeps: [{swiftName: 'A'}, {swiftName: 'B'}],
    });
    expect(result).toContain('.package(name: "A", path: "packages/A")');
    expect(result).toContain('.package(name: "B", path: "packages/B")');
    expect(result).toContain('.product(name: "A", package: "A")');
    expect(result).toContain('.product(name: "B", package: "B")');
  });

  it('emits inline .target() blocks for each inlineTarget alongside AutolinkedAggregate', () => {
    const result = generateAutolinkedPackageSwift({
      inlineTargets: [
        {
          name: 'ScreenshotManager',
          path: 'sources/ScreenshotManager',
          exclude: [],
          publicHeadersPath: '.',
        },
      ],
      xcframeworksRelPath: '../build/xcframeworks',
      hasReactDep: true,
      hasXcfwHeaders: true,
      hasDepsHeaders: true,
    });
    // ReactNative dep is needed because inline targets reference it
    expect(result).toContain(
      '.package(name: "ReactNative", path: "../build/xcframeworks")',
    );
    // Aggregator depends on inline targets via .target(name: ...)
    expect(result).toContain('.target(name: "ScreenshotManager")');
    // Inline target's own declaration appears in the targets array
    expect(result).toMatch(
      /name: "ScreenshotManager",[\s\S]*?path: "sources\/ScreenshotManager"/,
    );
    // Inline target depends on the ReactNative product
    expect(result).toMatch(
      /name: "ScreenshotManager",[\s\S]*?\.product\(name: "ReactNative", package: "ReactNative"\)/,
    );
    // Inline target gets cFlags / linker frameworks
    expect(result).toContain('-ivfsoverlay');
    expect(result).toContain('.linkedFramework("CoreGraphics")');
  });

  it('mixes npm sub-package deps and inline targets in a single aggregator', () => {
    const result = generateAutolinkedPackageSwift({
      npmDeps: [{swiftName: 'NpmA'}],
      inlineTargets: [
        {
          name: 'LocalA',
          path: 'sources/LocalA',
          exclude: [],
          publicHeadersPath: '.',
        },
      ],
      xcframeworksRelPath: '../build/xcframeworks',
      hasReactDep: true,
      hasXcfwHeaders: true,
    });
    // Both forms of dep on AutolinkedAggregate
    expect(result).toContain('.product(name: "NpmA", package: "NpmA")');
    expect(result).toContain('.target(name: "LocalA")');
  });

  it('emits a stub aggregator when neither npmDeps nor inlineTargets are provided', () => {
    const result = generateAutolinkedPackageSwift({});
    expect(result).toContain('name: "AutolinkedAggregate"');
    expect(result).not.toContain('.package(name:');
  });
});

// ---------------------------------------------------------------------------
// generateSynthPackageSwift — per-dep synthesized Package.swift
//
// Each autolinked dep gets its own SPM package, written under
// autolinked/packages/<SwiftName>/Package.swift. Sources are mirrored into
// <packageDir>/Sources/<SwiftName>/ so SPM's path-containment check passes.
//
// The synth Package.swift embeds the dep's settings (cFlags, cxxFlags, header
// paths) and declares cross-package dependencies for its transitive
// spmDependencies as sibling synth packages at path "../<OtherName>".
// ---------------------------------------------------------------------------

describe('generateSynthPackageSwift', () => {
  function baseSpec(overrides /*: ?Object */) {
    return {
      swiftName: 'MyDep',
      exclude: [],
      publicHeadersPath: '.',
      spmDependencies: [],
      hasReactDep: true,
      hasXcfwHeaders: true,
      hasDepsHeaders: false,
      codegenHeadersIncluded: false,
      ...overrides,
    };
  }

  it('emits a valid Package with name/product matching swiftName', () => {
    const result = generateSynthPackageSwift(baseSpec());
    expect(result).toContain('// swift-tools-version: 6.0');
    expect(result).toContain('name: "MyDep"');
    expect(result).toContain('.library(');
    expect(result).toContain('name: "MyDep"');
    expect(result).toContain('targets: ["MyDep"]');
    // Target path points at the mirrored sources sub-dir
    expect(result).toContain('path: "Sources/MyDep"');
  });

  it('declares the library product as type: .dynamic so SPM framework-wraps it (enables <Module/Header.h> includes)', () => {
    const result = generateSynthPackageSwift(baseSpec());
    expect(result).toContain(
      '.library(name: "MyDep", type: .dynamic, targets: ["MyDep"])',
    );
  });

  it('depends on ReactNative via three-up relative path (autolinked/packages/<dep> → appRoot/build/xcframeworks)', () => {
    const result = generateSynthPackageSwift(baseSpec({hasReactDep: true}));
    expect(result).toContain(
      '.package(name: "ReactNative", path: "../../../build/xcframeworks")',
    );
    expect(result).toContain(
      '.product(name: "ReactNative", package: "ReactNative")',
    );
  });

  it('declares sibling synth packages at path "../<OtherName>" for each spmDependencies entry', () => {
    const result = generateSynthPackageSwift(
      baseSpec({spmDependencies: [{swiftName: 'CommonDep'}]}),
    );
    expect(result).toContain(
      '.package(name: "CommonDep", path: "../CommonDep")',
    );
    expect(result).toContain(
      '.product(name: "CommonDep", package: "CommonDep")',
    );
  });

  it('embeds xcfwHeaders / vfsOverlay flags when hasXcfwHeaders is true', () => {
    const result = generateSynthPackageSwift(baseSpec({hasXcfwHeaders: true}));
    expect(result).toContain('let xcfwHeaders');
    expect(result).toContain('let vfsOverlay');
    expect(result).toContain('"-ivfsoverlay"');
    expect(result).toContain('"-I", xcfwHeaders');
  });

  it('adds depsHeaders -I to cxxSettings only when hasDepsHeaders is true', () => {
    const result = generateSynthPackageSwift(
      baseSpec({hasXcfwHeaders: true, hasDepsHeaders: true}),
    );
    expect(result).toContain('let depsHeaders');
    expect(result).toContain('"-I", depsHeaders');
  });

  it('emits exclude list when given', () => {
    const result = generateSynthPackageSwift(
      baseSpec({exclude: ['tests/', 'broken.m']}),
    );
    expect(result).toContain('exclude: ["tests/", "broken.m"]');
  });

  it('omits publicHeadersPath when null (not all targets expose headers)', () => {
    const result = generateSynthPackageSwift(
      baseSpec({publicHeadersPath: null}),
    );
    expect(result).not.toContain('publicHeadersPath:');
  });

  it('links UIKit and Foundation frameworks by default', () => {
    const result = generateSynthPackageSwift(baseSpec());
    expect(result).toContain('.linkedFramework("UIKit")');
    expect(result).toContain('.linkedFramework("Foundation")');
  });

  // -------------------------------------------------------------------------
  // In-place mode: synth Package.swift lives in the dep's real source dir
  // (target.path = ".") with an absolute appRoot. Used by the production
  // emitter so Xcode can save source files normally (atomic-save through a
  // symlink in autolinked/ fails with NSFileNoSuchFileError).
  // -------------------------------------------------------------------------

  it('in-place mode: emits `let appRoot = "<abs>"` literally (no packageDir computation)', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      publicHeadersPath: 'include',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: '.',
      appRootAbsolute: '/abs/app/root',
    });
    expect(result).toContain('let appRoot = "/abs/app/root"');
    expect(result).not.toContain('packageDir');
    expect(result).toContain('path: "."');
  });

  it('in-place mode: ReactNative dep path uses `appRoot + "/build/xcframeworks"` expression', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: '.',
      appRootAbsolute: '/abs/app/root',
    });
    expect(result).toContain(
      '.package(name: "ReactNative", path: appRoot + "/build/xcframeworks")',
    );
  });

  it('in-place mode: sibling synth refs use absolute paths from siblingSynthAbsolutePaths', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: '.',
      appRootAbsolute: '/abs/app/root',
      spmDependencies: [{swiftName: 'CommonDep'}],
      siblingSynthAbsolutePaths: {CommonDep: '/abs/path/to/common'},
    });
    expect(result).toContain(
      '.package(name: "CommonDep", path: "/abs/path/to/common")',
    );
    expect(result).toContain(
      '.product(name: "CommonDep", package: "CommonDep")',
    );
  });

  it('in-place mode: throws when a sibling synth abs path is missing (signals a wiring bug)', () => {
    expect(() =>
      generateSynthPackageSwift({
        swiftName: 'MyDep',
        targetPath: '.',
        appRootAbsolute: '/abs',
        spmDependencies: [{swiftName: 'Missing'}],
        siblingSynthAbsolutePaths: {},
      }),
    ).toThrow(/siblingSynthAbsolutePaths\["Missing"\]/);
  });

  it('wrapper-dir mode: target.path = "root" (a dir symlink) so Xcode atomic-save works on real files', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: 'root',
      appRootAbsolute: '/abs/app/root',
      autogenHeadersAbsolute: '/abs/app/root/build/generated/autolinking/headers',
    });
    expect(result).toContain('path: "root"');
  });

  it('wrapper-dir mode: autogenHeadersAbsolute adds -I to cSettings + cxxSettings (replaces publicHeadersPath)', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: 'root',
      appRootAbsolute: '/abs/app',
      autogenHeadersAbsolute: '/abs/app/build/generated/autolinking/headers',
    });
    expect(result).toContain(
      '"-I", "/abs/app/build/generated/autolinking/headers"',
    );
    // The -I appears in both cSettings (Obj-C .m) and cxxSettings (.mm/.cpp).
    const matches = result.match(
      /"-I", "\/abs\/app\/build\/generated\/autolinking\/headers"/g,
    );
    expect(matches && matches.length).toBeGreaterThanOrEqual(2);
  });

  it('wrapper-dir mode: omits publicHeadersPath (headers route through -I instead)', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: 'root',
      appRootAbsolute: '/abs',
      autogenHeadersAbsolute: '/abs/headers',
      // publicHeadersPath intentionally not set
    });
    expect(result).not.toContain('publicHeadersPath:');
  });
});

// ---------------------------------------------------------------------------
// linkHeaderTree
//
// Mirrors header files from srcDir into a separate destDir via relative
// symlinks. Used for the centralized cross-package headers tree at
// <outputDir>/headers/<SwiftName>/.
// ---------------------------------------------------------------------------

describe('linkHeaderTree', () => {
  function makeTmpDirs() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-headers-'));
    const src = path.join(root, 'src');
    const dest = path.join(root, 'headers', 'MyDep');
    fs.mkdirSync(src, {recursive: true});
    return {root, src, dest};
  }

  it('symlinks each header from srcDir into destDir with a relative target', () => {
    const {src, dest} = makeTmpDirs();
    fs.writeFileSync(path.join(src, 'Foo.h'), '// foo\n');
    fs.writeFileSync(path.join(src, 'Foo.mm'), '// not a header — skip\n');

    linkHeaderTree(src, dest);

    const link = path.join(dest, 'Foo.h');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    // dest sits under root/headers/MyDep, src under root/src — relative target
    // walks up two levels then back down into src/.
    expect(fs.readlinkSync(link)).toBe('../../src/Foo.h');
    expect(fs.existsSync(path.join(dest, 'Foo.mm'))).toBe(false);
  });

  it('preserves nested header subdirs so <Name/Sub/Header.h> resolves (ReactCommonSamples case)', () => {
    const {src, dest} = makeTmpDirs();
    fs.mkdirSync(path.join(src, 'ReactCommon'));
    fs.writeFileSync(path.join(src, 'ReactCommon', 'Nested.h'), '// nested\n');

    linkHeaderTree(src, dest);

    const link = path.join(dest, 'ReactCommon', 'Nested.h');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(link)).toBe('../../../src/ReactCommon/Nested.h');
  });

  it('is idempotent: re-running with the same headers preserves symlink inodes', () => {
    const {src, dest} = makeTmpDirs();
    fs.writeFileSync(path.join(src, 'Stable.h'), '// h\n');

    linkHeaderTree(src, dest);
    const link = path.join(dest, 'Stable.h');
    const inoBefore = fs.lstatSync(link).ino;

    linkHeaderTree(src, dest);
    expect(fs.lstatSync(link).ino).toBe(inoBefore);
  });

  it('prunes symlinks for headers that no longer exist in srcDir', () => {
    const {src, dest} = makeTmpDirs();
    fs.writeFileSync(path.join(src, 'A.h'), '// a\n');
    fs.writeFileSync(path.join(src, 'B.h'), '// b\n');
    linkHeaderTree(src, dest);

    expect(fs.existsSync(path.join(dest, 'B.h'))).toBe(true);

    // Remove B.h from src and re-run; the stale symlink should be gone.
    fs.unlinkSync(path.join(src, 'B.h'));
    linkHeaderTree(src, dest);

    expect(fs.existsSync(path.join(dest, 'A.h'))).toBe(true);
    expect(fs.existsSync(path.join(dest, 'B.h'))).toBe(false);
  });

  it('removes destDir entirely when srcDir has no headers', () => {
    const {src, dest} = makeTmpDirs();
    // No header files in src — just a non-header.
    fs.writeFileSync(path.join(src, 'thing.mm'), '// impl\n');
    fs.mkdirSync(dest, {recursive: true});
    fs.writeFileSync(path.join(dest, 'Stale.h'), '// stale\n');

    linkHeaderTree(src, dest);

    expect(fs.existsSync(dest)).toBe(false);
  });
});


// ---------------------------------------------------------------------------
// collectSpmSources — recursive auto-discovery used as the default `sources:`
// allowlist. Skip-dirs (tests/, __tests__/, android/, …) are pruned at every
// depth. Anything not matching ALL_SOURCE_EXTENSIONS is left out (no .js,
// .podspec, .md, package.json, CMakeLists.txt).
// ---------------------------------------------------------------------------

describe('collectSpmSources', () => {
  function makeTmp() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'spm-sources-'));
  }

  it('returns every source file under sourcePath, sorted, forward-slash-separated', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'A.h'), '');
    fs.writeFileSync(path.join(dir, 'A.mm'), '');
    fs.mkdirSync(path.join(dir, 'Sub'));
    fs.writeFileSync(path.join(dir, 'Sub', 'B.cpp'), '');
    fs.writeFileSync(path.join(dir, 'Sub', 'B.hpp'), '');

    expect(collectSpmSources(dir)).toEqual([
      'A.h',
      'A.mm',
      'Sub/B.cpp',
      'Sub/B.hpp',
    ]);
  });

  it('ignores non-source files like .js, .ts, .podspec, .md, CMakeLists.txt, package.json', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'Module.mm'), '');
    fs.writeFileSync(path.join(dir, 'module.js'), '');
    fs.writeFileSync(path.join(dir, 'index.ts'), '');
    fs.writeFileSync(path.join(dir, 'My.podspec'), '');
    fs.writeFileSync(path.join(dir, 'README.md'), '');
    fs.writeFileSync(path.join(dir, 'CMakeLists.txt'), '');
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');

    expect(collectSpmSources(dir)).toEqual(['Module.mm']);
  });

  it('skips test/__tests__/__mocks__/jest/android/node_modules directories at the top level', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'Real.mm'), '');
    for (const skip of [
      'tests',
      '__tests__',
      '__mocks__',
      'test',
      'jest',
      'android',
      'node_modules',
    ]) {
      fs.mkdirSync(path.join(dir, skip));
      fs.writeFileSync(path.join(dir, skip, 'Hidden.mm'), '');
    }

    expect(collectSpmSources(dir)).toEqual(['Real.mm']);
  });

  it('skips skip-dirs at any nesting depth (the regression that motivated the switch)', () => {
    // NativeCxxModuleExample/tests/NativeCxxModuleExampleTests.cpp shape:
    // the test dir lives under a nested subdir, not at the source root.
    const dir = makeTmp();
    fs.mkdirSync(path.join(dir, 'NativeCxxModuleExample', 'tests'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(dir, 'NativeCxxModuleExample', 'NativeCxxModuleExample.mm'),
      '',
    );
    fs.writeFileSync(
      path.join(
        dir,
        'NativeCxxModuleExample',
        'tests',
        'NativeCxxModuleExampleTests.cpp',
      ),
      '',
    );

    expect(collectSpmSources(dir)).toEqual([
      'NativeCxxModuleExample/NativeCxxModuleExample.mm',
    ]);
  });

  it('returns an empty list when sourcePath does not exist', () => {
    expect(collectSpmSources('/no/such/dir/spm-test')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// expandSpmSourceGlobs — translates CocoaPods-style globs (e.g.
// 'ios/**/*.{h,m,mm}') into a sorted list of matching file paths. Skip-dir
// filtering still applies even when the pattern would otherwise match.
// ---------------------------------------------------------------------------

describe('expandSpmSourceGlobs', () => {
  function makeTmp() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'spm-globs-'));
  }

  it('** matches any depth, with brace alternation expanding extensions', () => {
    const dir = makeTmp();
    fs.mkdirSync(path.join(dir, 'ios', 'Sub'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'ios', 'Root.h'), '');
    fs.writeFileSync(path.join(dir, 'ios', 'Root.m'), '');
    fs.writeFileSync(path.join(dir, 'ios', 'Sub', 'Deep.mm'), '');
    fs.writeFileSync(path.join(dir, 'ios', 'ignored.txt'), '');

    expect(
      expandSpmSourceGlobs(dir, ['ios/**/*.{h,m,mm}']),
    ).toEqual(['ios/Root.h', 'ios/Root.m', 'ios/Sub/Deep.mm']);
  });

  it('single * stays within one segment', () => {
    const dir = makeTmp();
    fs.mkdirSync(path.join(dir, 'a', 'b'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'a', 'Foo.mm'), '');
    fs.writeFileSync(path.join(dir, 'a', 'b', 'Bar.mm'), '');

    expect(expandSpmSourceGlobs(dir, ['a/*.mm'])).toEqual(['a/Foo.mm']);
  });

  it('still skips SKIP_DIRS_DEFAULT even when the glob would match inside them', () => {
    const dir = makeTmp();
    fs.mkdirSync(path.join(dir, 'tests'));
    fs.writeFileSync(path.join(dir, 'Real.mm'), '');
    fs.writeFileSync(path.join(dir, 'tests', 'Hidden.mm'), '');

    expect(expandSpmSourceGlobs(dir, ['**/*.mm'])).toEqual(['Real.mm']);
  });

  it('multiple patterns are unioned and deduplicated', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'A.h'), '');
    fs.writeFileSync(path.join(dir, 'A.mm'), '');

    expect(expandSpmSourceGlobs(dir, ['*.h', '*.mm', '*.{h,mm}'])).toEqual([
      'A.h',
      'A.mm',
    ]);
  });

  it('returns an empty list when no pattern matches', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'A.mm'), '');

    expect(expandSpmSourceGlobs(dir, ['nope/*.swift'])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// generateSynthPackageSwift — sources: line rendering
// ---------------------------------------------------------------------------

describe('generateSynthPackageSwift (sources: allowlist)', () => {
  it('emits a multi-line sources: array when spec.sources is non-empty', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: '.',
      sources: ['root/A.mm', 'root/Sub/B.cpp'],
      appRootAbsolute: '/abs/app',
      autogenHeadersAbsolute: '/abs/app/headers',
    });
    expect(result).toContain('sources: [');
    expect(result).toContain('"root/A.mm"');
    expect(result).toContain('"root/Sub/B.cpp"');
    // Order matters for diff readability: sources: comes after path: and
    // before publicHeadersPath:.
    const sourcesIdx = result.indexOf('sources: [');
    const pathIdx = result.indexOf('path: "."');
    const publicHeadersIdx = result.indexOf('publicHeadersPath:');
    expect(pathIdx).toBeLessThan(sourcesIdx);
    if (publicHeadersIdx !== -1) {
      expect(sourcesIdx).toBeLessThan(publicHeadersIdx);
    }
  });

  it('omits sources: line when spec.sources is null or empty (falls back to SPM auto-scan)', () => {
    const a = generateSynthPackageSwift({
      swiftName: 'A',
      targetPath: '.',
      appRootAbsolute: '/abs',
    });
    const b = generateSynthPackageSwift({
      swiftName: 'B',
      targetPath: '.',
      sources: [],
      appRootAbsolute: '/abs',
    });
    expect(a).not.toContain('sources: [');
    expect(b).not.toContain('sources: [');
  });
});
