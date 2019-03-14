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

const ProgressViewSchema: SchemaType = {
  modules: {
    ProgressViewSchema: {
      components: {
        ProgressView: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'progress',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 0,
              },
            },
            {
              name: 'progressTintColor',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
            {
              name: 'trackTintColor',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
            {
              name: 'testID',
              optional: true,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
                default: '',
              },
            },
          ],
        },
      },
    },
  },
};

module.exports = ProgressViewSchema;
