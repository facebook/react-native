/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

export type PlatformType = 'iOS' | 'android';

export type SchemaType = $ReadOnly<{
  modules: $ReadOnly<{
    [hasteModuleName: string]: ComponentSchema | NativeModuleSchema,
  }>,
}>;

/**
 * Component Type Annotations
 */
export type DoubleTypeAnnotation = $ReadOnly<{
  type: 'DoubleTypeAnnotation',
}>;

export type FloatTypeAnnotation = $ReadOnly<{
  type: 'FloatTypeAnnotation',
}>;

export type BooleanTypeAnnotation = $ReadOnly<{
  type: 'BooleanTypeAnnotation',
}>;

export type Int32TypeAnnotation = $ReadOnly<{
  type: 'Int32TypeAnnotation',
}>;

export type StringTypeAnnotation = $ReadOnly<{
  type: 'StringTypeAnnotation',
}>;

export type StringEnumTypeAnnotation = $ReadOnly<{
  type: 'StringEnumTypeAnnotation',
  options: $ReadOnlyArray<string>,
}>;

export type VoidTypeAnnotation = $ReadOnly<{
  type: 'VoidTypeAnnotation',
}>;

export type ObjectTypeAnnotation<+T> = $ReadOnly<{
  type: 'ObjectTypeAnnotation',
  properties: $ReadOnlyArray<NamedShape<T>>,

  // metadata for objects that generated from interfaces
  baseTypes?: $ReadOnlyArray<string>,
}>;

export type MixedTypeAnnotation = $ReadOnly<{
  type: 'MixedTypeAnnotation',
}>;

type FunctionTypeAnnotation<+P, +R> = $ReadOnly<{
  type: 'FunctionTypeAnnotation',
  params: $ReadOnlyArray<NamedShape<P>>,
  returnTypeAnnotation: R,
}>;

export type NamedShape<+T> = $ReadOnly<{
  name: string,
  optional: boolean,
  typeAnnotation: T,
}>;

export type ComponentSchema = $ReadOnly<{
  type: 'Component',
  components: $ReadOnly<{
    [componentName: string]: ComponentShape,
  }>,
}>;

export type ComponentShape = $ReadOnly<{
  ...OptionsShape,
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
  events: $ReadOnlyArray<EventTypeShape>,
  props: $ReadOnlyArray<NamedShape<PropTypeAnnotation>>,
  commands: $ReadOnlyArray<NamedShape<CommandTypeAnnotation>>,
}>;

export type OptionsShape = $ReadOnly<{
  interfaceOnly?: boolean,

  // Use for components with no current paper rename in progress
  // Does not check for new name
  paperComponentName?: string,

  // Use for components that are not used on other platforms.
  excludedPlatforms?: $ReadOnlyArray<PlatformType>,

  // Use for components currently being renamed in paper
  // Will use new name if it is available and fallback to this name
  paperComponentNameDeprecated?: string,
}>;

export type ExtendsPropsShape = $ReadOnly<{
  type: 'ReactNativeBuiltInType',
  knownTypeName: 'ReactNativeCoreViewProps',
}>;

export type EventTypeShape = $ReadOnly<{
  name: string,
  bubblingType: 'direct' | 'bubble',
  optional: boolean,
  paperTopLevelNameDeprecated?: string,
  typeAnnotation: $ReadOnly<{
    type: 'EventTypeAnnotation',
    argument?: ObjectTypeAnnotation<EventTypeAnnotation>,
  }>,
}>;

export type EventTypeAnnotation =
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  | MixedTypeAnnotation
  | StringEnumTypeAnnotation
  | ObjectTypeAnnotation<EventTypeAnnotation>
  | $ReadOnly<{
      type: 'ArrayTypeAnnotation',
      elementType: EventTypeAnnotation,
    }>;

export type ArrayTypeAnnotation = $ReadOnly<{
  type: 'ArrayTypeAnnotation',
  elementType:
    | BooleanTypeAnnotation
    | StringTypeAnnotation
    | DoubleTypeAnnotation
    | FloatTypeAnnotation
    | Int32TypeAnnotation
    | $ReadOnly<{
        type: 'StringEnumTypeAnnotation',
        default: string,
        options: $ReadOnlyArray<string>,
      }>
    | ObjectTypeAnnotation<PropTypeAnnotation>
    | ReservedPropTypeAnnotation
    | $ReadOnly<{
        type: 'ArrayTypeAnnotation',
        elementType: ObjectTypeAnnotation<PropTypeAnnotation>,
      }>,
}>;

