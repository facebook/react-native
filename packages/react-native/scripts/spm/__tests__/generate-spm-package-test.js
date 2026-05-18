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
  findSourcePath,
  generateXCFrameworksPackageSwift,
} = require('../generate-spm-package');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// generateXCFrameworksPackageSwift
// ---------------------------------------------------------------------------

describe('generateXCFrameworksPackageSwift', () => {
  it('renames React product to ReactNative', () => {
    const result = generateXCFrameworksPackageSwift([
      'React',
      'ReactNativeDependencies',
      'hermes-engine',
    ]);
    expect(result).toContain(
      '.library(name: "ReactNative", targets: ["React"])',
    );
    expect(result).toContain(
      '.library(name: "ReactNativeDependencies", targets: ["ReactNativeDependencies"])',
    );
    expect(result).toContain(
      '.library(name: "hermes-engine", targets: ["hermes-engine"])',
    );
  });

  it('lists binary targets', () => {
    const result = generateXCFrameworksPackageSwift([
      'React',
      'ReactNativeDependencies',
    ]);
    expect(result).toContain(
      '.binaryTarget(name: "React", path: "React.xcframework")',
    );
    expect(result).toContain(
      '.binaryTarget(name: "ReactNativeDependencies", path: "ReactNativeDependencies.xcframework")',
    );
  });

  it('includes auto-generated header comment', () => {
    const result = generateXCFrameworksPackageSwift(['React']);
    expect(result).toContain('AUTO-GENERATED');
    expect(result).toContain('swift-tools-version: 6.0');
    expect(result).toContain('name: "ReactNative"');
  });
});

// ---------------------------------------------------------------------------
// findSourcePath
// ---------------------------------------------------------------------------

describe('findSourcePath', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-find-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('finds directory matching derived name', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp'));
    expect(findSourcePath(tempDir, 'my-app')).toBe('MyApp');
  });

  it('falls back to ios directory', () => {
    fs.mkdirSync(path.join(tempDir, 'ios'));
    expect(findSourcePath(tempDir, 'unknown-pkg')).toBe('ios');
  });

  it('scans for directory with native sources', () => {
    fs.mkdirSync(path.join(tempDir, 'CustomDir'));
    fs.writeFileSync(path.join(tempDir, 'CustomDir', 'main.m'), '');
    expect(findSourcePath(tempDir, 'unrelated-name')).toBe('CustomDir');
  });

  it('returns derived name when nothing found', () => {
    expect(findSourcePath(tempDir, 'my-app')).toBe('MyApp');
  });
});
