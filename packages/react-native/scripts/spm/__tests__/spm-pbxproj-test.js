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
  fileTypeForExtension,
  generateUUID,
  quoteIfNeeded,
  scanProjectFiles,
  serializePbxproj,
} = require('../spm-pbxproj');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// generateUUID
// ---------------------------------------------------------------------------

describe('generateUUID', () => {
  it('produces a 24-character uppercase hex string', () => {
    const result = generateUUID('test-seed');
    expect(result).toMatch(/^[0-9A-F]{24}$/);
  });

  it('is deterministic', () => {
    expect(generateUUID('same')).toBe(generateUUID('same'));
  });

  it('produces different results for different seeds', () => {
    expect(generateUUID('seed-a')).not.toBe(generateUUID('seed-b'));
  });
});

// ---------------------------------------------------------------------------
// fileTypeForExtension
// ---------------------------------------------------------------------------

describe('fileTypeForExtension', () => {
  it.each([
    ['.m', 'sourcecode.c.objc'],
    ['.swift', 'sourcecode.swift'],
    ['.xcassets', 'folder.assetcatalog'],
    ['.h', 'sourcecode.c.h'],
    ['.xyz', 'file'],
  ])('maps %s to %s', (ext, expected) => {
    expect(fileTypeForExtension(ext)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// quoteIfNeeded
// ---------------------------------------------------------------------------

describe('quoteIfNeeded', () => {
  it.each([
    ['foo.bar/baz', 'foo.bar/baz'],
    ['foo bar', '"foo bar"'],
    ['a\\b', '"a\\\\b"'],
    ['a"b', '"a\\"b"'],
    ['<group>', '"<group>"'],
  ])('quoteIfNeeded(%j) => %j', (input, expected) => {
    expect(quoteIfNeeded(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// scanProjectFiles
// ---------------------------------------------------------------------------

describe('scanProjectFiles', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pbxproj-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('categorizes source files correctly', () => {
    fs.writeFileSync(path.join(tempDir, 'main.m'), '');
    fs.writeFileSync(path.join(tempDir, 'App.swift'), '');
    fs.writeFileSync(path.join(tempDir, 'Header.h'), '');
    fs.mkdirSync(path.join(tempDir, 'Assets.xcassets'));
    fs.writeFileSync(path.join(tempDir, 'Info.plist'), '');

    const result = scanProjectFiles(tempDir);
    expect(result.sources.sort()).toEqual(['App.swift', 'main.m']);
    expect(result.headers).toEqual(['Header.h']);
    expect(result.resources).toEqual(['Assets.xcassets']);
    expect(result.plists).toEqual(['Info.plist']);
  });

  it('skips dot-prefixed entries', () => {
    fs.writeFileSync(path.join(tempDir, '.hidden.m'), '');
    fs.writeFileSync(path.join(tempDir, 'visible.m'), '');

    const result = scanProjectFiles(tempDir);
    expect(result.sources).toEqual(['visible.m']);
  });

  it('walks subdirectories', () => {
    fs.mkdirSync(path.join(tempDir, 'sub'));
    fs.writeFileSync(path.join(tempDir, 'sub', 'file.cpp'), '');

    const result = scanProjectFiles(tempDir);
    expect(result.sources).toEqual(['sub/file.cpp']);
  });

  it('returns empty for non-existent directory', () => {
    const result = scanProjectFiles(path.join(tempDir, 'nonexistent'));
    expect(result).toEqual({
      sources: [],
      headers: [],
      resources: [],
      plists: [],
    });
  });
});

// ---------------------------------------------------------------------------
// serializePbxproj
// ---------------------------------------------------------------------------

describe('serializePbxproj', () => {
  it('produces valid pbxproj header', () => {
    const result = serializePbxproj('1', '77', 'ROOT_UUID', {});
    expect(result).toMatch(/^\/\/ !\$\*UTF8\*\$!/);
    expect(result).toContain('archiveVersion = 1;');
    expect(result).toContain('objectVersion = 77;');
    expect(result).toContain('rootObject = ROOT_UUID;');
  });

  it('serializes a section with entries', () => {
    const sections = {
      PBXBuildFile: [
        {
          uuid: 'ABC123',
          comment: 'test file',
          fields: {
            isa: 'PBXBuildFile',
            fileRef: 'DEF456',
          },
        },
      ],
    };
    const result = serializePbxproj('1', '77', 'ROOT', sections);
    expect(result).toContain('/* Begin PBXBuildFile section */');
    expect(result).toContain('/* End PBXBuildFile section */');
    expect(result).toContain('ABC123 /* test file */');
    expect(result).toContain('isa = PBXBuildFile;');
  });
});
