/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * All rights reserved.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const makeStringsPatch = require('../../android/patches/makeStringsPatch');

describe('makeStringsPatch', () => {
  it('should export a patch with <string> element', () => {
    const params = {
      keyA: 'valueA',
    };

    expect(makeStringsPatch(params, 'module').patch)
      .toContain('<string moduleConfig="true" name="module_keyA">valueA</string>');
  });

  it('should export an empty patch if no params given', () => {
    expect(makeStringsPatch({}, 'module').patch).toBe('');
  });
});
