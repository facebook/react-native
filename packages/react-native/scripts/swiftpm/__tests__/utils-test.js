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

const {setupSymlink} = require('../utils');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('setupSymlink', () => {
  let tempDir;
  let sourceFile;
  let destFile;
  let destDir;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'utils-test-'));
    sourceFile = path.join(tempDir, 'source.txt');
    destDir = path.join(tempDir, 'dest', 'subdir');
    destFile = path.join(destDir, 'dest.txt');

    // Create a source file
    fs.writeFileSync(sourceFile, 'test content');
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  it('should create destination directory if it does not exist', () => {
    expect(fs.existsSync(destDir)).toBe(false);

    setupSymlink(sourceFile, destFile);

    expect(fs.existsSync(destDir)).toBe(true);
  });

  it('should create symlink when source file exists', () => {
    setupSymlink(sourceFile, destFile);

    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('test content');
  });

  it('should remove existing symlink before creating new one', () => {
    // Create initial symlink
    fs.mkdirSync(destDir, {recursive: true});
    fs.symlinkSync(sourceFile, destFile);
    expect(fs.existsSync(destFile)).toBe(true);

    // Create another source file
    const newSourceFile = path.join(tempDir, 'newsource.txt');
    fs.writeFileSync(newSourceFile, 'new content');

    // Setup symlink should remove the old one and create new one
    setupSymlink(newSourceFile, destFile);

    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('new content');
  });

  it('should remove existing regular file before creating symlink', () => {
    // Create destination directory and regular file
    fs.mkdirSync(destDir, {recursive: true});
    fs.writeFileSync(destFile, 'regular file content');
    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(false);

    setupSymlink(sourceFile, destFile);

    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('test content');
  });

  it('should not create symlink when source file does not exist', () => {
    const nonExistentSource = path.join(tempDir, 'nonexistent.txt');

    setupSymlink(nonExistentSource, destFile);

    expect(fs.existsSync(destDir)).toBe(true); // Directory should still be created
    expect(fs.existsSync(destFile)).toBe(false); // But no symlink should be created
  });

  it('should work when destination directory already exists', () => {
    // Pre-create destination directory
    fs.mkdirSync(destDir, {recursive: true});

    setupSymlink(sourceFile, destFile);

    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('test content');
  });
});
