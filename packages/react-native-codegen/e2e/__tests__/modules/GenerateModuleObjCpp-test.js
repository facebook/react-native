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

const {parseFile} = require('../../../src/parsers/utils');
const FlowParser = require('../../../src/parsers/flow');
const generator = require('../../../src/generators/modules/GenerateModuleObjCpp');
const fs = require('fs');

import type {SchemaType} from '../../../src/CodegenSchema';

const FIXTURE_DIR = `${__dirname}/../../__test_fixtures__/modules`;

function getModules(): SchemaType {
  const filenames: Array<string> = fs.readdirSync(FIXTURE_DIR);
  return filenames.reduce<SchemaType>(
    (accumulator, file) => {
      const schema = parseFile(
        `${FIXTURE_DIR}/${file}`,
        FlowParser.buildSchema,
      );
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

describe('GenerateModuleObjCpp', () => {
  it('can generate a header file NativeModule specs', () => {
    const libName = 'RNCodegenModuleFixtures';
    const output = generator.generate(libName, getModules(), undefined, false);
    expect(output.get(libName + '.h')).toMatchSnapshot();
  });

  it('can generate a header file NativeModule specs with assume nonnull enabled', () => {
    const libName = 'RNCodegenModuleFixtures';
    const output = generator.generate(libName, getModules(), undefined, true);
    expect(output.get(libName + '.h')).toMatchSnapshot();
  });

  it('can generate an implementation file NativeModule specs', () => {
    const libName = 'RNCodegenModuleFixtures';
    const output = generator.generate(libName, getModules(), undefined, false);
    expect(output.get(libName + '-generated.mm')).toMatchSnapshot();
  });
});
