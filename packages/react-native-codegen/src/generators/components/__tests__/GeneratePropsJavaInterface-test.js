/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

const fixtures = require('../__test_fixtures__/fixtures.js');
const generator = require('../GeneratePropsJavaInterface.js');

describe('GeneratePropsJavaInterface', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      const fixture = fixtures[fixtureName];

      it(`can generate fixture ${fixtureName}`, () => {
        expect(generator.generate(fixtureName, fixture)).toMatchSnapshot();
      });
    });
});
