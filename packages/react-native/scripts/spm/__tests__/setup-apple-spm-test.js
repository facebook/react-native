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
  describeRnRootMismatch,
  findExistingSpmXcodeproj,
  findLegacyXcodeproj,
  gatherCleanTargets,
  podfileNeedsPatch,
} = require('../../setup-apple-spm');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// gatherCleanTargets — pure enumeration of paths the `clean` action should
// remove. The current `clean` (no flags) returns just the generated dirs
// inside appRoot. Each opt-in flag (`project`, `derivedData`, `cache`) widens
// the deletion scope.
// ---------------------------------------------------------------------------

describe('gatherCleanTargets', () => {
  let tempDir;
  let derivedRoot;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-clean-'));
    derivedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-derived-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    fs.rmSync(derivedRoot, {recursive: true, force: true});
  });

  it('default (no opts) returns only the generated dirs inside appRoot', () => {
    const result = gatherCleanTargets(tempDir);
    expect(result.map(t => t.label).sort()).toEqual([
      '.build/',
      'autolinked/ (legacy)',
      'build/generated/',
      'build/xcframeworks/',
    ]);
    // All paths anchored under appRoot, never outside.
    for (const t of result) {
      expect(t.path.startsWith(tempDir)).toBe(true);
    }
  });

  it('--project adds any *-SPM.xcodeproj/ in appRoot', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    fs.mkdirSync(path.join(tempDir, 'Other-SPM.xcodeproj'));
    // A regular xcodeproj (not -SPM) should NOT be removed.
    fs.mkdirSync(path.join(tempDir, 'Legacy.xcodeproj'));

    const result = gatherCleanTargets(tempDir, {project: true});
    const labels = result.map(t => t.label).sort();
    expect(labels).toContain('MyApp-SPM.xcodeproj/');
    expect(labels).toContain('Other-SPM.xcodeproj/');
    expect(labels).not.toContain('Legacy.xcodeproj/');
  });

  it('--project without any xcodeproj is a no-op for the project scope', () => {
    const result = gatherCleanTargets(tempDir, {project: true});
    const labels = result.map(t => t.label);
    // Just the default generated targets — no Package.swift, no xcodeproj.
    expect(labels.some(l => l.endsWith('.xcodeproj/'))).toBe(false);
    expect(labels).not.toContain('Package.swift');
  });

  it('--derivedData removes only DerivedData entries that match a discovered *-SPM.xcodeproj prefix', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    // Two matching DerivedData entries + an unrelated one
    fs.mkdirSync(path.join(derivedRoot, 'MyApp-SPM-abc123'));
    fs.mkdirSync(path.join(derivedRoot, 'MyApp-SPM-def456'));
    fs.mkdirSync(path.join(derivedRoot, 'SomeOtherProject-xyz789'));

    const result = gatherCleanTargets(tempDir, {
      derivedData: true,
      derivedDataRoot: derivedRoot,
    });
    const labels = result.map(t => t.label);
    expect(labels.filter(l => l.includes('MyApp-SPM-abc123')).length).toBe(1);
    expect(labels.filter(l => l.includes('MyApp-SPM-def456')).length).toBe(1);
    expect(
      labels.filter(l => l.includes('SomeOtherProject-xyz789')).length,
    ).toBe(0);
  });

  it('--derivedData with no *-SPM.xcodeproj in appRoot skips DerivedData (cannot disambiguate)', () => {
    fs.mkdirSync(path.join(derivedRoot, 'MyApp-SPM-abc123'));
    const result = gatherCleanTargets(tempDir, {
      derivedData: true,
      derivedDataRoot: derivedRoot,
    });
    expect(result.some(t => t.label.includes('DerivedData'))).toBe(false);
  });

  it('--cache adds the cacheSlotDir when provided', () => {
    const slot = path.join(tempDir, 'fake-cache-slot');
    const result = gatherCleanTargets(tempDir, {
      cache: true,
      cacheSlotDir: slot,
    });
    expect(result.some(t => t.path === slot)).toBe(true);
  });

  it('--cache without cacheSlotDir is a no-op for the cache scope', () => {
    const result = gatherCleanTargets(tempDir, {cache: true});
    // Just the default generated targets.
    expect(result.length).toBe(4);
  });

  it('all three opts together combine deletion scopes additively', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    fs.mkdirSync(path.join(derivedRoot, 'MyApp-SPM-aaa'));
    const slot = path.join(tempDir, 'slot');

    const result = gatherCleanTargets(tempDir, {
      project: true,
      derivedData: true,
      cache: true,
      derivedDataRoot: derivedRoot,
      cacheSlotDir: slot,
    });
    const labels = result.map(t => t.label);
    // generated dirs (4) + xcodeproj + 1 DerivedData entry + 1 cache slot
    expect(result.length).toBe(7);
    expect(labels).toContain('MyApp-SPM.xcodeproj/');
    expect(labels.some(l => l.includes('MyApp-SPM-aaa'))).toBe(true);
    expect(result.some(t => t.path === slot)).toBe(true);
  });

  it('non-existent appRoot still returns generated-dir targets (caller filters by existence)', () => {
    const result = gatherCleanTargets(path.join(tempDir, 'does-not-exist'), {
      project: true,
    });
    // The function enumerates paths; existence is checked at deletion time.
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// describeRnRootMismatch — refuses runs that would silently produce broken
// builds. The community CLI writes autolinking.json under <project>/ios/...,
// but every SPM script anchors on cwd. Running from the JS root therefore
// (a) writes outputs to the wrong dir, and (b) makes the autolinker miss
// autolinking.json and skip every npm native dep. The guard catches the
// standard "RN app with separate ios/ subdir" layout and routes the user
// to `cd ios && ...`.
// ---------------------------------------------------------------------------

describe('describeRnRootMismatch', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-cwd-guard-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns a message when cwd === projectRoot AND a sibling ios/ exists', () => {
    fs.mkdirSync(path.join(tempDir, 'ios'));
    const result = describeRnRootMismatch(tempDir, tempDir);
    expect(result).not.toBeNull();
    expect(result).toMatch(/cd ios/);
  });

  it('returns null when running from a subdirectory (cwd !== projectRoot)', () => {
    fs.mkdirSync(path.join(tempDir, 'ios'));
    const result = describeRnRootMismatch(path.join(tempDir, 'ios'), tempDir);
    expect(result).toBeNull();
  });

  it('returns null for flat layouts (no ios/ subdir, e.g. rn-tester)', () => {
    // tempDir has no ios/ subdir
    const result = describeRnRootMismatch(tempDir, tempDir);
    expect(result).toBeNull();
  });

  it('returns null when a non-directory `ios` entry exists (e.g. a file)', () => {
    fs.writeFileSync(path.join(tempDir, 'ios'), '');
    const result = describeRnRootMismatch(tempDir, tempDir);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// findLegacyXcodeproj + podfileNeedsPatch — Podfile auto-patch helpers.
// CocoaPods refuses to choose between sibling xcodeprojs when the Podfile
// has no `project '...'` directive ("Could not automatically select an
// Xcode project"). These two helpers detect the situation; the CLI prompts
// the user to add the directive.
// ---------------------------------------------------------------------------

describe('findLegacyXcodeproj', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-legacy-xcodeproj-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns the non-SPM xcodeproj when both legacy and -SPM exist side-by-side', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj'));
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    expect(findLegacyXcodeproj(tempDir)).toBe('MyApp.xcodeproj');
  });

  it('returns null when only the SPM-generated xcodeproj is present (nothing to pin to)', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    expect(findLegacyXcodeproj(tempDir)).toBeNull();
  });

  it('returns null when appRoot does not exist', () => {
    expect(findLegacyXcodeproj(path.join(tempDir, 'no-such-dir'))).toBeNull();
  });

  it('ignores .xcodeproj files (not directories) — defensive', () => {
    fs.writeFileSync(path.join(tempDir, 'NotAProject.xcodeproj'), '');
    expect(findLegacyXcodeproj(tempDir)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// findExistingSpmXcodeproj — drives the create-if-missing branch of
// generateXcodeProject. The xcodeproj is committed to the repo and carries
// signing/capabilities/build phases, so regenerating it unconditionally would
// clobber Xcode-side edits. Returns the first `*-SPM.xcodeproj/` it finds at
// the top level of appRoot, or null.
// ---------------------------------------------------------------------------

describe('findExistingSpmXcodeproj', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-existing-xcodeproj-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns the absolute path to the *-SPM.xcodeproj when present', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    expect(findExistingSpmXcodeproj(tempDir)).toBe(
      path.join(tempDir, 'MyApp-SPM.xcodeproj'),
    );
  });

  it('returns null when no -SPM.xcodeproj exists (only legacy)', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj'));
    expect(findExistingSpmXcodeproj(tempDir)).toBeNull();
  });

  it('returns null when appRoot does not exist (e.g. first init)', () => {
    expect(
      findExistingSpmXcodeproj(path.join(tempDir, 'no-such-dir')),
    ).toBeNull();
  });

  it('ignores *.xcodeproj entries that are files, not directories', () => {
    fs.writeFileSync(path.join(tempDir, 'Fake-SPM.xcodeproj'), '');
    expect(findExistingSpmXcodeproj(tempDir)).toBeNull();
  });
});

