/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliases: {},
      spec: {
        properties: [],
      },
      moduleNames: ['SampleTurboModule'],
    },
  },
};

const SIMPLE_NATIVE_MODULES: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliases: {},
      spec: {
        properties: [
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
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
            },
          },
          {
            name: 'voidFunc',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
          {
            name: 'getBool',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'BooleanTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getNumber',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getString',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'StringTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getArray',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'GenericObjectTypeAnnotation',
                },
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',

                    elementType: {
                      type: 'GenericObjectTypeAnnotation',
                    },
                  },
                },
              ],
            },
          },
          {
            name: 'getObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'GenericObjectTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'GenericObjectTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getRootTag',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ReservedTypeAnnotation',
                name: 'RootTag',
              },
              params: [
                {
                  optional: false,
                  name: 'arg',
                  typeAnnotation: {
                    type: 'ReservedTypeAnnotation',
                    name: 'RootTag',
                  },
                },
              ],
            },
          },
          {
            name: 'getValue',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'GenericObjectTypeAnnotation',
              },
              params: [
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
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'z',
                  typeAnnotation: {
                    type: 'GenericObjectTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getValueWithCallback',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
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
                    },
                  },
                },
              ],
            },
          },
          {
            name: 'getValueWithPromise',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'error',
                  typeAnnotation: {
                    type: 'BooleanTypeAnnotation',
                  },
                },
              ],
            },
          },
        ],
      },
      moduleNames: ['SampleTurboModule'],
    },
  },
};

const TWO_MODULES_DIFFERENT_FILES: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliases: {},
      spec: {
        properties: [
          {
            name: 'voidFunc',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
        ],
      },
      moduleNames: ['SampleTurboModule'],
    },
    NativeSampleTurboModule2: {
      type: 'NativeModule',
      aliases: {},
      spec: {
        properties: [
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [],
              },
              params: [],
            },
          },
          {
            name: 'voidFunc',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [],
            },
          },
        ],
      },
      moduleNames: ['SampleTurboModule2'],
    },
  },
};

const COMPLEX_OBJECTS: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliases: {},
      spec: {
        properties: [
          {
            name: 'difficult',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
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
                  optional: false,
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
            },
          },
          {
            name: 'optionals',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
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
            },
          },
          {
            name: 'optionalMethod',
            optional: true,
            typeAnnotation: {
              type: 'NullableTypeAnnotation',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'options',
                    typeAnnotation: {
                      type: 'GenericObjectTypeAnnotation',
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
                      },
                    },
                  },
                  {
                    name: 'extras',
                    optional: true,
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
                            typeAnnotation: {
                              type: 'GenericObjectTypeAnnotation',
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            name: 'getArrays',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
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
            },
          },
          {
            name: 'getNullableObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
              },
              params: [],
            },
          },
          {
            name: 'getNullableGenericObject',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'GenericObjectTypeAnnotation',
                },
              },
              params: [],
            },
          },
          {
            name: 'getNullableArray',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'ArrayTypeAnnotation',
                },
              },
              params: [],
            },
          },
        ],
      },
      moduleNames: ['SampleTurboModule'],
    },
  },
};

const NATIVE_MODULES_WITH_TYPE_ALIASES: SchemaType = {
  modules: {
    AliasTurboModule: {
      type: 'NativeModule',
      aliases: {
        Options: {
          type: 'ObjectTypeAnnotation',
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
        },
      },
      spec: {
        properties: [
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [],
              },
              params: [],
            },
          },
          {
            name: 'cropImage',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'cropData',
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'Options',
                  },
                },
              ],
            },
          },
        ],
      },
      moduleNames: ['AliasTurboModule'],
    },
  },
};

