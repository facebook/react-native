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

import type {GeneratorParameters} from '../../../src/generators/Utils';

const generator = require('../../../src/generators/components/GenerateComponentDescriptorH');
const {FlowParser} = require('../../../src/parsers/flow/parser');
const fs = require('fs');

const FIXTURE_DIR = `${__dirname}/../../__test_fixtures__/components`;

const fixtures = fs.readdirSync(FIXTURE_DIR);

const parser = new FlowParser();

fixtures.forEach(fixture => {
  it(`GenerateComponentDescriptorH can generate for '${fixture}'`, () => {
    const libraryName = 'RNCodegenModuleFixtures';
    const schemaType = parser.parseFile(`${FIXTURE_DIR}/${fixture}`);
    const params: GeneratorParameters = {
      libraryName: libraryName,
      schema: schemaType,
      headerPrefix: `react/renderer/components/${libraryName}/`,
    };
    const output = generator.generate(params);
    expect(Object.fromEntries(output)).toMatchSnapshot();
  });
});
