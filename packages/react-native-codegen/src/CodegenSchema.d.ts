/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type PlatformType =
  | 'iOS'
  | 'android';

export interface SchemaType {
  readonly modules: {
    [hasteModuleName: string]: ComponentSchema | NativeModuleSchema;
  };
}

/**
 * Component Type Annotations
 */
export interface DoubleTypeAnnotation {
  readonly type: 'DoubleTypeAnnotation';
}

export interface FloatTypeAnnotation {
  readonly type: 'FloatTypeAnnotation';
}

export interface BooleanTypeAnnotation {
  readonly type: 'BooleanTypeAnnotation';
}

export interface Int32TypeAnnotation {
  readonly type: 'Int32TypeAnnotation';
}

export interface StringTypeAnnotation {
  readonly type: 'StringTypeAnnotation';
}

export interface StringEnumTypeAnnotation {
  readonly type: 'StringEnumTypeAnnotation';
  readonly options: readonly string[];
}

export interface VoidTypeAnnotation {
  readonly type: 'VoidTypeAnnotation';
}

export interface ObjectTypeAnnotation<T> {
  readonly type: 'ObjectTypeAnnotation';
  readonly properties: readonly NamedShape<T>[];
  // metadata for objects that generated from interfaces
  readonly baseTypes?: readonly string[] | undefined;
}

export interface MixedTypeAnnotation {
  readonly type: 'MixedTypeAnnotation';
}

export interface EventEmitterTypeAnnotation {
  readonly type: 'EventEmitterTypeAnnotation';
  readonly typeAnnotation: NativeModuleEventEmitterTypeAnnotation;
}

export interface FunctionTypeAnnotation<P, R> {
  readonly type: 'FunctionTypeAnnotation';
  readonly params: readonly NamedShape<P>[];
  readonly returnTypeAnnotation: R;
}

export interface NamedShape<T> {
  readonly name: string;
  readonly optional: boolean;
  readonly typeAnnotation: T;
}

export interface ComponentSchema {
  readonly type: 'Component';
  readonly components: {
    [componentName: string]: ComponentShape;
  };
}

export interface ComponentShape extends OptionsShape {
  readonly extendsProps: readonly ExtendsPropsShape[];
  readonly events: readonly EventTypeShape[];
  readonly props: readonly NamedShape<PropTypeAnnotation>[];
  readonly commands: readonly NamedShape<CommandTypeAnnotation>[];
  readonly deprecatedViewConfigName?: string | undefined;
}

export interface OptionsShape {
  readonly interfaceOnly?: boolean | undefined;
  // Use for components with no current paper rename in progress
  // Does not check for new name
  readonly paperComponentName?: string | undefined;
  // Use for components that are not used on other platforms.
  readonly excludedPlatforms?: readonly PlatformType[] | undefined;
  // Use for components currently being renamed in paper
  // Will use new name if it is available and fallback to this name
  readonly paperComponentNameDeprecated?: string | undefined;
}

export interface ExtendsPropsShape {
  readonly type: 'ReactNativeBuiltInType';
  readonly knownTypeName: 'ReactNativeCoreViewProps';
}

export interface EventTypeShape {
  readonly name: string;
  readonly bubblingType:
  | 'direct'
  | 'bubble';
  readonly optional: boolean;
  readonly paperTopLevelNameDeprecated?: string | undefined;
  readonly typeAnnotation: {
    readonly type: 'EventTypeAnnotation';
    readonly argument?: ObjectTypeAnnotation<EventTypeAnnotation> | undefined;
  };
}

export type EventTypeAnnotation =
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  | MixedTypeAnnotation
  | StringEnumTypeAnnotation
  | ObjectTypeAnnotation<EventTypeAnnotation>
  | {
    readonly type: 'ArrayTypeAnnotation';
    readonly elementType: EventTypeAnnotation
  };

export type ArrayTypeAnnotation = {
  readonly type: 'ArrayTypeAnnotation';
  readonly elementType:
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  | {
    readonly type: 'StringEnumTypeAnnotation';
    readonly default: string;
    readonly options: readonly string[];
  }
  | ObjectTypeAnnotation<PropTypeAnnotation>
  | ReservedPropTypeAnnotation
  | {
    readonly type: 'ArrayTypeAnnotation';
    readonly elementType: ObjectTypeAnnotation<PropTypeAnnotation>;
  };
}

