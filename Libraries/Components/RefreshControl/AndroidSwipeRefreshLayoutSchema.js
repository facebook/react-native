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

const AndroidSwipeRefreshLayoutSchema: SchemaType = {
  modules: {
    AndroidSwipeRefreshLayout: {
      components: {
        AndroidSwipeRefreshLayout: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [
            {
              name: 'onRefresh',
              optional: true,
              bubblingType: 'bubble',
              typeAnnotation: {
                type: 'EventTypeAnnotation',
                argument: {
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
              },
            },
          ],
          props: [
            {
              name: 'enabled',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: true,
              },
            },
            {
              name: 'colors',
              optional: true,
              typeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'NativePrimitiveTypeAnnotation',
                  name: 'ColorPrimitive',
                },
              },
            },
            {
              name: 'progressBackgroundColor',
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
                type: 'Int32TypeAnnotation',
                default: 1,
              },
            },
            {
              name: 'progressViewOffset',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 0,
              },
            },
            {
              name: 'refreshing',
              optional: false,
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

module.exports = AndroidSwipeRefreshLayoutSchema;
