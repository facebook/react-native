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

const SliderSchema: SchemaType = {
  modules: {
    SliderSchema: {
      components: {
        Slider: {
          interfaceOnly: true,
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [
            {
              name: 'onChange',
              optional: true,
              bubblingType: 'bubble',
              typeAnnotation: {
                type: 'EventTypeAnnotation',
                argument: {
                  type: 'ObjectTypeAnnotation',
                  properties: [
                    {
                      type: 'FloatTypeAnnotation',
                      name: 'value',
                      optional: false,
                    },
                    {
                      type: 'BooleanTypeAnnotation',
                      name: 'fromUser',
                      optional: false,
                    },
                  ],
                },
              },
            },
            {
              name: 'onSlidingComplete',
              optional: true,
              bubblingType: 'direct',
              typeAnnotation: {
                type: 'EventTypeAnnotation',
                argument: {
                  type: 'ObjectTypeAnnotation',
                  properties: [
                    {
                      type: 'FloatTypeAnnotation',
                      name: 'value',
                      optional: false,
                    },
                    {
                      type: 'BooleanTypeAnnotation',
                      name: 'fromUser',
                      optional: false,
                    },
                  ],
                },
              },
            },
            {
              name: 'onValueChange',
              optional: true,
              bubblingType: 'bubble',
              typeAnnotation: {
                type: 'EventTypeAnnotation',
                argument: {
                  type: 'ObjectTypeAnnotation',
                  properties: [
                    {
                      type: 'FloatTypeAnnotation',
                      name: 'value',
                      optional: false,
                    },
                    {
                      type: 'BooleanTypeAnnotation',
                      name: 'fromUser',
                      optional: false,
                    },
                  ],
                },
              },
            },
          ],
          props: [
            {
              name: 'disabled',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
            {
              name: 'enabled',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
            {
              name: 'maximumTrackImage',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ImageSourcePrimitive',
              },
            },
            {
              name: 'maximumTrackTintColor',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
            {
              name: 'maximumValue',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 1,
              },
            },
            {
              name: 'minimumTrackImage',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ImageSourcePrimitive',
              },
            },
            {
              name: 'minimumTrackTintColor',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
            {
              name: 'minimumValue',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 0,
              },
            },
            {
              name: 'step',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 0,
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
            {
              name: 'thumbImage',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ImageSourcePrimitive',
              },
            },
            {
              name: 'trackImage',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ImageSourcePrimitive',
              },
            },
            {
              name: 'thumbTintColor',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
            {
              name: 'value',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 0,
              },
            },
          ],
        },
      },
    },
  },
};

module.exports = SliderSchema;
