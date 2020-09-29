/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {SchemaType} from '../../../CodegenSchema.js';

const EMPTY_NATIVE_MODULES: SchemaType = {
  modules: {
    SampleTurboModule: {
      nativeModules: {
        SampleTurboModule: {
          aliases: {},
          properties: [],
        },
      },
    },
  },
};

const SIMPLE_NATIVE_MODULES: SchemaType = {
  modules: {
    SampleTurboModule: {
      nativeModules: {
        SampleTurboModule: {
          aliases: {},
          properties: [
            {
              name: 'getConstants',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ObjectTypeAnnotation',
                  properties: [
                    {
                      optional: false,
                      name: 'const1',
                      typeAnnotation: {
                        type: 'BooleanTypeAnnotation',
                        nullable: false,
                      },
                    },
                    {
                      optional: false,
                      name: 'const2',
                      typeAnnotation: {
                        type: 'NumberTypeAnnotation',
                        nullable: false,
                      },
                    },
                    {
                      optional: false,
                      name: 'const3',
                      typeAnnotation: {
                        type: 'StringTypeAnnotation',
                        nullable: false,
                      },
                    },
                  ],
                },
                params: [],
                nullable: false,
              },
            },
            {
              name: 'voidFunc',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                nullable: false,
              },
            },
            {
              name: 'getBool',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'BooleanTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'BooleanTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'getNumber',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'NumberTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'getString',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'StringTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'getArray',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ArrayTypeAnnotation',
                  elementType: {
                    type: 'GenericObjectTypeAnnotation',
                    nullable: false,
                  },
                },
                params: [
                  {
                    name: 'arg',
                    optional: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      nullable: false,
                      elementType: {
                        type: 'GenericObjectTypeAnnotation',
                        nullable: false,
                      },
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'getObject',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'GenericObjectTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'GenericObjectTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'getRootTag',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ReservedFunctionValueTypeAnnotation',
                  name: 'RootTag',
                },
                params: [
                  {
                    optional: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'ReservedFunctionValueTypeAnnotation',
                      name: 'RootTag',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'getValue',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'GenericObjectTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'x',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                      nullable: false,
                    },
                  },
                  {
                    optional: false,
                    name: 'y',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                      nullable: false,
                    },
                  },
                  {
                    optional: false,
                    name: 'z',
                    typeAnnotation: {
                      type: 'GenericObjectTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'getValueWithCallback',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    name: 'callback',
                    optional: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                      params: [],
                      returnTypeAnnotation: {
                        type: 'VoidTypeAnnotation',
                        nullable: false,
                      },
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'getValueWithPromise',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'PromiseTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'error',
                    typeAnnotation: {
                      type: 'BooleanTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
          ],
        },
      },
    },
  },
};

const TWO_MODULES_SAME_FILE: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      nativeModules: {
        SampleTurboModule: {
          aliases: {},
          properties: [
            {
              name: 'voidFunc',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                nullable: false,
              },
            },
          ],
        },
        Sample2TurboModule: {
          aliases: {},
          properties: [
            {
              name: 'voidFunc',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                nullable: false,
              },
            },
          ],
        },
      },
    },
  },
};

const TWO_MODULES_DIFFERENT_FILES: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      nativeModules: {
        SampleTurboModule: {
          aliases: {},
          properties: [
            {
              name: 'voidFunc',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                nullable: false,
              },
            },
          ],
        },
      },
    },
    NativeSampleTurboModule2: {
      nativeModules: {
        Sample2TurboModule: {
          aliases: {},
          properties: [
            {
              name: 'getConstants',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
                params: [],
                nullable: false,
              },
            },
            {
              name: 'voidFunc',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                nullable: false,
              },
            },
          ],
        },
      },
    },
  },
};

