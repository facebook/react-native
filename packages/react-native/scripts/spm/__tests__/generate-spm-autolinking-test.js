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

const {generateAutolinkedPackageSwift} = require('../generate-spm-autolinking');

// ---------------------------------------------------------------------------
// generateAutolinkedPackageSwift
// ---------------------------------------------------------------------------

describe('generateAutolinkedPackageSwift', () => {
  it('empty targets produces valid Package.swift', () => {
    const result = generateAutolinkedPackageSwift([], null);
    expect(result).toContain('swift-tools-version: 6.0');
    expect(result).toContain('import PackageDescription');
    expect(result).toContain('.target(name: "AutolinkedStub"');
    expect(result).toContain('.library(name: "Autolinked", targets: ["AutolinkedStub"])');
  });

  it('empty targets with xcframeworksRelPath includes ReactNative dependency', () => {
    const result = generateAutolinkedPackageSwift(
      [],
      '../build/xcframeworks',
    );
    expect(result).toContain(
      '.package(name: "ReactNative", path: "../build/xcframeworks")',
    );
  });

  it('targets with xcfwHeaders include xcfwHeaders variable and flags', () => {
    const target = {
      name: 'MyModule',
      path: '../node_modules/my-module/ios',
      exclude: [],
      publicHeadersPath: '.',
    };
    const result = generateAutolinkedPackageSwift(
      [target],
      '../build/xcframeworks',
      '/some/path/React.xcframework/Headers',
      null,
    );
    expect(result).toContain('let xcfwHeaders');
    expect(result).toContain('-I", xcfwHeaders');
    expect(result).toContain('let vfsOverlay');
    expect(result).toContain('-ivfsoverlay');
  });

  it('targets with depsHeaders include depsHeaders variable', () => {
    const target = {
      name: 'MyModule',
      path: '../node_modules/my-module/ios',
      exclude: [],
      publicHeadersPath: null,
    };
    const result = generateAutolinkedPackageSwift(
      [target],
      '../build/xcframeworks',
      '/some/path/React.xcframework/Headers',
      '/some/path/ReactNativeDependencies.xcframework/Headers',
    );
    expect(result).toContain('let depsHeaders');
    expect(result).toContain('-I", depsHeaders');
  });

  it('targets with codegen paths include -I for codegen in cxxSettings', () => {
    const target = {
      name: 'MyModule',
      path: '../node_modules/my-module/ios',
      exclude: [],
      publicHeadersPath: null,
    };
    const result = generateAutolinkedPackageSwift(
      [target],
      '../build/xcframeworks',
      '/some/React.xcframework/Headers',
      '/some/ReactNativeDependencies.xcframework/Headers',
      '/app/build/generated/ios',
      '/app/build/generated/ios/ReactCodegen',
      '/app',
    );
    expect(result).toContain('appRoot + "/build/generated/ios"');
    expect(result).toContain(
      'appRoot + "/build/generated/ios/ReactCodegen"',
    );
  });

  it('emits xcfwHeaders even when xcfwHeadersPath is null (first-run before symlinks exist)', () => {
    const target = {
      name: 'MyModule',
      path: '../node_modules/my-module/ios',
      exclude: [],
      publicHeadersPath: null,
    };
    const result = generateAutolinkedPackageSwift(
      [target],
      '../build/xcframeworks',
      null, // xcfwHeadersPath is null (first run, symlinks don't exist)
      null, // depsXcfwHeadersPath is null
    );
    expect(result).toContain('let xcfwHeaders');
    expect(result).toContain('let vfsOverlay');
    expect(result).toContain('let depsHeaders');
    expect(result).toContain('-I", xcfwHeaders');
  });

  it('target with resources includes .copy directive', () => {
    const target = {
      name: 'MyModule',
      path: '../node_modules/my-module/ios',
      exclude: [],
      publicHeadersPath: null,
      resources: ['PrivacyInfo.xcprivacy'],
    };
    const result = generateAutolinkedPackageSwift([target], null);
    expect(result).toContain('.copy("PrivacyInfo.xcprivacy")');
  });

  it('target with exclude includes exclude list', () => {
    const target = {
      name: 'MyModule',
      path: '../node_modules/my-module/ios',
      exclude: ['tests/', 'package.json'],
      publicHeadersPath: null,
    };
    const result = generateAutolinkedPackageSwift([target], null);
    expect(result).toContain('exclude: ["tests/", "package.json"]');
  });

  it('target with publicHeadersPath includes it in output', () => {
    const target = {
      name: 'MyModule',
      path: '../node_modules/my-module/ios',
      exclude: [],
      publicHeadersPath: '.',
    };
    const result = generateAutolinkedPackageSwift([target], null);
    expect(result).toContain('publicHeadersPath: "."');
  });

  it('multiple targets listed in products', () => {
    const targets = [
      {name: 'Foo', path: '../foo', exclude: [], publicHeadersPath: null},
      {name: 'Bar', path: '../bar', exclude: [], publicHeadersPath: null},
    ];
    const result = generateAutolinkedPackageSwift(targets, null);
    expect(result).toContain('"Foo", "Bar"');
  });
});
