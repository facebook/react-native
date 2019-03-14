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

const DatePickerSchema: SchemaType = {
  modules: {
    DatePickerSchema: {
      components: {
        DatePicker: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [
            // {
            //   name: 'onDateChange',
            //   optional: true,
            //   bubblingType: 'bubble',
            //   typeAnnotation: {
            //     type: 'EventTypeAnnotation',
            //     argument: {
            //       type: 'ObjectTypeAnnotation',
            //       properties: [
            //         {
            //           type: 'FloatTypeAnnotation',
            //           name: 'value',
            //           optional: false,
            //         },
            //         {
            //           type: 'BooleanTypeAnnotation',
            //           name: 'fromUser',
            //           optional: false,
            //         },
            //       ],
            //     },
            //   },
            // },
          ],
          props: [
            {
              name: 'mode',
              optional: true,
              typeAnnotation: {
                type: 'StringEnumTypeAnnotation',
                default: 'datetime',
                options: [
                  {
                    name: 'date',
                  },
                  {
                    name: 'time',
                  },
                  {
                    name: 'datetime',
                  },
                ],
              },
            },
            {
              name: 'minuteInterval',
              optional: true,
              typeAnnotation: {
                type: 'Int32TypeAnnotation',
                default: 1,
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

module.exports = DatePickerSchema;