export type PropTypeAnnotation =
  | {
    readonly type: 'BooleanTypeAnnotation';
    readonly default: boolean | null;
  }
  | {
    readonly type: 'StringTypeAnnotation';
    readonly default: string | null;
  }
  | {
    readonly type: 'DoubleTypeAnnotation';
    readonly default: number;
  }
  | {
    readonly type: 'FloatTypeAnnotation';
    readonly default: number | null;
  }
  | {
    readonly type: 'Int32TypeAnnotation';
    readonly default: number;
  }
  | {
    readonly type: 'StringEnumTypeAnnotation';
    readonly default: string;
    readonly options: readonly string[];
  }
  | {
    readonly type: 'Int32EnumTypeAnnotation';
    readonly default: number;
    readonly options: readonly number[];
  }
  | ReservedPropTypeAnnotation
  | ObjectTypeAnnotation<PropTypeAnnotation>
  | ArrayTypeAnnotation
  | MixedTypeAnnotation;

export interface ReservedPropTypeAnnotation {
  readonly type: 'ReservedPropTypeAnnotation';
  readonly name:
  | 'ColorPrimitive'
  | 'ImageSourcePrimitive'
  | 'PointPrimitive'
  | 'EdgeInsetsPrimitive'
  | 'ImageRequestPrimitive'
  | 'DimensionPrimitive';
}

export type CommandTypeAnnotation = FunctionTypeAnnotation<
  CommandParamTypeAnnotation,
  VoidTypeAnnotation
>;

export type CommandParamTypeAnnotation =
  | ReservedTypeAnnotation
  | BooleanTypeAnnotation
  | Int32TypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | StringTypeAnnotation
  | ArrayTypeAnnotation;

export interface ReservedTypeAnnotation {
  readonly type: 'ReservedTypeAnnotation';
  readonly name: 'RootTag'; // Union with more custom types.
}

/**
 * NativeModule Types
 */
export type Nullable<T extends NativeModuleTypeAnnotation> =
  | NullableTypeAnnotation<T>
  | T;

export interface NullableTypeAnnotation<T extends NativeModuleTypeAnnotation> {
  readonly type: 'NullableTypeAnnotation';
  readonly typeAnnotation: T;
}

export interface NativeModuleSchema {
  readonly type: 'NativeModule';
  readonly aliasMap: NativeModuleAliasMap;
  readonly enumMap: NativeModuleEnumMap;
  readonly spec: NativeModuleSpec;
  readonly moduleName: string;
  // Use for modules that are not used on other platforms.
  // TODO: It's clearer to define `restrictedToPlatforms` instead, but
  // `excludedPlatforms` is used here to be consistent with ComponentSchema.
  readonly excludedPlatforms?: readonly PlatformType[] | undefined;
}

export interface NativeModuleSpec {
  readonly eventEmitters: readonly NativeModuleEventEmitterShape[];
  readonly methods: readonly NativeModulePropertyShape[];
}

export type NativeModulePropertyShape = NamedShape<
  Nullable<NativeModuleFunctionTypeAnnotation>
>;

export type NativeModuleEventEmitterShape = NamedShape<EventEmitterTypeAnnotation>;

export interface NativeModuleEnumMap {
  readonly [enumName: string]: NativeModuleEnumDeclarationWithMembers;
}

export interface NativeModuleAliasMap {
  readonly [aliasName: string]: NativeModuleObjectTypeAnnotation;
}

export type NativeModuleFunctionTypeAnnotation = FunctionTypeAnnotation<
  Nullable<NativeModuleParamTypeAnnotation>,
  Nullable<NativeModuleReturnTypeAnnotation>
>;

export type NativeModuleObjectTypeAnnotation = ObjectTypeAnnotation<
  Nullable<NativeModuleBaseTypeAnnotation>
>;

export interface NativeModuleArrayTypeAnnotation<T extends Nullable<NativeModuleBaseTypeAnnotation>> {
  readonly type: 'ArrayTypeAnnotation';
  /**
   * TODO(T72031674): Migrate all our NativeModule specs to not use
   * invalid Array ElementTypes. Then, make the elementType required.
   */
  readonly elementType: T | UnsafeAnyTypeAnnotation;
}

export interface UnsafeAnyTypeAnnotation {
  readonly type: 'AnyTypeAnnotation',
}

export interface NativeModuleNumberLiteralTypeAnnotation {
  readonly type: 'NumberLiteralTypeAnnotation';
  readonly value: number;
}

export interface NativeModuleStringTypeAnnotation {
  readonly type: 'StringTypeAnnotation';
}

