/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

export type CommandsFunctionTypeAnnotation = $ReadOnly<{|
  type: 'FunctionTypeAnnotation',
  params: $ReadOnlyArray<CommandsFunctionTypeParamAnnotation>,
|}>;

export type CommandsFunctionTypeParamAnnotation = $ReadOnly<{|
  name: string,
  typeAnnotation: CommandsTypeAnnotation,
|}>;

export type CommandsTypeAnnotation =
  | BooleanTypeAnnotation
  | Int32TypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | StringTypeAnnotation;

export type DoubleTypeAnnotation = $ReadOnly<{|
  type: 'DoubleTypeAnnotation',
|}>;

export type FloatTypeAnnotation = $ReadOnly<{|
  type: 'FloatTypeAnnotation',
|}>;

export type BooleanTypeAnnotation = $ReadOnly<{|
  type: 'BooleanTypeAnnotation',
|}>;

export type Int32TypeAnnotation = $ReadOnly<{|
  type: 'Int32TypeAnnotation',
|}>;

export type StringTypeAnnotation = $ReadOnly<{|
  type: 'StringTypeAnnotation',
|}>;

export type ObjectPropertyType =
  | $ReadOnly<{|
      type: 'BooleanTypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'StringTypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'DoubleTypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'FloatTypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'Int32TypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'StringEnumTypeAnnotation',
      name: string,
      optional: boolean,
      options: $ReadOnlyArray<{|
        name: string,
      |}>,
    |}>
  | $ReadOnly<{|
      type: 'ObjectTypeAnnotation',
      name: string,
      optional: boolean,
      properties: $ReadOnlyArray<ObjectPropertyType>,
    |}>;

type PropTypeTypeAnnotation =
  | $ReadOnly<{|
      type: 'BooleanTypeAnnotation',
      default: boolean | null,
    |}>
  | $ReadOnly<{|
      type: 'StringTypeAnnotation',
      default: string | null,
    |}>
  | $ReadOnly<{|
      type: 'DoubleTypeAnnotation',
      default: number,
    |}>
  | $ReadOnly<{|
      type: 'FloatTypeAnnotation',
      default: number | null,
    |}>
  | $ReadOnly<{|
      type: 'Int32TypeAnnotation',
      default: number,
    |}>
  | $ReadOnly<{|
      type: 'StringEnumTypeAnnotation',
      default: string,
      options: $ReadOnlyArray<{|
        name: string,
      |}>,
    |}>
  | $ReadOnly<{|
      type: 'Int32EnumTypeAnnotation',
      default: number,
      options: $ReadOnlyArray<{|
        value: number,
      |}>,
    |}>
  | $ReadOnly<{|
      type: 'NativePrimitiveTypeAnnotation',
      name:
        | 'ColorPrimitive'
        | 'ImageSourcePrimitive'
        | 'PointPrimitive'
        | 'EdgeInsetsPrimitive',
    |}>
  | $ReadOnly<{|
      type: 'ObjectTypeAnnotation',
      properties: $ReadOnlyArray<PropTypeShape>,
    |}>
  | $ReadOnly<{|
      type: 'ArrayTypeAnnotation',
      elementType:
        | $ReadOnly<{|
            type: 'BooleanTypeAnnotation',
          |}>
        | $ReadOnly<{|
            type: 'StringTypeAnnotation',
          |}>
        | $ReadOnly<{|
            type: 'DoubleTypeAnnotation',
          |}>
        | $ReadOnly<{|
            type: 'FloatTypeAnnotation',
          |}>
        | $ReadOnly<{|
            type: 'Int32TypeAnnotation',
          |}>
        | $ReadOnly<{|
            type: 'StringEnumTypeAnnotation',
            default: string,
            options: $ReadOnlyArray<{|
              name: string,
            |}>,
          |}>
        | $ReadOnly<{|
            type: 'ObjectTypeAnnotation',
            properties: $ReadOnlyArray<PropTypeShape>,
          |}>
        | $ReadOnly<{|
            type: 'NativePrimitiveTypeAnnotation',
            name:
              | 'ColorPrimitive'
              | 'ImageSourcePrimitive'
              | 'PointPrimitive'
              | 'EdgeInsetsPrimitive',
          |}>
        | $ReadOnly<{|
            type: 'ArrayTypeAnnotation',
            elementType: $ReadOnly<{|
              type: 'ObjectTypeAnnotation',
              properties: $ReadOnlyArray<PropTypeShape>,
            |}>,
          |}>,
    |}>;

export type PropTypeShape = $ReadOnly<{|
  name: string,
  optional: boolean,
  typeAnnotation: PropTypeTypeAnnotation,
|}>;

