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
                      },
                    },
                    {
                      optional: false,
                      name: 'const2',
                      typeAnnotation: {
                        type: 'NumberTypeAnnotation',
                      },
                    },
                    {
                      optional: false,
                      name: 'const3',
                      typeAnnotation: {
                        type: 'StringTypeAnnotation',
                      },
                    },
                  ],
                },
                params: [],
                optional: false,
              },
            },
            {
              name: 'voidFunc',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                optional: false,
              },
            },
            {
              name: 'getBool',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'BooleanTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'BooleanTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'getNumber',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'NumberTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'getString',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'StringTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'getArray',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ArrayTypeAnnotation',
                  elementType: {
                    type: 'AnyTypeAnnotation',
                  },
                },
                params: [
                  {
                    name: 'arg',
                    nullable: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {
                        type: 'AnyTypeAnnotation',
                      },
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'getObject',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'GenericObjectTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'GenericObjectTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'getRootTag',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ReservedFunctionValueTypeAnnotation',
                  name: 'RootTag',
                },
                params: [
                  {
                    nullable: false,
                    name: 'arg',
                    typeAnnotation: {
                      type: 'ReservedFunctionValueTypeAnnotation',
                      name: 'RootTag',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'getValue',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'GenericObjectTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'x',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                  {
                    nullable: false,
                    name: 'y',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    nullable: false,
                    name: 'z',
                    typeAnnotation: {
                      type: 'GenericObjectTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'getValueWithCallback',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    name: 'callback',
                    nullable: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'getValueWithPromise',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'GenericPromiseTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'error',
                    typeAnnotation: {
                      type: 'BooleanTypeAnnotation',
                    },
                  },
                ],
                optional: false,
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
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                optional: false,
              },
            },
          ],
        },
        Sample2TurboModule: {
          aliases: {},
          properties: [
            {
              name: 'voidFunc',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                optional: false,
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
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                optional: false,
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
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
                params: [],
                optional: false,
              },
            },
            {
              name: 'voidFunc',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                optional: false,
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
                      },
                    },
                    {
                      optional: false,
                      name: 'E',
                      typeAnnotation: {
                        type: 'NumberTypeAnnotation',
                      },
                    },
                    {
                      optional: false,
                      name: 'F',
                      typeAnnotation: {
                        type: 'StringTypeAnnotation',
                      },
                    },
                  ],
                },
                params: [
                  {
                    nullable: false,
                    name: 'A',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      properties: [
                        {
                          optional: false,
                          name: 'D',
                          typeAnnotation: {
                            type: 'BooleanTypeAnnotation',
                          },
                        },
                        {
                          optional: false,
                          name: 'E',
                          typeAnnotation: {
                            type: 'ObjectTypeAnnotation',
                            properties: [
                              {
                                optional: false,
                                name: 'D',
                                typeAnnotation: {
                                  type: 'BooleanTypeAnnotation',
                                },
                              },
                              {
                                optional: false,
                                name: 'E',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
                                },
                              },
                              {
                                optional: false,
                                name: 'F',
                                typeAnnotation: {
                                  type: 'StringTypeAnnotation',
                                },
                              },
                              {
                                optional: false,
                                name: 'id',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
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
                          },
                        },
                      ],
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'optionals',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'A',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      properties: [
                        {
                          optional: true,
                          name: 'optionalNumberProperty',
                          typeAnnotation: {
                            type: 'NumberTypeAnnotation',
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalArrayProperty',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            elementType: {
                              type: 'NumberTypeAnnotation',
                            },
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalObjectProperty',
                          typeAnnotation: {
                            type: 'ObjectTypeAnnotation',
                            properties: [
                              {
                                optional: false,
                                name: 'x',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
                                },
                              },
                              {
                                optional: false,
                                name: 'y',
                                typeAnnotation: {
                                  type: 'NumberTypeAnnotation',
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
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalBooleanTypeProperty',
                          typeAnnotation: {
                            type: 'BooleanTypeAnnotation',
                          },
                        },
                      ],
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'optionalMethod',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'options',
                    typeAnnotation: {
                      type: 'GenericObjectTypeAnnotation',
                    },
                  },
                  {
                    name: 'callback',
                    nullable: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                    },
                  },
                  {
                    name: 'extras',
                    nullable: true,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {
                        type: 'ObjectTypeAnnotation',
                        properties: [
                          {
                            optional: false,
                            name: 'key',
                            typeAnnotation: {
                              type: 'StringTypeAnnotation',
                            },
                          },
                          {
                            optional: false,
                            name: 'value',
                          },
                        ],
                      },
                    },
                  },
                ],
                optional: true,
              },
            },
            {
              name: 'getArrays',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'options',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      properties: [
                        {
                          optional: false,
                          name: 'arrayOfNumbers',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            elementType: {
                              type: 'NumberTypeAnnotation',
                            },
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalArrayOfNumbers',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            elementType: {
                              type: 'NumberTypeAnnotation',
                            },
                          },
                        },
                        {
                          optional: false,
                          name: 'arrayOfStrings',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            elementType: {
                              type: 'StringTypeAnnotation',
                            },
                          },
                        },
                        {
                          optional: true,
                          name: 'optionalArrayOfStrings',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            elementType: {
                              type: 'StringTypeAnnotation',
                            },
                          },
                        },
                        {
                          optional: false,
                          name: 'arrayOfObjects',
                          typeAnnotation: {
                            type: 'ArrayTypeAnnotation',
                            elementType: {
                              type: 'ObjectTypeAnnotation',
                              properties: [
                                {
                                  optional: false,
                                  name: 'numberProperty',
                                  typeAnnotation: {
                                    type: 'NumberTypeAnnotation',
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
                optional: false,
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
              properties: [
                {
                  optional: false,
                  name: 'offset',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    properties: [
                      {
                        optional: false,
                        name: 'x',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                        },
                      },
                      {
                        optional: false,
                        name: 'y',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
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
                    properties: [
                      {
                        optional: false,
                        name: 'width',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                        },
                      },
                      {
                        optional: false,
                        name: 'height',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
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
                    properties: [
                      {
                        optional: false,
                        name: 'width',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                        },
                      },
                      {
                        optional: false,
                        name: 'height',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
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
                  },
                },
                {
                  optional: true,
                  name: 'allowExternalStorage',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
              type: 'ObjectTypeAnnotation',
            },
          },
          properties: [
            {
              name: 'getConstants',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
                params: [],
                optional: false,
              },
            },
            {
              name: 'cropImage',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'cropData',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'Options',
                    },
                  },
                ],
                optional: false,
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
              properties: [
                {
                  optional: false,
                  name: 'uri',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'playableDuration',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'width',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'height',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'isStored',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'filename',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
              ],
            },
            PhotoIdentifier: {
              type: 'ObjectTypeAnnotation',
              properties: [
                {
                  optional: false,
                  name: 'node',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    properties: [
                      {
                        optional: false,
                        name: 'image',
                        typeAnnotation: {
                          type: 'TypeAliasTypeAnnotation',
                          name: 'PhotoIdentifierImage',
                        },
                      },
                      {
                        optional: false,
                        name: 'type',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                        },
                      },
                      {
                        optional: false,
                        name: 'group_name',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                        },
                      },
                      {
                        optional: false,
                        name: 'timestamp',
                        typeAnnotation: {
                          type: 'NumberTypeAnnotation',
                        },
                      },
                      {
                        optional: false,
                        name: 'location',
                        typeAnnotation: {
                          type: 'ObjectTypeAnnotation',
                          properties: [
                            {
                              optional: false,
                              name: 'longitude',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                              },
                            },
                            {
                              optional: false,
                              name: 'latitude',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                              },
                            },
                            {
                              optional: true,
                              name: 'altitude',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                              },
                            },
                            {
                              optional: true,
                              name: 'heading',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
                              },
                            },
                            {
                              optional: true,
                              name: 'speed',
                              typeAnnotation: {
                                type: 'NumberTypeAnnotation',
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
              properties: [
                {
                  optional: false,
                  name: 'edges',
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'PhotoIdentifier',
                    },
                  },
                },
                {
                  optional: false,
                  name: 'page_info',
                  typeAnnotation: {
                    type: 'ObjectTypeAnnotation',
                    properties: [
                      {
                        optional: false,
                        name: 'has_next_page',
                        typeAnnotation: {
                          type: 'BooleanTypeAnnotation',
                        },
                      },
                      {
                        optional: true,
                        name: 'start_cursor',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                        },
                      },
                      {
                        optional: true,
                        name: 'end_cursor',
                        typeAnnotation: {
                          type: 'StringTypeAnnotation',
                        },
                      },
                    ],
                  },
                },
              ],
            },
            GetPhotosParams: {
              type: 'ObjectTypeAnnotation',
              properties: [
                {
                  optional: false,
                  name: 'first',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'after',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'groupName',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'groupTypes',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'assetType',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'maxSize',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'mimeTypes',
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                },
              ],
            },
          },
          properties: [
            {
              name: 'getConstants',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
                params: [],
                optional: false,
              },
            },
            {
              name: 'getPhotos',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'GenericPromiseTypeAnnotation',
                  nullable: false,
                },
                params: [
                  {
                    nullable: false,
                    name: 'params',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'GetPhotosParams',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'saveToCameraRoll',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'GenericPromiseTypeAnnotation',
                  nullable: false,
                },
                params: [
                  {
                    nullable: false,
                    name: 'uri',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    nullable: false,
                    name: 'type',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'deletePhotos',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'GenericPromiseTypeAnnotation',
                  nullable: false,
                },
                params: [
                  {
                    name: 'assets',
                    nullable: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {
                        type: 'StringTypeAnnotation',
                      },
                    },
                  },
                ],
                optional: false,
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
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'config',
                    typeAnnotation: {
                      type: 'ObjectTypeAnnotation',
                      properties: [
                        {
                          optional: false,
                          name: 'unmirrorFrontFacingCamera',
                          typeAnnotation: {
                            type: 'BooleanTypeAnnotation',
                          },
                        },
                        {
                          optional: false,
                          name: 'videoMode',
                          typeAnnotation: {
                            type: 'BooleanTypeAnnotation',
                          },
                        },
                      ],
                    },
                  },
                  {
                    name: 'successCallback',
                    nullable: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                    },
                  },
                  {
                    name: 'cancelCallback',
                    nullable: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                    },
                  },
                ],
                optional: false,
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
                  },
                },
                {
                  optional: false,
                  name: 'file',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'lineNumber',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'methodName',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'collapse',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
              type: 'ObjectTypeAnnotation',
            },
            ExceptionData: {
              properties: [
                {
                  optional: false,
                  name: 'message',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'originalMessage',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'name',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'componentStack',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'stack',
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'StackFrame',
                    },
                  },
                },
                {
                  optional: false,
                  name: 'id',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'isFatal',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
                {
                  optional: true,
                  name: 'extraData',
                  typeAnnotation: {
                    type: 'GenericObjectTypeAnnotation',
                  },
                },
              ],
              type: 'ObjectTypeAnnotation',
            },
          },
          properties: [
            {
              name: 'reportFatalException',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'message',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    name: 'stack',
                    nullable: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {
                        type: 'TypeAliasTypeAnnotation',
                        name: 'StackFrame',
                      },
                    },
                  },
                  {
                    nullable: false,
                    name: 'exceptionId',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'reportSoftException',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'message',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    name: 'stack',
                    nullable: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {
                        type: 'TypeAliasTypeAnnotation',
                        name: 'StackFrame',
                      },
                    },
                  },
                  {
                    nullable: false,
                    name: 'exceptionId',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'reportException',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'data',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'ExceptionData',
                    },
                  },
                ],
                optional: true,
              },
            },
            {
              name: 'updateExceptionMessage',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    nullable: false,
                    name: 'message',
                    typeAnnotation: {
                      type: 'StringTypeAnnotation',
                    },
                  },
                  {
                    name: 'stack',
                    nullable: false,
                    typeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {
                        type: 'TypeAliasTypeAnnotation',
                        name: 'StackFrame',
                      },
                    },
                  },
                  {
                    nullable: false,
                    name: 'exceptionId',
                    typeAnnotation: {
                      type: 'NumberTypeAnnotation',
                    },
                  },
                ],
                optional: false,
              },
            },
            {
              name: 'dismissRedbox',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  nullable: false,
                  type: 'VoidTypeAnnotation',
                },
                params: [],
                optional: true,
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
