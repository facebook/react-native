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
const generator = require('../GenerateViewConfigJs.js');

describe('GenerateViewConfigJs', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      const fixture = fixtures[fixtureName];

      it(`can generate fixture ${fixtureName}`, () => {
        const params: GeneratorParameters = {
          libraryName: fixtureName,
          schema: fixture,
        };
        expect(generator.generate(params)).toMatchSnapshot();
      });
    });

  it('can generate fixture with a deprecated view config name', () => {
    const params: GeneratorParameters = {
      libraryName: 'DEPRECATED_VIEW_CONFIG_NAME',
      schema: {
        modules: {
          Component: {
            type: 'Component',
            components: {
              NativeComponentName: {
                paperComponentNameDeprecated: 'DeprecatedNativeComponentName',
                extendsProps: [
                  {
                    type: 'ReactNativeBuiltInType',
                    knownTypeName: 'ReactNativeCoreViewProps',
                  },
                ],
                events: [],
                props: [],
                commands: [],
              },
            },
          },
        },
      },
    };
    expect(generator.generate(params)).toMatchSnapshot();
  });
});