describe('podfileNeedsPatch', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-podfile-patch-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  function writePodfile(content) {
    const p = path.join(tempDir, 'Podfile');
    fs.writeFileSync(p, content);
    return p;
  }

  it('returns null when the Podfile does not exist', () => {
    expect(podfileNeedsPatch(path.join(tempDir, 'no-such-Podfile'))).toBeNull();
  });

  it('returns null when the Podfile already has a top-level `project` directive', () => {
    const p = writePodfile(
      "platform :ios, '15.0'\nproject 'MyApp.xcodeproj'\n\ntarget 'MyApp' do\nend\n",
    );
    expect(podfileNeedsPatch(p)).toBeNull();
  });

  it('returns null when there is no `target ... do` block at all (unusual but possible)', () => {
    const p = writePodfile("platform :ios, '15.0'\n# no targets here\n");
    expect(podfileNeedsPatch(p)).toBeNull();
  });

  it('returns the insertion point (before the first target) when no project directive is present', () => {
    const podContent =
      "platform :ios, '15.0'\nprepare_react_native_project!\n\ntarget 'MyApp' do\n  use_react_native!()\nend\n";
    const p = writePodfile(podContent);
    const result = podfileNeedsPatch(p);
    expect(result).not.toBeNull();
    if (result != null) {
      expect(result.content).toBe(podContent);
      // The insertion point is the start of the line containing the first target.
      expect(
        podContent.slice(result.insertAt).startsWith("target 'MyApp' do"),
      ).toBe(true);
    }
  });

  it("ignores `project` references that aren't top-level directives (e.g. method args)", () => {
    // Hypothetical false positive: a `project` token inside a call/comment.
    // We only match `project '<...>.xcodeproj'` at start-of-line.
    const p = writePodfile(
      "# Note about the project 'foo.xcodeproj' goes here\ntarget 'MyApp' do\nend\n",
    );
    const result = podfileNeedsPatch(p);
    expect(result).not.toBeNull();
  });
});
