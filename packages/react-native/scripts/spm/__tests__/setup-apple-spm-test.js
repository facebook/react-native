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
  cleanGeneratedState,
  decideLegacyMigration,
  detectStandardRnLayoutRedirect,
  findExistingSpmXcodeproj,
  findLegacyXcodeproj,
  gatherCleanTargets,
  podfileNeedsPatch,
  resolveAction,
} = require('../../setup-apple-spm');
const {SPM_MANAGED_MARKER} = require('../generate-spm-xcodeproj');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Helper: create an SPM-managed xcodeproj fixture (a directory containing
// the .spm-managed sidecar marker). Mirrors what generate-spm-xcodeproj.js
// writes at the end of generation.
function mkSpmManagedXcodeproj(appRoot, name) {
  const dir = path.join(appRoot, name);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, SPM_MANAGED_MARKER), '# managed\n');
  return dir;
}

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

  it('--project picks up marker-tagged xcodeprojs (new layout)', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    const result = gatherCleanTargets(tempDir, {project: true});
    const labels = result.map(t => t.label);
    expect(labels).toContain('MyApp.xcodeproj/');
  });

  it('--project emits a rename target restoring `<App>.xcodeproj.legacy` when present', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj.legacy'));
    const result = gatherCleanTargets(tempDir, {project: true});
    const rename = result.find(t => t.kind === 'rename');
    expect(rename).toBeDefined();
    if (rename != null && rename.kind === 'rename') {
      expect(rename.from).toBe(path.join(tempDir, 'MyApp.xcodeproj.legacy'));
      expect(rename.to).toBe(path.join(tempDir, 'MyApp.xcodeproj'));
    }
  });

  it('--project does NOT emit a rename when no .legacy backup exists', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    const result = gatherCleanTargets(tempDir, {project: true});
    expect(result.some(t => t.kind === 'rename')).toBe(false);
  });

  it('--derivedData matches `<App>-*` for marker-tagged xcodeprojs (new layout)', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    fs.mkdirSync(path.join(derivedRoot, 'MyApp-abc123'));
    fs.mkdirSync(path.join(derivedRoot, 'Unrelated-xyz'));
    const result = gatherCleanTargets(tempDir, {
      derivedData: true,
      derivedDataRoot: derivedRoot,
    });
    const labels = result.map(t => t.label);
    expect(labels.some(l => l.includes('MyApp-abc123'))).toBe(true);
    expect(labels.some(l => l.includes('Unrelated-xyz'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// cleanGeneratedState — executes the enumeration from gatherCleanTargets.
// Runs `delete`s before `rename`s so a `<App>.xcodeproj.legacy` → bare-name
// restoration doesn't collide with the still-present SPM xcodeproj.
// ---------------------------------------------------------------------------

describe('cleanGeneratedState', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-clean-state-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('reverses the migration: deletes SPM xcodeproj and restores .legacy', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj.legacy'));
    // Leave a sentinel inside the legacy so we can prove it's the restored dir.
    fs.writeFileSync(
      path.join(tempDir, 'MyApp.xcodeproj.legacy', 'sentinel.txt'),
      'legacy',
    );

    cleanGeneratedState(tempDir, {project: true});

    expect(fs.existsSync(path.join(tempDir, 'MyApp.xcodeproj.legacy'))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(tempDir, 'MyApp.xcodeproj'))).toBe(true);
    // No marker → it's the restored CocoaPods project, not the SPM one.
    expect(
      fs.existsSync(path.join(tempDir, 'MyApp.xcodeproj', SPM_MANAGED_MARKER)),
    ).toBe(false);
    expect(
      fs.readFileSync(
        path.join(tempDir, 'MyApp.xcodeproj', 'sentinel.txt'),
        'utf8',
      ),
    ).toBe('legacy');
  });

  it('--project without a .legacy backup just deletes the SPM xcodeproj', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    cleanGeneratedState(tempDir, {project: true});
    expect(fs.existsSync(path.join(tempDir, 'MyApp.xcodeproj'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectStandardRnLayoutRedirect — pure detection used by main() to decide
// whether to auto-redirect into the ios/ subdir. Non-destructive actions
// (init/update/sync/codegen/download/scaffold) redirect with a banner;
// clean refuses with formatRnRootMismatchMessage instead.
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

  it('returns null when the only `<App>.xcodeproj` carries the SPM marker (new layout, no CocoaPods)', () => {
    // After migration: legacy is renamed to `.legacy` and the SPM-generated
    // `<App>.xcodeproj` takes the canonical filename. findLegacyXcodeproj
    // must NOT misidentify the SPM project as a CocoaPods target.
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(findLegacyXcodeproj(tempDir)).toBeNull();
  });

  it('still finds a non-SPM xcodeproj when a marker-tagged one sits alongside it', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    fs.mkdirSync(path.join(tempDir, 'OtherApp.xcodeproj'));
    expect(findLegacyXcodeproj(tempDir)).toBe('OtherApp.xcodeproj');
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

  it('returns the absolute path to a marker-tagged xcodeproj (new layout)', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(findExistingSpmXcodeproj(tempDir)).toBe(
      path.join(tempDir, 'MyApp.xcodeproj'),
    );
  });

  it('returns the *-SPM.xcodeproj path as backward-compat fallback', () => {
    // Older generator output: name suffix, no marker file.
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    expect(findExistingSpmXcodeproj(tempDir)).toBe(
      path.join(tempDir, 'MyApp-SPM.xcodeproj'),
    );
  });

  it('prefers the marker-tagged xcodeproj when both naming styles are present', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(findExistingSpmXcodeproj(tempDir)).toBe(
      path.join(tempDir, 'MyApp.xcodeproj'),
    );
  });

  it('returns null when only a bare legacy xcodeproj exists (no marker)', () => {
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

// ---------------------------------------------------------------------------
// decideLegacyMigration — pure decision for the rename migration that hides
// the legacy CocoaPods xcodeproj from the community CLI's findXcodeProject
// (extension flips from `.xcodeproj` to `.legacy`). Driven by `spm init`.
// ---------------------------------------------------------------------------

describe('decideLegacyMigration', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-migrate-legacy-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('returns rename when an active legacy xcodeproj exists and no backup yet', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj'));
    expect(decideLegacyMigration(tempDir)).toEqual({
      kind: 'rename',
      from: 'MyApp.xcodeproj',
      to: 'MyApp.xcodeproj.legacy',
    });
  });

  it('skip-no-legacy when neither legacy nor -SPM exist', () => {
    expect(decideLegacyMigration(tempDir)).toEqual({kind: 'skip-no-legacy'});
  });

  it('skip-no-legacy when only the SPM xcodeproj is present', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    expect(decideLegacyMigration(tempDir)).toEqual({kind: 'skip-no-legacy'});
  });

  it('skip-already-migrated when only the .legacy backup is present', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj.legacy'));
    expect(decideLegacyMigration(tempDir)).toEqual({
      kind: 'skip-already-migrated',
      legacy: 'MyApp.xcodeproj.legacy',
    });
  });

  it('skip-conflict when BOTH active legacy and a .legacy backup exist', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj'));
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj.legacy'));
    expect(decideLegacyMigration(tempDir)).toEqual({
      kind: 'skip-conflict',
      from: 'MyApp.xcodeproj',
      to: 'MyApp.xcodeproj.legacy',
    });
  });

  it('ignores the SPM xcodeproj when computing the rename target', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj'));
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    expect(decideLegacyMigration(tempDir)).toEqual({
      kind: 'rename',
      from: 'MyApp.xcodeproj',
      to: 'MyApp.xcodeproj.legacy',
    });
  });

  it('returns skip-no-legacy when appRoot does not exist', () => {
    expect(decideLegacyMigration(path.join(tempDir, 'no-such-dir'))).toEqual({
      kind: 'skip-no-legacy',
    });
  });

  it('skip-no-legacy when a marker-tagged xcodeproj occupies the slot (post-migration steady state)', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(decideLegacyMigration(tempDir)).toEqual({kind: 'skip-no-legacy'});
  });

  it('skip-already-migrated when marker-tagged SPM + .legacy backup coexist', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj.legacy'));
    expect(decideLegacyMigration(tempDir)).toEqual({
      kind: 'skip-already-migrated',
      legacy: 'MyApp.xcodeproj.legacy',
    });
  });
});