const COMPLEX_OBJECTS: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      nativeModules: {
        SampleTurboModule: {
          aliases: {},
          properties: [
            {
              name: 'difficult',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ObjectTypeAnnotation',
                  properties: [
                    {
                      optional: false,
                      name: 'D',
                      typeAnnotation: {
                        type: 'BooleanTypeAnnotation',
                        nullable: false,
                      },
                    },
                    {
                      optional: false,
                      name: 'E',
                      typeAnnotation: {
                        type: 'NumberTypeAnnotation',
                        nullable: false,
                      },
                    },
                    {
                      optional: false,
                      name: 'F',
                      typeAnnotation: {
                        type: 'StringTypeAnnotation',
                        nullable: false,
                      },
                    },
                  ],
                },
                params: [
                  {
                    optional: false,
                    name: 'A',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      nullable: false,
                      properties: [
                        {
                          optional: false,
                          name: 'D',
                          typeAnnotation: {
                            type: 'BooleanTypeAnnotation',
                            nullable: false,
                          },
                        },
                        {
                          optional: false,
                          name: 'E',
                          typeAnnotation: {
                            type: 'ObjectTypeAnnotation',
                            nullable: false,
                            properties: [
                              {
                                optional: false,
                                name: 'D',
                                typeAnnotation: {
                                  type: 'BooleanTypeAnnotation',
                                  nullable: false,
                                },
                              },
                              {
                                optional: false,
                                name: 'E',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
                                  nullable: false,
                                },
                              },
                              {
                                optional: false,
                                name: 'F',
                                typeAnnotation: {
                                  type: 'StringTypeAnnotation',
                                  nullable: false,
                                },
                              },
                              {
                                optional: false,
                                name: 'id',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
                                  nullable: false,
                                },
                              },
                            ],
                          },
                        },
                        {
                          optional: false,
                          name: 'F',
                          typeAnnotation: {
                            type: 'StringTypeAnnotation',
                            nullable: false,
                          },
                        },
                      ],
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'optionals',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'A',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      nullable: false,
                      properties: [
                        {
                          optional: true,
                          name: 'optionalNumberProperty',
                          typeAnnotation: {
                            type: 'NumberTypeAnnotation',
                            nullable: false,
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalArrayProperty',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            nullable: false,
                            elementType: {
                              type: 'NumberTypeAnnotation',
                              nullable: false,
                            },
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalObjectProperty',
                          typeAnnotation: {
                            type: 'ObjectTypeAnnotation',
                            nullable: false,
                            properties: [
                              {
                                optional: false,
                                name: 'x',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
                                  nullable: false,
                                },
                              },
                              {
                                optional: false,
                                name: 'y',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
                                  nullable: false,
                                },
                              },
                            ],
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalGenericObjectProperty',
                          typeAnnotation: {
                            type: 'GenericObjectTypeAnnotation',
                            nullable: false,
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalBooleanTypeProperty',
                          typeAnnotation: {
                            type: 'BooleanTypeAnnotation',
                            nullable: false,
                          },
                        },
                      ],
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'optionalMethod',
              optional: true,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'options',
                    typeAnnotation: {
                      type: 'GenericObjectTypeAnnotation',
                      nullable: false,
                    },
                  },
                  {
                    name: 'callback',
                    optional: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                      params: [],
                      returnTypeAnnotation: {
                        type: 'VoidTypeAnnotation',
                        nullable: false,
                      },
                      nullable: false,
                    },
                  },
                  {
                    name: 'extras',
                    optional: true,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      nullable: false,
                      elementType: {
                        type: 'ObjectTypeAnnotation',
                        nullable: false,
                        properties: [
                          {
                            optional: false,
                            name: 'key',
                            typeAnnotation: {
                              type: 'StringTypeAnnotation',
                              nullable: false,
                            },
                          },
                          {
                            optional: false,
                            name: 'value',
                            typeAnnotation: {
                              type: 'GenericObjectTypeAnnotation',
                              nullable: false,
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
                nullable: true,
              },
            },
            {
              name: 'getArrays',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'options',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      nullable: false,
                      properties: [
                        {
                          optional: false,
                          name: 'arrayOfNumbers',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            nullable: false,
                            elementType: {
                              type: 'NumberTypeAnnotation',
                              nullable: false,
                            },
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalArrayOfNumbers',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            nullable: false,
                            elementType: {
                              type: 'NumberTypeAnnotation',
                              nullable: false,
                            },
                          },
                        },
                        {
                          optional: false,
                          name: 'arrayOfStrings',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            nullable: false,
                            elementType: {
                              type: 'StringTypeAnnotation',
                              nullable: false,
                            },
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalArrayOfStrings',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            nullable: false,
                            elementType: {
                              type: 'StringTypeAnnotation',
                              nullable: false,
                            },
                          },
                        },
                        {
                          optional: false,
                          name: 'arrayOfObjects',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            nullable: false,
                            elementType: {
                              type: 'ObjectTypeAnnotation',
                              nullable: false,
                              properties: [
                                {
                                  optional: false,
                                  name: 'numberProperty',
                                  typeAnnotation: {
                                    type: 'NumberTypeAnnotation',
                                    nullable: false,
                                  },
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
                nullable: false,
              },
            },
          ],
        },
      },
    },
  },
};

const NATIVE_MODULES_WITH_TYPE_ALIASES: SchemaType = {
  modules: {
    AliasTurboModule: {
      nativeModules: {
        AliasTurboModule: {
          aliases: {
            Options: {
              type: 'ObjectTypeAnnotation',
              nullable: false,
              properties: [
                {
                  optional: false,
                  name: 'offset',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    nullable: false,
                    properties: [
                      {
                        optional: false,
                        name: 'x',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                          nullable: false,
                        },
                      },
                      {
                        optional: false,
                        name: 'y',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                          nullable: false,
                        },
                      },
                    ],
                  },
                },
                {
                  optional: false,
                  name: 'size',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    nullable: false,
                    properties: [
                      {
                        optional: false,
                        name: 'width',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                          nullable: false,
                        },
                      },
                      {
                        optional: false,
                        name: 'height',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                          nullable: false,
                        },
                      },
                    ],
                  },
                },
                {
                  optional: true,
                  name: 'displaySize',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    nullable: false,
                    properties: [
                      {
                        optional: false,
                        name: 'width',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                          nullable: false,
                        },
                      },
                      {
                        optional: false,
                        name: 'height',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                          nullable: false,
                        },
                      },
                    ],
                  },
                },
                {
                  optional: true,
                  name: 'resizeMode',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'allowExternalStorage',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                    nullable: false,
                  },
                },
              ],
            },
          },
          properties: [
            {
              name: 'getConstants',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
                params: [],
                nullable: false,
              },
            },
            {
              name: 'cropImage',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'cropData',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'Options',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
          ],
        },
      },
    },
  },
};