const REAL_MODULE_EXAMPLE: SchemaType = {
  modules: {
    NativeCameraRollManager: {
      type: 'NativeModule',
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
      spec: {
        properties: [
          {
            name: 'getConstants',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'ObjectTypeAnnotation',
                properties: [],
              },
              params: [],
            },
          },
          {
            name: 'getPhotos',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'params',
                  typeAnnotation: {
                    type: 'TypeAliasTypeAnnotation',
                    name: 'GetPhotosParams',
                  },
                },
              ],
            },
          },
          {
            name: 'saveToCameraRoll',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'uri',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  optional: false,
                  name: 'type',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'deletePhotos',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'PromiseTypeAnnotation',
              },
              params: [
                {
                  name: 'assets',
                  optional: false,
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
        ],
      },
      moduleNames: ['CameraRollManager'],
    },
    NativeImagePickerIOS: {
      type: 'NativeModule',
      aliases: {},
      spec: {
        properties: [
          {
            name: 'openCameraDialog',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
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
                  optional: false,
                  typeAnnotation: {
                    type: 'FunctionTypeAnnotation',
                    params: [],
                    returnTypeAnnotation: {
                      type: 'VoidTypeAnnotation',
                    },
                  },
                },
                {
                  name: 'cancelCallback',
                  optional: false,
                  typeAnnotation: {
                    type: 'FunctionTypeAnnotation',
                    params: [],
                    returnTypeAnnotation: {
                      type: 'VoidTypeAnnotation',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      moduleNames: ['ImagePickerIOS'],
      excludedPlatforms: ['android'],
    },
    NativeExceptionsManager: {
      type: 'NativeModule',
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
      spec: {
        properties: [
          {
            name: 'reportFatalException',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'message',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  name: 'stack',
                  optional: false,
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
                  name: 'exceptionId',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'reportSoftException',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'message',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  name: 'stack',
                  optional: false,
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
                  name: 'exceptionId',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'reportException',
            optional: true,
            typeAnnotation: {
              type: 'NullableTypeAnnotation',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    optional: false,
                    name: 'data',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'ExceptionData',
                    },
                  },
                ],
              },
            },
          },
          {
            name: 'updateExceptionMessage',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'VoidTypeAnnotation',
              },
              params: [
                {
                  optional: false,
                  name: 'message',
                  typeAnnotation: {
                    type: 'StringTypeAnnotation',
                  },
                },
                {
                  name: 'stack',
                  optional: false,
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
                  name: 'exceptionId',
                  typeAnnotation: {
                    type: 'NumberTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'dismissRedbox',
            optional: true,
            typeAnnotation: {
              type: 'NullableTypeAnnotation',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
                  type: 'VoidTypeAnnotation',
                },
                params: [],
              },
            },
          },
        ],
      },
      moduleNames: ['ExceptionsManager'],
    },
  },
};

const CXX_ONLY_NATIVE_MODULES: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliases: {
        ObjectAlias: {
          type: 'ObjectTypeAnnotation',
          properties: [
            {
              name: 'x',
              optional: false,
              typeAnnotation: {
                type: 'NumberTypeAnnotation',
              },
            },
          ],
        },
      },
      spec: {
        properties: [
          {
            name: 'getMixed',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'MixedTypeAnnotation',
              },
              params: [
                {
                  name: 'arg',
                  optional: false,
                  typeAnnotation: {
                    type: 'MixedTypeAnnotation',
                  },
                },
              ],
            },
          },
          {
            name: 'getNullableNumberFromNullableAlias',
            optional: false,
            typeAnnotation: {
              type: 'FunctionTypeAnnotation',
              returnTypeAnnotation: {
                type: 'NullableTypeAnnotation',
                typeAnnotation: {
                  type: 'NumberTypeAnnotation',
                },
              },
              params: [
                {
                  name: 'a',
                  optional: false,
                  typeAnnotation: {
                    type: 'NullableTypeAnnotation',
                    typeAnnotation: {
                      type: 'TypeAliasTypeAnnotation',
                      name: 'ObjectAlias',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      moduleNames: ['SampleTurboModuleCxx'],
      excludedPlatforms: ['iOS', 'android'],
    },
  },
};

const SAMPLE_WITH_UPPERCASE_NAME: SchemaType = {
  modules: {
    NativeSampleTurboModule: {
      type: 'NativeModule',
      aliases: {},
      spec: {
        properties: [],
      },
      moduleNames: ['SampleTurboModule'],
    },
  },
};

module.exports = {
  complex_objects: COMPLEX_OBJECTS,
  two_modules_different_files: TWO_MODULES_DIFFERENT_FILES,
  empty_native_modules: EMPTY_NATIVE_MODULES,
  simple_native_modules: SIMPLE_NATIVE_MODULES,
  native_modules_with_type_aliases: NATIVE_MODULES_WITH_TYPE_ALIASES,
  real_module_example: REAL_MODULE_EXAMPLE,
  cxx_only_native_modules: CXX_ONLY_NATIVE_MODULES,
  SampleWithUppercaseName: SAMPLE_WITH_UPPERCASE_NAME,
};
