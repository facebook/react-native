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
  generatePbxproj,
  generateXcscheme,
} = require('../generate-spm-xcodeproj');

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
    expect(result).toContain(
      '/* Begin XCSwiftPackageProductDependency section */',
    );
    expect(result).toContain('ReactNative');
    expect(result).toContain('Autolinked');
    expect(result).toContain('ReactCodegen');
  });

  it('includes local package references', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain(
      '/* Begin XCLocalSwiftPackageReference section */',
    );
    expect(result).toContain('build/xcframeworks');
    expect(result).toContain('build/generated/autolinking');
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

  it('includes shell script build phases in correct order', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain('Sync SPM Autolinking');
    expect(result).toContain('npx react-native spm sync');
    expect(result).toContain('Build JS Bundle');
    // No VFS overlay phase anymore — headers come from the merged tree.
    expect(result).not.toContain('Prepare VFS Overlay');
    // Sync must run before the JS bundle phase.
    const syncIdx = result.indexOf('Sync SPM Autolinking');
    const bundleIdx = result.indexOf('Build JS Bundle');
    expect(syncIdx).toBeLessThan(bundleIdx);
  });

  it('sync script checks workspace lockfiles and hoisted node_modules', () => {
    const result = generatePbxproj(minimalOpts);
    expect(result).toContain('PROJECT_ROOT');
    expect(result).toContain('dirname');
    expect(result).toContain('pnpm-lock.yaml');
    expect(result).toContain('bun.lockb');
    expect(result).toContain('.pnp.cjs');
    expect(result).toContain('node_modules');
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

// ---------------------------------------------------------------------------
// generateXcscheme — pre-action for SPM autolinking sync
//
// Without the pre-action, our sync ran as a build phase AFTER Xcode's
// "Resolve Package Dependencies" step. Adding a dep then required two
// builds to take effect — the first build re-resolved against the old
// graph, the second saw the just-regenerated Package.swift. Moving the
// sync to a scheme PreAction makes it run BEFORE resolution.
// ---------------------------------------------------------------------------

describe('generateXcscheme', () => {
  const SYNC_SENTINEL = 'SYNC_SCRIPT_SENTINEL_MARKER';

  it('emits a PreActions block containing the sync script', () => {
    const result = generateXcscheme(
      'MyApp',
      'TARGET_UUID',
      'MyApp',
      SYNC_SENTINEL,
    );
    expect(result).toContain('<PreActions>');
    expect(result).toContain('</PreActions>');
    expect(result).toContain('Sync SPM Autolinking');
    expect(result).toContain(SYNC_SENTINEL);
  });

  it('pre-action references the target via EnvironmentBuildable so env vars inherit', () => {
    const result = generateXcscheme(
      'MyApp',
      'TARGET_UUID',
      'MyApp',
      SYNC_SENTINEL,
    );
    expect(result).toContain('<EnvironmentBuildable>');
    // The buildable inside EnvironmentBuildable must point at the same target
    // as the main BuildableReference, so SRCROOT / PROJECT_DIR / etc. resolve.
    const envBlock = result.slice(
      result.indexOf('<EnvironmentBuildable>'),
      result.indexOf('</EnvironmentBuildable>'),
    );
    expect(envBlock).toContain('BlueprintIdentifier = "TARGET_UUID"');
    expect(envBlock).toContain('BuildableName = "MyApp.app"');
    expect(envBlock).toContain('BlueprintName = "MyApp"');
  });

  it('XML-escapes shell-meta characters inside scriptText', () => {
    // Shell scripts have `>` (redirection), `&` (bg/and), `<` (heredoc); all
    // are XML special chars. Without escaping, the scheme XML is malformed
    // and Xcode silently ignores the pre-action — which would mask the very
    // bug we're fixing.
    const script =
      'echo "x" > /tmp/foo 2>&1; while read L; do :; done < /tmp/in';
    const result = generateXcscheme('MyApp', 'TARGET_UUID', 'MyApp', script);
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    // Raw `>` inside the scriptText attribute breaks the XML parser.
    // (Outside attributes, > is technically legal, so just assert the
    // problematic substring doesn't appear: the actual script text after
    // scriptText=" must not contain raw >, &, < before its closing quote.)
    const attrStart = result.indexOf('scriptText = "');
    const attrEnd = result.indexOf('"', attrStart + 'scriptText = "'.length);
    const attrValue = result.slice(
      attrStart + 'scriptText = "'.length,
      attrEnd,
    );
    expect(attrValue).not.toMatch(/[<>&](?!(amp|lt|gt|quot|apos);)/);
  });
});
