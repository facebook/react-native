/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict-local
 * @format
 */

'use strict';

const fixtures = require('../__test_fixtures__/fixtures.js');
const generator = require('../GenerateViewConfigJs.js');

describe('GenerateViewConfigJs', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      const fixture = fixtures[fixtureName];

      it(`can generate fixture ${fixtureName}`, () => {
        expect(generator.generate(fixtureName, fixture)).toMatchSnapshot();
      });
    });

  it('can generate fixture with a deprecated view config name', () => {
    expect(
      generator.generate('DEPRECATED_VIEW_CONFIG_NAME', {
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
      }),
    ).toMatchSnapshot();
  });
});
