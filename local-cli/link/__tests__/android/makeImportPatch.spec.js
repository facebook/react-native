/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const makeImportPatch = require('../../android/patches/makeImportPatch');

const packageImportPath = 'import some.example.project';

describe('makeImportPatch', () => {
  it('should build a patch', () => {
    expect(Object.prototype.toString(makeImportPatch(packageImportPath)))
      .toBe('[object Object]');
  });

  it('MainActivity contains a correct import patch', () => {
    const {patch} = makeImportPatch(packageImportPath);

    expect(patch).toBe('\n' + packageImportPath);
  });
});
