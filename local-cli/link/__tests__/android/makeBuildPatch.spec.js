/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const makeBuildPatch = require('../../android/patches/makeBuildPatch');
const normalizeProjectName = require('../../android/patches/normalizeProjectName');

const name = 'test';
const scopedName = '@scoped/test';
const normalizedScopedName = normalizeProjectName('@scoped/test');

describe('makeBuildPatch', () => {
  it('should build a patch function', () => {
    expect(Object.prototype.toString(makeBuildPatch(name))).toBe(
      '[object Object]',
    );
  });

  it('should make a correct patch', () => {
    const {patch} = makeBuildPatch(name);
    expect(patch).toBe(`    compile project(':${name}')\n`);
  });

  it('should make a correct install check pattern', () => {
    const {installPattern} = makeBuildPatch(name);
    const match = `/\\s{4}(compile)(\\(|\\s)(project)\\(\\':${name}\\'\\)(\\)|\\s)/`;
    expect(installPattern.toString()).toBe(match);
  });
});

describe('makeBuildPatchWithScopedPackage', () => {
  it('should make a correct patch', () => {
    const {patch} = makeBuildPatch(scopedName);
    expect(patch).toBe(`    compile project(':${normalizedScopedName}')\n`);
  });

  it('should make a correct install check pattern', () => {
    const {installPattern} = makeBuildPatch(scopedName);
    const match = `/\\s{4}(compile)(\\(|\\s)(project)\\(\\':${normalizedScopedName}\\'\\)(\\)|\\s)/`;
    expect(installPattern.toString()).toBe(match);
  });
});
