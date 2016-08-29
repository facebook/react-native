/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.autoMockOff();

const applyParams = require('../../android/patches/applyParams');

describe('applyParams', () => {
  it('apply params to the string', () => {
    expect(
      applyParams('${foo}', {foo: 'foo'}, 'react-native')
    ).toEqual('getResources().getString(R.string.reactNative_foo)');
  });

  it('use null if no params provided', () => {
    expect(
      applyParams('${foo}', {}, 'react-native')
    ).toEqual('null');
  });
});
