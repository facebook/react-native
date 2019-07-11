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
                  type: 'ObjectTypeAnnotation',
                  properties: [
                    {
                      name: 'const1',
                      typeAnnotation: {
                        type: 'BooleanTypeAnnotation',
                      },
                    },
                    {
                      name: 'const2',
                      typeAnnotation: {
                        type: 'NumberTypeAnnotation',
                      },
                    },
                    {
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
              name: 'getValue',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
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
                  type: 'VoidTypeAnnotation',
                },
                params: [
                  {
                    name: 'callback',
                    nullable: false,
                    typeAnnotation: {
                      type: 'FunctionTypeAnnotation',
                      params: [
                        {
                          nullable: false,
                          name: 'value',
                          typeAnnotation: {
                            type: 'StringTypeAnnotation',
                          },
                        },
                      ],
                      returnTypeAnnotation: {
                        type: 'VoidTypeAnnotation',
                      },
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
                  type: 'GenericPromiseTypeAnnotation',
                  resolvedType: {
                    type: 'StringTypeAnnotation',
                  },
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
              name: 'voidFunc',
              typeAnnotation: {
                type: 'FunctionTypeAnnotation',
                returnTypeAnnotation: {
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

module.exports = {
  TWO_MODULES_SAME_FILE,
  TWO_MODULES_DIFFERENT_FILES,
  EMPTY_NATIVE_MODULES,
  SIMPLE_NATIVE_MODULES,
};