// ---------------------------------------------------------------------------
// resolveAction — explicit action wins; otherwise auto-detect first-run via
// the presence of `<App>-SPM.xcodeproj/`. Fixes the silent-bootstrap bug
// where `npx react-native spm` (no arg) defaulted to `update` and skipped
// every one-time setup step (gitignore, legacy-rename prompt, Podfile patch).
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
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    expect(resolveAction('clean', tempDir)).toBe('clean');
    expect(resolveAction('init', tempDir)).toBe('init');
    expect(resolveAction('update', tempDir)).toBe('update');
    expect(resolveAction('scaffold', tempDir)).toBe('scaffold');
  });

  it('defaults to `init` when no -SPM.xcodeproj exists yet (first run)', () => {
    expect(resolveAction(null, tempDir)).toBe('init');
  });

  it('defaults to `update` when a marker-tagged xcodeproj exists (subsequent runs)', () => {
    mkSpmManagedXcodeproj(tempDir, 'MyApp.xcodeproj');
    expect(resolveAction(null, tempDir)).toBe('update');
  });

  it('defaults to `update` when only a legacy-named -SPM.xcodeproj exists (backward compat)', () => {
    fs.mkdirSync(path.join(tempDir, 'MyApp-SPM.xcodeproj'));
    expect(resolveAction(null, tempDir)).toBe('update');
  });

  it('ignores a legacy xcodeproj when computing the implicit default', () => {
    // Only the legacy CocoaPods project — no SPM xcodeproj yet → first run.
    fs.mkdirSync(path.join(tempDir, 'MyApp.xcodeproj'));
    expect(resolveAction(null, tempDir)).toBe('init');
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
