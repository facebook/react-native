/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {SchemaType} from '../CodegenSchema.js';

const fixtures = require('../generators/components/__test_fixtures__/fixtures.js');
const schemaValidator = require('../SchemaValidator.js');

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
        /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        Module1: {
          type: 'Component',
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
              commands: [],
            },
          },
        },
        /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        Module2: {
          type: 'Component',
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
              commands: [],
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
