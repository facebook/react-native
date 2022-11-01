/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  Nullable,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleTypeAliasTypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  BooleanTypeAnnotation,
  DoubleTypeAnnotation,
  Int32TypeAnnotation,
  NativeModuleGenericObjectTypeAnnotation,
  ReservedTypeAnnotation,
  ObjectTypeAnnotation,
  NativeModulePromiseTypeAnnotation,
  StringTypeAnnotation,
  VoidTypeAnnotation,
  NativeModuleFloatTypeAnnotation,
} from '../CodegenSchema';
import type {ParserType} from './errors';
import type {TypeAliasResolutionStatus} from './utils';

const {
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
} = require('./parsers-commons');

function emitBoolean(nullable: boolean): Nullable<BooleanTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'BooleanTypeAnnotation',
  });
}

function emitInt32(nullable: boolean): Nullable<Int32TypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'Int32TypeAnnotation',
  });
}

function emitNumber(
  nullable: boolean,
): Nullable<NativeModuleNumberTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'NumberTypeAnnotation',
  });
}

function emitRootTag(nullable: boolean): Nullable<ReservedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'ReservedTypeAnnotation',
    name: 'RootTag',
  });
}

function emitDouble(nullable: boolean): Nullable<DoubleTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'DoubleTypeAnnotation',
  });
}

function emitVoid(nullable: boolean): Nullable<VoidTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'VoidTypeAnnotation',
  });
}

function emitStringish(nullable: boolean): Nullable<StringTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'StringTypeAnnotation',
  });
}
function emitFunction(
  nullable: boolean,
  translateFunctionTypeAnnotationValue: NativeModuleFunctionTypeAnnotation,
): Nullable<NativeModuleFunctionTypeAnnotation> {
  return wrapNullable(nullable, translateFunctionTypeAnnotationValue);
}

function emitString(nullable: boolean): Nullable<StringTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'StringTypeAnnotation',
  });
}

function typeAliasResolution(
  typeAliasResolutionStatus: TypeAliasResolutionStatus,
  objectTypeAnnotation: ObjectTypeAnnotation<
    Nullable<NativeModuleBaseTypeAnnotation>,
  >,
  aliasMap: {...NativeModuleAliasMap},
  nullable: boolean,
):
  | Nullable<NativeModuleTypeAliasTypeAnnotation>
  | Nullable<ObjectTypeAnnotation<Nullable<NativeModuleBaseTypeAnnotation>>> {
  if (!typeAliasResolutionStatus.successful) {
    return wrapNullable(nullable, objectTypeAnnotation);
  }

  /**
   * All aliases RHS are required.
   */
  aliasMap[typeAliasResolutionStatus.aliasName] = objectTypeAnnotation;

  /**
   * Nullability of type aliases is transitive.
   *
   * Consider this case:
   *
   * type Animal = ?{
   *   name: string,
   * };
   *
   * type B = Animal
   *
   * export interface Spec extends TurboModule {
   *   +greet: (animal: B) => void;
   * }
   *
   * In this case, we follow B to Animal, and then Animal to ?{name: string}.
   *
   * We:
   *   1. Replace `+greet: (animal: B) => void;` with `+greet: (animal: ?Animal) => void;`,
   *   2. Pretend that Animal = {name: string}.
   *
   * Why do we do this?
   *  1. In ObjC, we need to generate a struct called Animal, not B.
   *  2. This design is simpler than managing nullability within both the type alias usage, and the type alias RHS.
   *  3. What does it mean for a C++ struct, which is what this type alias RHS will generate, to be nullable? ¯\_(ツ)_/¯
   *     Nullability is a concept that only makes sense when talking about instances (i.e: usages) of the C++ structs.
   *     Hence, it's better to manage nullability within the actual TypeAliasTypeAnnotation nodes, and not the
   *     associated ObjectTypeAnnotations.
   */
  return wrapNullable(nullable, {
    type: 'TypeAliasTypeAnnotation',
    name: typeAliasResolutionStatus.aliasName,
  });
}

function emitPromise(
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  language: ParserType,
  nullable: boolean,
): Nullable<NativeModulePromiseTypeAnnotation> {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    language,
  );

  return wrapNullable(nullable, {
    type: 'PromiseTypeAnnotation',
  });
}

function emitObject(
  nullable: boolean,
): Nullable<NativeModuleGenericObjectTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'GenericObjectTypeAnnotation',
  });
}

function emitFloat(
  nullable: boolean,
): Nullable<NativeModuleFloatTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'FloatTypeAnnotation',
  });
}

module.exports = {
  emitBoolean,
  emitDouble,
  emitFloat,
  emitFunction,
  emitInt32,
  emitNumber,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitStringish,
  typeAliasResolution,
};
