/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const xcode = require('xcode');
const getProducts = require('../../ios/getProducts');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::getProducts', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return an array of static libraries project exports', () => {
    const products = getProducts(project);
    expect(products.length).toBe(1);
    expect(products).toContain('libRCTActionSheet.a');
  });
});
