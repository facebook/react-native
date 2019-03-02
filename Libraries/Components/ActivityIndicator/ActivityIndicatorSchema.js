/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {SchemaType} from '../../../packages/react-native-codegen/src/CodegenSchema.js';

const SwitchSchema: SchemaType = {
  modules: {
    ActivityIndicatorSchema: {
      components: {
        ActivityIndicatorView: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'hidesWhenStopped',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
            {
              name: 'animating',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
            {
              name: 'styleAttr',
              optional: true,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
                default: '',
              },
            },
            {
              name: 'color',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
            {
              name: 'size',
              optional: true,
              typeAnnotation: {
                type: 'StringEnumTypeAnnotation',
                default: 'small',
                options: [
                  {
                    name: 'small',
                  },
                  {
                    name: 'large',
                  },
                ],
              },
            },
            {
              name: 'intermediate',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
          ],
        },
      },
    },
  },
};

module.exports = SwitchSchema;
