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
const generator = require('../GenerateThirdPartyFabricComponentsProviderH.js');

describe('GenerateThirdPartyFabricComponentsProviderH', () => {
  it(`can generate fixtures`, () => {
    expect(generator.generate(fixtures)).toMatchSnapshot();
  });
});