export type PropTypeAnnotation =
  | $ReadOnly<{
      type: 'BooleanTypeAnnotation',
      default: boolean | null,
    }>
  | $ReadOnly<{
      type: 'StringTypeAnnotation',
      default: string | null,
    }>
  | $ReadOnly<{
      type: 'DoubleTypeAnnotation',
      default: number,
    }>
  | $ReadOnly<{
      type: 'FloatTypeAnnotation',
      default: number | null,
    }>
  | $ReadOnly<{
      type: 'Int32TypeAnnotation',
      default: number,
    }>
  | $ReadOnly<{
      type: 'StringEnumTypeAnnotation',
      default: string,
      options: $ReadOnlyArray<string>,
    }>
  | $ReadOnly<{
      type: 'Int32EnumTypeAnnotation',
      default: number,
      options: $ReadOnlyArray<number>,
    }>
  | ReservedPropTypeAnnotation
  | ObjectTypeAnnotation<PropTypeAnnotation>
  | ArrayTypeAnnotation
  | MixedTypeAnnotation;

export type ReservedPropTypeAnnotation = $ReadOnly<{
  type: 'ReservedPropTypeAnnotation',
  name:
    | 'ColorPrimitive'
    | 'ImageSourcePrimitive'
    | 'PointPrimitive'
    | 'EdgeInsetsPrimitive'
    | 'ImageRequestPrimitive'
    | 'DimensionPrimitive',
}>;

export type CommandTypeAnnotation = FunctionTypeAnnotation<
  CommandParamTypeAnnotation,
  VoidTypeAnnotation,
>;

export type CommandParamTypeAnnotation =
  | ReservedTypeAnnotation
  | BooleanTypeAnnotation
  | Int32TypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | StringTypeAnnotation;

export type ReservedTypeAnnotation = $ReadOnly<{
  type: 'ReservedTypeAnnotation',
  name: 'RootTag', // Union with more custom types.
}>;

/**
 * NativeModule Types
 */
export type Nullable<+T: NativeModuleTypeAnnotation> =
  | NullableTypeAnnotation<T>
  | T;

export type NullableTypeAnnotation<+T: NativeModuleTypeAnnotation> = $ReadOnly<{
  type: 'NullableTypeAnnotation',
  typeAnnotation: T,
}>;

export type NativeModuleSchema = $ReadOnly<{
  type: 'NativeModule',
  aliasMap: NativeModuleAliasMap,
  enumMap: NativeModuleEnumMap,
  spec: NativeModuleSpec,
  moduleName: string,
  // Use for modules that are not used on other platforms.
  // TODO: It's clearer to define `restrictedToPlatforms` instead, but
  // `excludedPlatforms` is used here to be consistent with ComponentSchema.
  excludedPlatforms?: $ReadOnlyArray<PlatformType>,
}>;

type NativeModuleSpec = $ReadOnly<{
  properties: $ReadOnlyArray<NativeModulePropertyShape>,
}>;

export type NativeModulePropertyShape = NamedShape<
  Nullable<NativeModuleFunctionTypeAnnotation>,
>;

export type NativeModuleEnumMap = $ReadOnly<{
  [enumName: string]: NativeModuleEnumDeclarationWithMembers,
}>;

export type NativeModuleAliasMap = $ReadOnly<{
  [aliasName: string]: NativeModuleObjectTypeAnnotation,
}>;

export type NativeModuleFunctionTypeAnnotation = FunctionTypeAnnotation<
  Nullable<NativeModuleParamTypeAnnotation>,
  Nullable<NativeModuleReturnTypeAnnotation>,
>;

export type NativeModuleObjectTypeAnnotation = ObjectTypeAnnotation<
  Nullable<NativeModuleBaseTypeAnnotation>,
>;

export type NativeModuleArrayTypeAnnotation<
  +T: Nullable<NativeModuleBaseTypeAnnotation>,
> = $ReadOnly<{
  type: 'ArrayTypeAnnotation',
  /**
   * TODO(T72031674): Migrate all our NativeModule specs to not use
   * invalid Array ElementTypes. Then, make the elementType required.
   */
  elementType?: T,
}>;

