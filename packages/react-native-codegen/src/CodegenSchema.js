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
  libraryName?: string,
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

export type NumberTypeAnnotation = $ReadOnly<{
  type: 'NumberTypeAnnotation',
}>;

export type BooleanTypeAnnotation = $ReadOnly<{
  type: 'BooleanTypeAnnotation',
}>;

export type Int32TypeAnnotation = $ReadOnly<{
  type: 'Int32TypeAnnotation',
}>;

export type NumberLiteralTypeAnnotation = $ReadOnly<{
  type: 'NumberLiteralTypeAnnotation',
  value: number,
}>;

export type StringTypeAnnotation = $ReadOnly<{
  type: 'StringTypeAnnotation',
}>;

export type StringLiteralTypeAnnotation = $ReadOnly<{
  type: 'StringLiteralTypeAnnotation',
  value: string,
}>;

export type BooleanLiteralTypeAnnotation = $ReadOnly<{
  type: 'BooleanLiteralTypeAnnotation',
  value: boolean,
}>;

export type StringLiteralUnionTypeAnnotation =
  UnionTypeAnnotation<StringLiteralTypeAnnotation>;

export type VoidTypeAnnotation = $ReadOnly<{
  type: 'VoidTypeAnnotation',
}>;

export type ObjectTypeAnnotation<+T> = $ReadOnly<{
  type: 'ObjectTypeAnnotation',
  properties: $ReadOnlyArray<NamedShape<T>>,
  // metadata for objects that generated from interfaces
  baseTypes?: $ReadOnlyArray<string>,
}>;

export type UnionTypeAnnotation<+T> = $ReadOnly<{
  type: 'UnionTypeAnnotation',
  types: $ReadOnlyArray<T>,
}>;

export type MixedTypeAnnotation = $ReadOnly<{
  type: 'MixedTypeAnnotation',
}>;

export type EventEmitterTypeAnnotation = $ReadOnly<{
  type: 'EventEmitterTypeAnnotation',
  typeAnnotation: NativeModuleEventEmitterTypeAnnotation | $FlowFixMe,
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
  // Use to generate only interfaces of components (C++ Props, C++ EventEmitters, JVM interfaces) and not their implementation.
  // This is useful for components that have a custom implementation of ShadowNode, ComponentDescriptor, State.
  interfaceOnly?: boolean,
  // Use for components with no current paper rename in progress
  // Does not check for new name
  paperComponentName?: string,
  // Use for components that are not used on other platforms.
  excludedPlatforms?: $ReadOnlyArray<PlatformType>,
  // Use for components currently being renamed in paper
  // Will use new name if it is available and fallback to this name
  paperComponentNameDeprecated?: string,
  // Use to generate C++ Props with optional types for properties defined as optional
  generateOptionalProperties?: boolean,
  // Use to generate C++ Props with optional types for object properties defined as optional
  generateOptionalObjectProperties?: boolean,
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
  | StringLiteralUnionTypeAnnotation
  | ObjectTypeAnnotation<EventTypeAnnotation>
  | ArrayTypeAnnotation<EventTypeAnnotation>;

export type ComponentArrayTypeAnnotation = ArrayTypeAnnotation<
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  | MixedTypeAnnotation
  | $ReadOnly<{
      type: 'StringEnumTypeAnnotation',
      default: string,
      options: $ReadOnlyArray<string>,
    }>
  | ObjectTypeAnnotation<PropTypeAnnotation>
  | ReservedPropTypeAnnotation
  | ArrayTypeAnnotation<ObjectTypeAnnotation<PropTypeAnnotation>>,
>;

export type ComponentCommandArrayTypeAnnotation = ArrayTypeAnnotation<
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  // Mixed is not great. This generally means its a type alias to another type
  // like an object or union. Ideally we'd encode that type in the schema so the compat-check can
  // validate those deeper objects for breaking changes and the generators can do something smarter.
  // As of now, the generators just create ReadableMap or (const NSArray *) which are untyped
  | MixedTypeAnnotation,
>;

export type ArrayTypeAnnotation<+T> = $ReadOnly<{
  type: 'ArrayTypeAnnotation',
  elementType: T,
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
  | ComponentArrayTypeAnnotation
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
  | StringTypeAnnotation
  | ComponentCommandArrayTypeAnnotation;

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
  eventEmitters: $ReadOnlyArray<NativeModuleEventEmitterShape>,
  methods: $ReadOnlyArray<NativeModulePropertyShape>,
}>;

export type NativeModuleEventEmitterShape =
  NamedShape<EventEmitterTypeAnnotation>;

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
> = ArrayTypeAnnotation<
  | T
  /**
   * TODO(T72031674): Migrate all our NativeModule specs to not use
   * invalid Array ElementTypes. Then, make the elementType required.
   */
  | UnsafeAnyTypeAnnotation,
>;

export type UnsafeAnyTypeAnnotation = {
  type: 'AnyTypeAnnotation',
};

export type NativeModuleNumberTypeAnnotation = $ReadOnly<{
  type: 'NumberTypeAnnotation',
}>;

export type NativeModuleEnumMember = {
  name: string,
  value: StringLiteralTypeAnnotation | NumberLiteralTypeAnnotation,
};

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
  members: $ReadOnlyArray<NativeModuleEnumMember>,
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
  elementType: VoidTypeAnnotation | Nullable<NativeModuleBaseTypeAnnotation>,
}>;

