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

import type {GeneratorParameters} from '../../Utils';

const fixtures = require('../__test_fixtures__/fixtures.js');
const generator = require('../GenerateModuleH.js');

describe('GenerateModuleH', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      const fixture = fixtures[fixtureName];

      it(`can generate fixture ${fixtureName}`, () => {
        const params: GeneratorParameters = {
          libraryName: fixtureName,
          schema: fixture,
          packageName: 'com.facebook.fbreact.specs',
          assumeNonnull: false,
        };
        expect(generator.generate(params)).toMatchSnapshot();
      });
    });
});
