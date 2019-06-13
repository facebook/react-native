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

import type {SchemaType} from '../../CodegenSchema.js';

const SINGLE_COMPONENT_WITH_BOOLEAN_PROP: SchemaType = {
  modules: {
    Switch: {
      components: {
        BooleanPropNativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'disabled',
              optional: true,
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

const SINGLE_COMPONENT_WITH_STRING_PROP: SchemaType = {
  modules: {
    Switch: {
      components: {
        StringPropComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'accessibilityHint',
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

const SINGLE_COMPONENT_WITH_INTEGER_PROPS: SchemaType = {
  modules: {
    Switch: {
      components: {
        IntegerPropNativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'progress1',
              optional: true,
              typeAnnotation: {
                type: 'Int32TypeAnnotation',
                default: 0,
              },
            },
            {
              name: 'progress2',
              optional: true,
              typeAnnotation: {
                type: 'Int32TypeAnnotation',
                default: -1,
              },
            },
            {
              name: 'progress3',
              optional: true,
              typeAnnotation: {
                type: 'Int32TypeAnnotation',
                default: 10,
              },
            },
          ],
        },
      },
    },
  },
};

const SINGLE_COMPONENT_WITH_FLOAT_PROPS: SchemaType = {
  modules: {
    Switch: {
      components: {
        FloatPropNativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'blurRadius',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 0.0,
              },
            },
            {
              name: 'blurRadius2',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 0.001,
              },
            },
            {
              name: 'blurRadius3',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 2.1,
              },
            },
            {
              name: 'blurRadius4',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 0,
              },
            },
            {
              name: 'blurRadius5',
              optional: true,
              typeAnnotation: {
                type: 'FloatTypeAnnotation',
                default: 1,
              },
            },
          ],
        },
      },
    },
  },
};

const SINGLE_COMPONENT_WITH_COLOR_PROP: SchemaType = {
  modules: {
    Switch: {
      components: {
        ColorPropNativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'tintColor',
              optional: true,
              typeAnnotation: {
                type: 'NativePrimitiveTypeAnnotation',
                name: 'ColorPrimitive',
              },
            },
          ],
        },
      },
    },
  },
};

const SINGLE_COMPONENT_WITH_ENUM_PROP: SchemaType = {
  modules: {
    Switch: {
      components: {
        EnumPropsNativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'alignment',
              optional: true,
              typeAnnotation: {
                type: 'StringEnumTypeAnnotation',
                default: 'Center',
                options: [
                  {
                    name: 'top',
                  },
                  {
                    name: 'center',
                  },
                  {
                    name: 'bottom',
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
};

const SINGLE_COMPONENT_WITH_EVENT_PROPS: SchemaType = {
  modules: {
    Switch: {
      components: {
        EventsNativeComponent: {
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
                      type: 'BooleanTypeAnnotation',
                      name: 'value',
                      optional: false,
                    },
                    {
                      type: 'StringTypeAnnotation',
                      name: 'source',
                      optional: true,
                    },
                    {
                      type: 'Int32TypeAnnotation',
                      name: 'progress',
                      optional: true,
                    },
                    {
                      type: 'FloatTypeAnnotation',
                      name: 'scale',
                      optional: true,
                    },
                    // {
                    //   type: 'ObjectTypeAnnotation',
                    //   name: 'location',
                    //   optional: false,
                    //   properties: [
                    //     {
                    //       type: 'IntegerTypeAnnotation',
                    //       name: 'x',
                    //       optional: false,
                    //     },
                    //     {
                    //       type: 'IntegerTypeAnnotation',
                    //       name: 'y',
                    //       optional: false,
                    //     },
                    //   ],
                    // },
                  ],
                },
              },
            },
            {
              name: 'onEventDirect',
              optional: true,
              bubblingType: 'direct',
              typeAnnotation: {
                type: 'EventTypeAnnotation',
                argument: {
                  type: 'ObjectTypeAnnotation',
                  properties: [
                    {
                      type: 'BooleanTypeAnnotation',
                      name: 'value',
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
          ],
        },
      },
    },
  },
};

const SINGLE_COMPONENT_WITH_EVENT_NESTED_OBJECT_PROPS: SchemaType = {
  modules: {
    Switch: {
      components: {
        EventsNestedObjectNativeComponent: {
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
                      type: 'ObjectTypeAnnotation',
                      name: 'location',
                      optional: false,
                      properties: [
                        {
                          type: 'ObjectTypeAnnotation',
                          name: 'source',
                          optional: false,
                          properties: [
                            {
                              type: 'StringTypeAnnotation',
                              name: 'url',
                              optional: false,
                            },
                          ],
                        },
                        {
                          type: 'Int32TypeAnnotation',
                          name: 'x',
                          optional: false,
                        },
                        {
                          type: 'Int32TypeAnnotation',
                          name: 'y',
                          optional: false,
                        },
                      ],
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
          ],
        },
      },
    },
  },
};

const TWO_COMPONENTS_SAME_FILE: SchemaType = {
  modules: {
    MyComponents: {
      components: {
        MultiComponent1NativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'disabled',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
          ],
        },

        MultiComponent2NativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'disabled',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: true,
              },
            },
          ],
        },
      },
    },
  },
};

const TWO_COMPONENTS_DIFFERENT_FILES: SchemaType = {
  modules: {
    ComponentFile1: {
      components: {
        MultiFile1NativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'disabled',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: false,
              },
            },
          ],
        },
      },
    },

    ComponentFile2: {
      components: {
        MultiFile2NativeComponent: {
          extendsProps: [
            {
              type: 'ReactNativeBuiltInType',
              knownTypeName: 'ReactNativeCoreViewProps',
            },
          ],
          events: [],
          props: [
            {
              name: 'disabled',
              optional: true,
              typeAnnotation: {
                type: 'BooleanTypeAnnotation',
                default: true,
              },
            },
          ],
        },
      },
    },
  },
};

module.exports = {
  SINGLE_COMPONENT_WITH_BOOLEAN_PROP,
  SINGLE_COMPONENT_WITH_STRING_PROP,
  SINGLE_COMPONENT_WITH_INTEGER_PROPS,
  SINGLE_COMPONENT_WITH_FLOAT_PROPS,
  SINGLE_COMPONENT_WITH_COLOR_PROP,
  SINGLE_COMPONENT_WITH_ENUM_PROP,
  SINGLE_COMPONENT_WITH_EVENT_PROPS,
  SINGLE_COMPONENT_WITH_EVENT_NESTED_OBJECT_PROPS,
  TWO_COMPONENTS_SAME_FILE,
  TWO_COMPONENTS_DIFFERENT_FILES,
};