export type PrimitiveTypeAnnotationType =
  | 'StringTypeAnnotation'
  | 'NumberTypeAnnotation'
  | 'Int32TypeAnnotation'
  | 'DoubleTypeAnnotation'
  | 'FloatTypeAnnotation'
  | 'BooleanTypeAnnotation'
  | 'GenericObjectTypeAnnotation';

export type PrimitiveTypeAnnotation = $ReadOnly<{|
  type: PrimitiveTypeAnnotationType,
|}>;

export type FunctionTypeAnnotationParamTypeAnnotation =
  | $ReadOnly<{|
      type:
        | 'AnyTypeAnnotation'
        | 'FunctionTypeAnnotation'
        | PrimitiveTypeAnnotationType,
    |}>
  | $ReadOnly<{|
      type: 'ArrayTypeAnnotation',
      elementType: ?FunctionTypeAnnotationParamTypeAnnotation,
    |}>
  | $ReadOnly<{|
      type: 'ObjectTypeAnnotation',
      properties: ?$ReadOnlyArray<ObjectParamTypeAnnotation>,
    |}>;

export type FunctionTypeAnnotationReturnArrayElementType = FunctionTypeAnnotationParamTypeAnnotation;

export type ObjectParamTypeAnnotation = $ReadOnly<{|
  optional: boolean,
  name: string,
  typeAnnotation: FunctionTypeAnnotationParamTypeAnnotation,
|}>;

export type FunctionTypeAnnotationReturn =
  | $ReadOnly<{|
      nullable: boolean,
      type:
        | PrimitiveTypeAnnotationType
        | 'VoidTypeAnnotation'
        | 'GenericPromiseTypeAnnotation',
    |}>
  | $ReadOnly<{|
      nullable: boolean,
      type: 'ArrayTypeAnnotation',
      elementType: ?FunctionTypeAnnotationReturnArrayElementType,
    |}>
  | $ReadOnly<{|
      nullable: boolean,
      type: 'ObjectTypeAnnotation',
      properties: ?$ReadOnlyArray<ObjectParamTypeAnnotation>,
    |}>;

export type FunctionTypeAnnotationParam = $ReadOnly<{|
  nullable: boolean,
  name: string,
  typeAnnotation: FunctionTypeAnnotationParamTypeAnnotation,
|}>;

export type FunctionTypeAnnotation = $ReadOnly<{|
  type: 'FunctionTypeAnnotation',
  params: $ReadOnlyArray<FunctionTypeAnnotationParam>,
  returnTypeAnnotation: FunctionTypeAnnotationReturn,
  optional: boolean,
|}>;

export type MethodTypeShape = $ReadOnly<{|
  name: string,
  typeAnnotation: FunctionTypeAnnotation,
|}>;

export type NativeModuleShape = $ReadOnly<{|
  properties: $ReadOnlyArray<MethodTypeShape>,
|}>;

export type EventTypeShape = $ReadOnly<{|
  name: string,
  bubblingType: 'direct' | 'bubble',
  optional: boolean,
  paperTopLevelNameDeprecated?: string,
  typeAnnotation: $ReadOnly<{|
    type: 'EventTypeAnnotation',
    argument?: $ReadOnly<{|
      type: 'ObjectTypeAnnotation',
      properties: $ReadOnlyArray<ObjectPropertyType>,
    |}>,
  |}>,
|}>;

export type CommandTypeShape = $ReadOnly<{|
  name: string,
  optional: boolean,
  typeAnnotation: CommandsFunctionTypeAnnotation,
|}>;

export type OptionsShape = $ReadOnly<{|
  interfaceOnly?: boolean,

  // Use for components with no current paper rename in progress
  // Does not check for new name
  paperComponentName?: string,

  // Use for components that are not used on one or the other platform.
  excludedPlatform?: 'iOS' | 'android',

  // Use for components currently being renamed in paper
  // Will use new name if it is available and fallback to this name
  paperComponentNameDeprecated?: string,
|}>;

export type ExtendsPropsShape = $ReadOnly<{|
  type: 'ReactNativeBuiltInType',
  knownTypeName: 'ReactNativeCoreViewProps',
|}>;

export type ComponentShape = $ReadOnly<{|
  ...OptionsShape,
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
  events: $ReadOnlyArray<EventTypeShape>,
  props: $ReadOnlyArray<PropTypeShape>,
  commands: $ReadOnlyArray<CommandTypeShape>,
|}>;

export type SchemaType = $ReadOnly<{|
  modules: $ReadOnly<{
    [module: string]: $ReadOnly<{|
      components?: $ReadOnly<{[component: string]: ComponentShape, ...}>,
      nativeModules?: $ReadOnly<{
        [nativeModule: string]: NativeModuleShape,
        ...,
      }>,
    |}>,
    ...,
  }>,
|}>;
