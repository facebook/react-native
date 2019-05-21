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

const PullToRefreshViewSchema: SchemaType = {
  modules: {
    PullToRefreshView: {
      components: {
        PullToRefreshView: {
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
              name: 'tintColor',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
            {
              name: 'titleColor',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
            {
              name: 'title',
              optional: true,
              typeAnnotation: {
                type: 'StringTypeAnnotation',
                default: '',
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

module.exports = PullToRefreshViewSchema;