export type NativeModuleUnionTypeAnnotationMemberType =
  | NativeModuleObjectTypeAnnotation
  | StringLiteralTypeAnnotation
  | NumberLiteralTypeAnnotation
  | BooleanLiteralTypeAnnotation
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | NumberTypeAnnotation;

export type NativeModuleUnionTypeAnnotation =
  UnionTypeAnnotation<NativeModuleUnionTypeAnnotationMemberType>;

export type NativeModuleMixedTypeAnnotation = $ReadOnly<{
  type: 'MixedTypeAnnotation',
}>;

type NativeModuleEventEmitterBaseTypeAnnotation =
  | BooleanTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NumberLiteralTypeAnnotation
  | BooleanLiteralTypeAnnotation
  | StringTypeAnnotation
  | StringLiteralTypeAnnotation
  | StringLiteralUnionTypeAnnotation
  | NativeModuleTypeAliasTypeAnnotation
  | NativeModuleGenericObjectTypeAnnotation
  | VoidTypeAnnotation;

export type NativeModuleEventEmitterTypeAnnotation =
  | NativeModuleEventEmitterBaseTypeAnnotation
  | ArrayTypeAnnotation<NativeModuleEventEmitterBaseTypeAnnotation>;

export type NativeModuleBaseTypeAnnotation =
  | StringTypeAnnotation
  | StringLiteralTypeAnnotation
  | StringLiteralUnionTypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NumberLiteralTypeAnnotation
  | BooleanLiteralTypeAnnotation
  | Int32TypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | BooleanTypeAnnotation
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
  | NativeModuleReturnOnlyTypeAnnotation
  | NativeModuleEventEmitterTypeAnnotation;

type NativeModuleParamOnlyTypeAnnotation = NativeModuleFunctionTypeAnnotation;

type NativeModuleReturnOnlyTypeAnnotation =
  | NativeModulePromiseTypeAnnotation
  | VoidTypeAnnotation;

// Add the allowed component reserved types to the native module union
export type CompleteReservedTypeAnnotation =
  | ReservedTypeAnnotation
  | {
      type: 'ReservedTypeAnnotation',
      name: ReservedPropTypeAnnotation['name'],
    };

// Used by compatibility check which needs to handle all possible types
// This will eventually also include the union of all view manager types
export type CompleteTypeAnnotation =
  | NativeModuleTypeAnnotation
  | NativeModuleFunctionTypeAnnotation
  | NullableTypeAnnotation<NativeModuleTypeAnnotation>
  | EventEmitterTypeAnnotation
  | NativeModuleEnumDeclarationWithMembers
  | UnsafeAnyTypeAnnotation
  | ArrayTypeAnnotation<CompleteTypeAnnotation>
  | ObjectTypeAnnotation<CompleteTypeAnnotation>
  | NativeModuleUnionTypeAnnotationMemberType
  // Components
  | CommandTypeAnnotation
  | CompleteReservedTypeAnnotation;
