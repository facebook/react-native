/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

'use strict';

const {transform: babelTransform} = require('@babel/core');
const fixtures = require('../__test_fixtures__/fixtures.js');

function transform(filename) {
  return babelTransform(fixtures[filename], {
    plugins: [require('@babel/plugin-syntax-flow'), require('../index')],
    babelrc: false,
    filename,
  }).code;
}

describe('Babel plugin inline view configs', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      it(`can inline config for ${fixtureName}`, () => {
        expect(transform(fixtureName)).toMatchSnapshot();
      });
    });
});
