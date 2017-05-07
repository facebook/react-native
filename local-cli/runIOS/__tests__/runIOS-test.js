/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.dontMock('../runIOS');

const { getProductName } = require('../runIOS');

describe('runIOS', () => {
  it('Should get product name, single line', () => {
    expect(getProductName('export FULL_PRODUCT_NAME="Super App Dev.app"'))
      .toEqual('Super App Dev');
  });

  it('Should get product name, multi line', () => {
    expect(getProductName('export FRAMEWORK_VERSION=A\nexport FULL_PRODUCT_NAME="Super App Dev.app"\nexport GCC3_VERSION=3.3'))
      .toEqual('Super App Dev');
  });

  it('Should get the first product name if there are multiple', () => {
    expect(getProductName('export FULL_PRODUCT_NAME="Super App Dev.app"\nexport FULL_PRODUCT_NAME="Super App Dev2.app"'))
      .toEqual('Super App Dev');
  });

  it('Should get product name and skip app extensions (.appex)', () => {
    expect(getProductName('export FULL_PRODUCT_NAME="Evil App Dev.appex"\nexport FULL_PRODUCT_NAME="Super App Dev.app"\nexport FULL_PRODUCT_NAME="Evil App Dev2.appex"'))
      .toEqual('Super App Dev');
  });

  it('Should return null if no product name', () => {
    expect(getProductName('export FRAMEWORK_VERSION=A\nexport FULL_PRODUCT_NAME="Super App Dev"\nexport GCC3_VERSION=3.3'))
      .toEqual(null);
  });
});
