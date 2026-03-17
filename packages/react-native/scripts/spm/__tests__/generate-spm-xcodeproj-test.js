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

const {generatePbxproj} = require('../generate-spm-xcodeproj');

// ---------------------------------------------------------------------------
// generatePbxproj
// ---------------------------------------------------------------------------

describe('generatePbxproj', () => {
  const minimalOpts = {
    appName: 'TestApp',
    sourcePath: 'TestApp',
    iosVersion: '15',
    bundleIdentifier: 'com.test.TestApp',
    reactNativePath: '../../node_modules/react-native',
    files: {sources: [], headers: [], resources: [], plists: []},
    hasPrivacyInfo: false,
  };

  it('produces valid pbxproj with required sections', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toMatch(/^\/\/ !\$\*UTF8\*\$!/);
    expect(result).toContain('archiveVersion = 1;');
    expect(result).toContain('objectVersion = 77;');
    expect(result).toContain('/* Begin PBXProject section */');
    expect(result).toContain('/* Begin PBXNativeTarget section */');
    expect(result).toContain('/* Begin XCBuildConfiguration section */');
    expect(result).toContain('/* Begin XCConfigurationList section */');
  });

  it('generates deterministic UUIDs', () => {
    const a = generatePbxproj(minimalOpts);
    const b = generatePbxproj(minimalOpts);
    expect(a).toBe(b);
  });

  it('includes source files in PBXSourcesBuildPhase', () => {
    const result = generatePbxproj({
      ...minimalOpts,
      files: {
        sources: ['main.m', 'AppDelegate.mm'],
        headers: ['AppDelegate.h'],
        resources: [],
        plists: ['Info.plist'],
      },
    });
    expect(result).toContain('/* Begin PBXSourcesBuildPhase section */');
    expect(result).toContain('main.m in Sources');
    expect(result).toContain('AppDelegate.mm in Sources');
  });

  it('includes SPM product dependencies in frameworks phase', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain('/* Begin PBXFrameworksBuildPhase section */');
    expect(result).toContain('/* Begin XCSwiftPackageProductDependency section */');
    expect(result).toContain('ReactNative');
    expect(result).toContain('Autolinked');
    expect(result).toContain('ReactCodegen');
  });

  it('includes local package references', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain('/* Begin XCLocalSwiftPackageReference section */');
    expect(result).toContain('build/xcframeworks');
    expect(result).toContain('autolinked');
    expect(result).toContain('build/generated/ios');
  });

  it('includes resource build phase', () => {
    const result = generatePbxproj({
      ...minimalOpts,
      files: {
        sources: [],
        headers: [],
        resources: ['Images.xcassets'],
        plists: [],
      },
    });
    expect(result).toContain('Images.xcassets in Resources');
  });

  it('includes PrivacyInfo.xcprivacy when hasPrivacyInfo is true', () => {
    const result = generatePbxproj({
      ...minimalOpts,
      hasPrivacyInfo: true,
    });
    expect(result).toContain('PrivacyInfo.xcprivacy');
    expect(result).toContain('PrivacyInfo.xcprivacy in Resources');
  });

  it('includes shell script build phases', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain('Sync SPM Autolinking');
    expect(result).toContain('Build JS Bundle');
    expect(result).toContain('Copy Hermes Framework');
    expect(result).toContain('Prepare VFS Overlay');
  });

  it('generated pbxproj contains Sync SPM Autolinking build phase', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain('Sync SPM Autolinking');
    expect(result).toContain('sync-spm-autolinking.js');
  });

  it('Sync SPM Autolinking phase appears before Prepare VFS Overlay in buildPhases', () => {
    const result = generatePbxproj(minimalOpts);
    const syncIdx = result.indexOf('Sync SPM Autolinking');
    const vfsIdx = result.indexOf('Prepare VFS Overlay');
    expect(syncIdx).toBeGreaterThan(-1);
    expect(vfsIdx).toBeGreaterThan(-1);
    expect(syncIdx).toBeLessThan(vfsIdx);
  });

  it('sets correct build settings', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain('IPHONEOS_DEPLOYMENT_TARGET = 15');
    expect(result).toContain('PRODUCT_BUNDLE_IDENTIFIER = com.test.TestApp');
    expect(result).toContain('PRODUCT_NAME = TestApp');
  });

  it('bundle JS script does not contain hardcoded rn-tester entry file', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).not.toContain('RNTesterApp');
  });

  it('bundle JS script defaults entry file to index.js', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain('ENTRY_FILE');
    expect(result).toContain('index.js');
  });

  it('bundle JS script uses custom entry file when provided', () => {
    const result = generatePbxproj({
      ...minimalOpts,
      entryFile: 'js/MyApp.ios.js',
    });
    expect(result).toContain('js/MyApp.ios.js');
    expect(result).not.toContain('index.js');
  });
});