export type NativeModuleStringTypeAnnotation = $ReadOnly<{
  type: 'StringTypeAnnotation',
}>;

export type NativeModuleNumberTypeAnnotation = $ReadOnly<{
  type: 'NumberTypeAnnotation',
}>;

export type NativeModuleInt32TypeAnnotation = $ReadOnly<{
  type: 'Int32TypeAnnotation',
}>;

export type NativeModuleDoubleTypeAnnotation = $ReadOnly<{
  type: 'DoubleTypeAnnotation',
}>;

export type NativeModuleFloatTypeAnnotation = $ReadOnly<{
  type: 'FloatTypeAnnotation',
}>;

export type NativeModuleBooleanTypeAnnotation = $ReadOnly<{
  type: 'BooleanTypeAnnotation',
}>;

export type NativeModuleEnumMembers = $ReadOnlyArray<
  $ReadOnly<{
    name: string,
    value: string,
  }>,
>;

export type NativeModuleEnumMemberType =
  | 'NumberTypeAnnotation'
  | 'StringTypeAnnotation';

export type NativeModuleEnumDeclaration = $ReadOnly<{
  name: string,
  type: 'EnumDeclaration',
  memberType: NativeModuleEnumMemberType,
}>;

export type NativeModuleEnumDeclarationWithMembers = {
  name: string,
  type: 'EnumDeclarationWithMembers',
  memberType: NativeModuleEnumMemberType,
  members: NativeModuleEnumMembers,
};

export type NativeModuleGenericObjectTypeAnnotation = $ReadOnly<{
  type: 'GenericObjectTypeAnnotation',

  // a dictionary type is codegen as "Object"
  // but we know all its members are in the same type
  // when it happens, the following field is non-null
  dictionaryValueType?: Nullable<NativeModuleTypeAnnotation>,
}>;

export type NativeModuleTypeAliasTypeAnnotation = $ReadOnly<{
  type: 'TypeAliasTypeAnnotation',
  name: string,
}>;

export type NativeModulePromiseTypeAnnotation = $ReadOnly<{
  type: 'PromiseTypeAnnotation',
  elementType?: Nullable<NativeModuleBaseTypeAnnotation>,
}>;

export type UnionTypeAnnotationMemberType =
  | 'NumberTypeAnnotation'
  | 'ObjectTypeAnnotation'
  | 'StringTypeAnnotation';

export type NativeModuleUnionTypeAnnotation = $ReadOnly<{
  type: 'UnionTypeAnnotation',
  memberType: UnionTypeAnnotationMemberType,
}>;

export type NativeModuleMixedTypeAnnotation = $ReadOnly<{
  type: 'MixedTypeAnnotation',
}>;

export type NativeModuleBaseTypeAnnotation =
  | NativeModuleStringTypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NativeModuleInt32TypeAnnotation
  | NativeModuleDoubleTypeAnnotation
  | NativeModuleFloatTypeAnnotation
  | NativeModuleBooleanTypeAnnotation
  | NativeModuleEnumDeclaration
  | NativeModuleGenericObjectTypeAnnotation
  | ReservedTypeAnnotation
  | NativeModuleTypeAliasTypeAnnotation
  | NativeModuleArrayTypeAnnotation<Nullable<NativeModuleBaseTypeAnnotation>>
  | NativeModuleObjectTypeAnnotation
  | NativeModuleUnionTypeAnnotation
  | NativeModuleMixedTypeAnnotation;

export type NativeModuleParamTypeAnnotation =
  | NativeModuleBaseTypeAnnotation
  | NativeModuleParamOnlyTypeAnnotation;

export type NativeModuleReturnTypeAnnotation =
  | NativeModuleBaseTypeAnnotation
  | NativeModuleReturnOnlyTypeAnnotation;

export type NativeModuleTypeAnnotation =
  | NativeModuleBaseTypeAnnotation
  | NativeModuleParamOnlyTypeAnnotation
  | NativeModuleReturnOnlyTypeAnnotation;

type NativeModuleParamOnlyTypeAnnotation = NativeModuleFunctionTypeAnnotation;
type NativeModuleReturnOnlyTypeAnnotation =
  | NativeModulePromiseTypeAnnotation
  | VoidTypeAnnotation;
