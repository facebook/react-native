/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict-local
 * @format
 */

'use strict';

const fixtures = require('../generators/__test_fixtures__/fixtures.js');
const schemaValidator = require('../SchemaValidator.js');

import type {SchemaType} from '../CodegenSchema.js';

const simpleProp = {
  name: 'disabled',
  optional: true,
  typeAnnotation: {
    type: 'BooleanTypeAnnotation',
    default: false,
  },
};

describe('SchemaValidator', () => {
  it('fails on components across modules with same name', () => {
    const fixture: SchemaType = {
      modules: {
        Module1: {
          components: {
            Component1: {
              extendsProps: [
                {
                  type: 'ReactNativeBuiltInType',
                  knownTypeName: 'ReactNativeCoreViewProps',
                },
              ],
              events: [],
              props: [simpleProp],
            },
          },
        },
        Module2: {
          components: {
            Component1: {
              extendsProps: [
                {
                  type: 'ReactNativeBuiltInType',
                  knownTypeName: 'ReactNativeCoreViewProps',
                },
              ],
              events: [],
              props: [simpleProp],
            },
          },
        },
      },
    };

    expect(schemaValidator.getErrors(fixture)).toMatchSnapshot();
  });
  it('fails on components with no props', () => {
    const fixture: SchemaType = {
      modules: {
        Switch: {
          components: {
            BooleanPropNativeComponent: {
              extendsProps: [
                {
                  type: 'ReactNativeBuiltInType',
                  knownTypeName: 'ReactNativeCoreViewProps',
                },
              ],
              events: [],
              props: [],
            },
          },
        },
      },
    };

    expect(schemaValidator.getErrors(fixture)).toMatchSnapshot();
  });

  describe('fixture', () => {
    Object.keys(fixtures)
      .sort()
      .forEach(fixtureName => {
        const fixture = fixtures[fixtureName];

        it(`${fixtureName} has no errors`, () => {
          expect(schemaValidator.getErrors(fixture)).toHaveLength(0);
        });
      });
  });
});
