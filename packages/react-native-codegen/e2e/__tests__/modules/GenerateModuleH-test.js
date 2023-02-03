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

const {FlowParser} = require('../../../src/parsers/flow/parser');
const generator = require('../../../src/generators/modules/GenerateModuleH');
const fs = require('fs');

import type {SchemaType} from '../../../src/CodegenSchema';

const FIXTURE_DIR = `${__dirname}/../../__test_fixtures__/modules`;

const parser = new FlowParser();

function getModules(): SchemaType {
  const filenames: Array<string> = fs.readdirSync(FIXTURE_DIR);
  return filenames.reduce<SchemaType>(
    (accumulator, file) => {
      const schema = parser.parseFile(`${FIXTURE_DIR}/${file}`);
      return {
        modules: {
          ...accumulator.modules,
          ...schema.modules,
        },
      };
    },
    {modules: {}},
  );
}

describe('GenerateModuleH', () => {
  it('can generate a header file NativeModule specs', () => {
    const libName = 'RNCodegenModuleFixtures';
    const output = generator.generate(libName, getModules(), undefined, false);
    expect(output.get(libName + 'JSI.h')).toMatchSnapshot();
  });

  it('can generate a header file NativeModule specs with assume nonnull enabled', () => {
    const libName = 'RNCodegenModuleFixtures';
    const output = generator.generate(libName, getModules(), undefined, true);
    expect(output.get(libName + 'JSI.h')).toMatchSnapshot();
  });
});
