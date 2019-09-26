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

import type {SchemaType} from '../../packages/react-native-codegen/src/CodegenSchema.js';

const ModalSchema: SchemaType = {
  modules: {
    ModalHostView: {
      components: {
        ModalHostView: {
          interfaceOnly: true,
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [
            {
              name: 'onRequestClose',
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
            {
              name: 'onShow',
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
            {
              name: 'onDismiss',
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
            {
              name: 'onOrientationChange',
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
              name: 'animationType',
              optional: true,
              typeAnnotation: {
                type: 'StringEnumTypeAnnotation',
                default: 'none',
                options: [
                  {
                    name: 'none',
                  },
                  {
                    name: 'slide',
                  },
                  {
                    name: 'fade',
                  },
                ],
              },
            },
            {
              name: 'presentationStyle',
              optional: true,
              typeAnnotation: {
                type: 'StringEnumTypeAnnotation',
                default: 'fullScreen',
                options: [
                  {
                    name: 'fullScreen',
                  },
                  {
                    name: 'pageSheet',
                  },
                  {
                    name: 'formSheet',
                  },
                  {
                    name: 'overFullScreen',
                  },
                ],
              },
            },
            {
              name: 'transparent',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
            {
              name: 'hardwareAccelerated',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
            {
              name: 'visible',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: true,
              },
            },
            {
              name: 'supportedOrientations',
              optional: true,
              typeAnnotation: {
                type: 'StringEnumTypeAnnotation',
                default: 'portrait',
                options: [
                  {
                    name: 'portrait',
                  },
                  {
                    name: 'portrait-upside-down',
                  },
                  {
                    name: 'landscape',
                  },
                  {
                    name: 'landscape-left',
                  },
                  {
                    name: 'landscape-right',
                  },
                ],
              },
            },
            {
              name: 'identifier',
              optional: true,
              typeAnnotation: {
                type: 'Int32TypeAnnotation',
                default: 0,
              },
            },
          ],
        },
      },
    },
  },
};

module.exports = ModalSchema;