export interface NativeModuleStringLiteralTypeAnnotation {
  readonly type: 'StringLiteralTypeAnnotation';
  readonly value: string;
}

export interface NativeModuleStringLiteralUnionTypeAnnotation {
  readonly type: 'StringLiteralUnionTypeAnnotation';
  readonly types: NativeModuleStringLiteralTypeAnnotation[];
}

export interface NativeModuleNumberTypeAnnotation {
  readonly type: 'NumberTypeAnnotation';
}

export interface NativeModuleInt32TypeAnnotation {
  readonly type: 'Int32TypeAnnotation';
}

export interface NativeModuleDoubleTypeAnnotation {
  readonly type: 'DoubleTypeAnnotation';
}

export interface NativeModuleFloatTypeAnnotation {
  readonly type: 'FloatTypeAnnotation';
}

export interface NativeModuleBooleanTypeAnnotation {
  readonly type: 'BooleanTypeAnnotation';
}

export type NativeModuleEnumMember = {
  readonly name: string;
  readonly value: NativeModuleStringLiteralTypeAnnotation | NativeModuleNumberLiteralTypeAnnotation,
};

export type NativeModuleEnumMemberType =
  | 'NumberTypeAnnotation'
  | 'StringTypeAnnotation';

export interface NativeModuleEnumDeclaration {
  readonly name: string;
  readonly type: 'EnumDeclaration';
  readonly memberType: NativeModuleEnumMemberType;
}

export interface NativeModuleEnumDeclarationWithMembers {
  name: string;
  type: 'EnumDeclarationWithMembers';
  memberType: NativeModuleEnumMemberType;
  members: readonly NativeModuleEnumMember[];
}

export interface NativeModuleGenericObjectTypeAnnotation {
  readonly type: 'GenericObjectTypeAnnotation';
  // a dictionary type is codegen as "Object"
  // but we know all its members are in the same type
  // when it happens, the following field is non-null
  readonly dictionaryValueType?: Nullable<NativeModuleTypeAnnotation> | undefined;
}

export interface NativeModuleTypeAliasTypeAnnotation {
  readonly type: 'TypeAliasTypeAnnotation';
  readonly name: string;
}

export interface NativeModulePromiseTypeAnnotation {
  readonly type: 'PromiseTypeAnnotation';
  readonly elementType: Nullable<NativeModuleBaseTypeAnnotation> | VoidTypeAnnotation;
}

export type UnionTypeAnnotationMemberType =
  | 'NumberTypeAnnotation'
  | 'ObjectTypeAnnotation'
  | 'StringTypeAnnotation';

export interface NativeModuleUnionTypeAnnotation {
  readonly type: 'UnionTypeAnnotation';
  readonly memberType: UnionTypeAnnotationMemberType;
}

export interface NativeModuleMixedTypeAnnotation {
  readonly type: 'MixedTypeAnnotation';
}

export type NativeModuleEventEmitterBaseTypeAnnotation =
  | NativeModuleBooleanTypeAnnotation
  | NativeModuleDoubleTypeAnnotation
  | NativeModuleFloatTypeAnnotation
  | NativeModuleInt32TypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NativeModuleNumberLiteralTypeAnnotation
  | NativeModuleStringTypeAnnotation
  | NativeModuleStringLiteralTypeAnnotation
  | NativeModuleStringLiteralUnionTypeAnnotation
  | NativeModuleTypeAliasTypeAnnotation
  | NativeModuleGenericObjectTypeAnnotation
  | VoidTypeAnnotation;

export type NativeModuleEventEmitterTypeAnnotation =
  | NativeModuleEventEmitterBaseTypeAnnotation
  | {
    readonly type: 'ArrayTypeAnnotation';
    readonly elementType: NativeModuleEventEmitterBaseTypeAnnotation;
  };

export type NativeModuleBaseTypeAnnotation =
  | NativeModuleStringTypeAnnotation
  | NativeModuleStringLiteralTypeAnnotation
  | NativeModuleStringLiteralUnionTypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NativeModuleNumberLiteralTypeAnnotation
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
  | NativeModuleReturnOnlyTypeAnnotation
  | NativeModuleEventEmitterTypeAnnotation;

type NativeModuleParamOnlyTypeAnnotation = NativeModuleFunctionTypeAnnotation;

type NativeModuleReturnOnlyTypeAnnotation =
  | NativeModuleFunctionTypeAnnotation
  | NativeModulePromiseTypeAnnotation
  | VoidTypeAnnotation;
