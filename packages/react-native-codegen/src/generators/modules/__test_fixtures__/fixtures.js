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
module.exports = {
  COMPLEX_OBJECTS,
  TWO_MODULES_SAME_FILE,
  TWO_MODULES_DIFFERENT_FILES,
  EMPTY_NATIVE_MODULES,
  SIMPLE_NATIVE_MODULES,
};
