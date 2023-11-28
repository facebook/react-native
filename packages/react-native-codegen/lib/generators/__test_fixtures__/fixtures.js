/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const SCHEMA_WITH_TM_AND_FC = {
  modules: {
    ColoredView: {
      type: 'Component',
      components: {
        ColoredView: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'color',
              optional: false,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
                default: null,
              },
            },
          ],
          commands: [],
        },
      },
    },
    NativeCalculator: {
      type: 'NativeModule',
      aliasMap: {},
      enumMap: {},
      spec: {
        properties: [
          {
            name: 'add',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
              },
              params: [
                {
                  name: 'a',
                  optional: false,
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  name: 'b',
                  optional: false,
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
        ],
      },
      moduleName: 'Calculator',
    },
  },
};
module.exports = {
  all: SCHEMA_WITH_TM_AND_FC,
};