const REAL_MODULE_EXAMPLE: SchemaType = {
  modules: {
    NativeCameraRollManager: {
      nativeModules: {
        CameraRollManager: {
          aliases: {
            PhotoIdentifierImage: {
              type: 'ObjectTypeAnnotation',
              nullable: false,
              properties: [
                {
                  optional: false,
                  name: 'uri',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'playableDuration',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'width',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'height',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'isStored',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'filename',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
              ],
            },
            PhotoIdentifier: {
              type: 'ObjectTypeAnnotation',
              nullable: false,
              properties: [
                {
                  optional: false,
                  name: 'node',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    nullable: false,
                    properties: [
                      {
                        optional: false,
                        name: 'image',
                        typeAnnotation: {
                          type: 'TypeAliasTypeAnnotation',
                          name: 'PhotoIdentifierImage',
                          nullable: false,
                        },
                      },
                      {
                        optional: false,
                        name: 'type',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                          nullable: false,
                        },
                      },
                      {
                        optional: false,
                        name: 'group_name',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                          nullable: false,
                        },
                      },
                      {
                        optional: false,
                        name: 'timestamp',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                          nullable: false,
                        },
                      },
                      {
                        optional: false,
                        name: 'location',
                        typeAnnotation: {
                          type: 'ObjectTypeAnnotation',
                          nullable: false,
                          properties: [
                            {
                              optional: false,
                              name: 'longitude',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                                nullable: false,
                              },
                            },
                            {
                              optional: false,
                              name: 'latitude',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                                nullable: false,
                              },
                            },
                            {
                              optional: true,
                              name: 'altitude',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                                nullable: false,
                              },
                            },
                            {
                              optional: true,
                              name: 'heading',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                                nullable: false,
                              },
                            },
                            {
                              optional: true,
                              name: 'speed',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                                nullable: false,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
            PhotoIdentifiersPage: {
              type: 'ObjectTypeAnnotation',
              nullable: false,
              properties: [
                {
                  optional: false,
                  name: 'edges',
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    nullable: false,
                    elementType: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'PhotoIdentifier',
                      nullable: false,
                    },
                  },
                },
                {
                  optional: false,
                  name: 'page_info',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    nullable: false,
                    properties: [
                      {
                        optional: false,
                        name: 'has_next_page',
                        typeAnnotation: {
                          type: 'BooleanTypeAnnotation',
                          nullable: false,
                        },
                      },
                      {
                        optional: true,
                        name: 'start_cursor',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                          nullable: false,
                        },
                      },
                      {
                        optional: true,
                        name: 'end_cursor',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                          nullable: false,
                        },
                      },
                    ],
                  },
                },
              ],
            },
            GetPhotosParams: {
              type: 'ObjectTypeAnnotation',
              nullable: false,
              properties: [
                {
                  optional: false,
                  name: 'first',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'after',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'groupName',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'groupTypes',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'assetType',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'maxSize',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'mimeTypes',
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    nullable: false,
                    elementType: {
                      type: 'StringTypeAnnotation',
                      nullable: false,
                    },
                  },
                },
              ],
            },
          },
          properties: [
            {
              name: 'getConstants',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
                params: [],
                nullable: false,
              },
            },
            {
              name: 'getPhotos',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'PromiseTypeAnnotation',
                  nullable: false,
                },
                params: [
                  {
                    optional: false,
                    name: 'params',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'GetPhotosParams',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'saveToCameraRoll',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'PromiseTypeAnnotation',
                  nullable: false,
                },
                params: [
                  {
                    optional: false,
                    name: 'uri',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                      nullable: false,
                    },
                  },
                  {
                    optional: false,
                    name: 'type',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'deletePhotos',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'PromiseTypeAnnotation',
                  nullable: false,
                },
                params: [
                  {
                    name: 'assets',
                    optional: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      nullable: false,
                      elementType: {
                        type: 'StringTypeAnnotation',
                        nullable: false,
                      },
                    },
                  },
                ],
                nullable: false,
              },
            },
          ],
        },
      },
    },
    NativeImagePickerIOS: {
      nativeModules: {
        ImagePickerIOS: {
          aliases: {},
          properties: [
            {
              name: 'openCameraDialog',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'config',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      nullable: false,
                      properties: [
                        {
                          optional: false,
                          name: 'unmirrorFrontFacingCamera',
                          typeAnnotation: {
                            type: 'BooleanTypeAnnotation',
                            nullable: false,
                          },
                        },
                        {
                          optional: false,
                          name: 'videoMode',
                          typeAnnotation: {
                            type: 'BooleanTypeAnnotation',
                            nullable: false,
                          },
                        },
                      ],
                    },
                  },
                  {
                    name: 'successCallback',
                    optional: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                      params: [],
                      returnTypeAnnotation: {
                        nullable: false,
                        type: 'VoidTypeAnnotation',
                      },
                      nullable: false,
                    },
                  },
                  {
                    name: 'cancelCallback',
                    optional: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                      params: [],
                      returnTypeAnnotation: {
                        nullable: false,
                        type: 'VoidTypeAnnotation',
                      },
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
          ],
        },
      },
    },
    NativeExceptionsManager: {
      nativeModules: {
        ExceptionsManager: {
          aliases: {
            StackFrame: {
              properties: [
                {
                  optional: true,
                  name: 'column',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'file',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'lineNumber',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'methodName',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'collapse',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                    nullable: false,
                  },
                },
              ],
              type: 'ObjectTypeAnnotation',
              nullable: false,
            },
            ExceptionData: {
              properties: [
                {
                  optional: false,
                  name: 'message',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'originalMessage',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'name',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'componentStack',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'stack',
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    nullable: false,
                    elementType: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'StackFrame',
                      nullable: false,
                    },
                  },
                },
                {
                  optional: false,
                  name: 'id',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: false,
                  name: 'isFatal',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                    nullable: false,
                  },
                },
                {
                  optional: true,
                  name: 'extraData',
                  typeAnnotation: {
                    type: 'GenericObjectTypeAnnotation',
                    nullable: false,
                  },
                },
              ],
              type: 'ObjectTypeAnnotation',
              nullable: false,
            },
          },
          properties: [
            {
              name: 'reportFatalException',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'message',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                      nullable: false,
                    },
                  },
                  {
                    name: 'stack',
                    optional: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      nullable: false,
                      elementType: {
                        type: 'TypeAliasTypeAnnotation',
                        name: 'StackFrame',
                        nullable: false,
                      },
                    },
                  },
                  {
                    optional: false,
                    name: 'exceptionId',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'reportSoftException',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'message',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                      nullable: false,
                    },
                  },
                  {
                    name: 'stack',
                    optional: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      nullable: false,
                      elementType: {
                        type: 'TypeAliasTypeAnnotation',
                        name: 'StackFrame',
                        nullable: false,
                      },
                    },
                  },
                  {
                    optional: false,
                    name: 'exceptionId',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'reportException',
              optional: true,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'data',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'ExceptionData',
                      nullable: false,
                    },
                  },
                ],
                nullable: true,
              },
            },
            {
              name: 'updateExceptionMessage',
              optional: false,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'message',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                      nullable: false,
                    },
                  },
                  {
                    name: 'stack',
                    optional: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      nullable: false,
                      elementType: {
                        type: 'TypeAliasTypeAnnotation',
                        name: 'StackFrame',
                        nullable: false,
                      },
                    },
                  },
                  {
                    optional: false,
                    name: 'exceptionId',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                      nullable: false,
                    },
                  },
                ],
                nullable: false,
              },
            },
            {
              name: 'dismissRedbox',
              optional: true,
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                nullable: true,
              },
            },
          ],
        },
      },
    },
  },
};
module.exports = {
  COMPLEX_OBJECTS,
  TWO_MODULES_SAME_FILE,
  TWO_MODULES_DIFFERENT_FILES,
  EMPTY_NATIVE_MODULES,
  SIMPLE_NATIVE_MODULES,
  NATIVE_MODULES_WITH_TYPE_ALIASES,
  REAL_MODULE_EXAMPLE,
};
