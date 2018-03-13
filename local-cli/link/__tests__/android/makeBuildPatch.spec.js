/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const makeBuildPatch = require('../../android/patches/makeBuildPatch');
const name = 'test';

describe('makeBuildPatch', () => {
  it('should build a patch function', () => {
    expect(Object.prototype.toString(makeBuildPatch(name)))
      .toBe('[object Object]');
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
