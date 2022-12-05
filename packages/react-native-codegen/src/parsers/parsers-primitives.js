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

import type {
  Nullable,
  BooleanTypeAnnotation,
  DoubleTypeAnnotation,
  Int32TypeAnnotation,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleTypeAnnotation,
  NativeModuleFloatTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleGenericObjectTypeAnnotation,
  NativeModuleMixedTypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  NativeModulePromiseTypeAnnotation,
  NativeModuleTypeAliasTypeAnnotation,
  NativeModuleUnionTypeAnnotation,
  ObjectTypeAnnotation,
  ReservedTypeAnnotation,
  StringTypeAnnotation,
  VoidTypeAnnotation,
} from '../CodegenSchema';
import type {ParserType} from './errors';
import type {Parser} from './parser';
import type {
  ParserErrorCapturer,
  TypeAliasResolutionStatus,
  TypeDeclarationMap,
} from './utils';

const {UnsupportedUnionTypeAnnotationParserError} = require('./errors');
const {
  throwIfArrayElementTypeAnnotationIsUnsupported,
} = require('./error-utils');
const {nullGuard} = require('./parsers-utils');
const {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  wrapNullable,
  unwrapNullable,
  translateFunctionTypeAnnotation,
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
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  language: ParserType,
): Nullable<NativeModuleFunctionTypeAnnotation> {
  const translateFunctionTypeAnnotationValue: NativeModuleFunctionTypeAnnotation =
    translateFunctionTypeAnnotation(
      hasteModuleName,
      typeAnnotation,
      types,
      aliasMap,
      tryParse,
      cxxOnly,
      translateTypeAnnotation,
      language,
    );
  return wrapNullable(nullable, translateFunctionTypeAnnotationValue);
}

function emitMixed(
  nullable: boolean,
): Nullable<NativeModuleMixedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'MixedTypeAnnotation',
  });
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
  parser: Parser,
  nullable: boolean,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
): Nullable<NativeModulePromiseTypeAnnotation> {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
  );

  const elementType = typeAnnotation.typeParameters.params[0];
  if (
    elementType.type === 'ExistsTypeAnnotation' ||
    elementType.type === 'EmptyTypeAnnotation'
  ) {
    return wrapNullable(nullable, {
      type: 'PromiseTypeAnnotation',
    });
  } else {
    try {
      return wrapNullable(nullable, {
        type: 'PromiseTypeAnnotation',
        elementType: translateTypeAnnotation(
          hasteModuleName,
          typeAnnotation.typeParameters.params[0],
          types,
          aliasMap,
          tryParse,
          cxxOnly,
        ),
      });
    } catch {
      return wrapNullable(nullable, {
        type: 'PromiseTypeAnnotation',
      });
    }
  }
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

function emitUnion(
  nullable: boolean,
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
): Nullable<NativeModuleUnionTypeAnnotation> {
  const unionTypes = parser.remapUnionTypeAnnotationMemberNames(
    typeAnnotation.types,
  );

  // Only support unionTypes of the same kind
  if (unionTypes.length > 1) {
    throw new UnsupportedUnionTypeAnnotationParserError(
      hasteModuleName,
      typeAnnotation,
      unionTypes,
      parser.language(),
    );
  }

  return wrapNullable(nullable, {
    type: 'UnionTypeAnnotation',
    memberType: unionTypes[0],
  });
}

function translateArrayTypeAnnotation(
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  cxxOnly: boolean,
  arrayType: 'Array' | 'ReadonlyArray',
  elementType: $FlowFixMe,
  nullable: boolean,
  language: ParserType,
  translateTypeAnnotation: $FlowFixMe,
): Nullable<NativeModuleTypeAnnotation> {
  try {
    /**
     * TODO(T72031674): Migrate all our NativeModule specs to not use
     * invalid Array ElementTypes. Then, make the elementType a required
     * parameter.
     */
    const [_elementType, isElementTypeNullable] = unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        elementType,
        types,
        aliasMap,
        /**
         * TODO(T72031674): Ensure that all ParsingErrors that are thrown
         * while parsing the array element don't get captured and collected.
         * Why? If we detect any parsing error while parsing the element,
         * we should default it to null down the line, here. This is
         * the correct behaviour until we migrate all our NativeModule specs
         * to be parseable.
         */
        nullGuard,
        cxxOnly,
      ),
    );

    throwIfArrayElementTypeAnnotationIsUnsupported(
      hasteModuleName,
      elementType,
      arrayType,
      _elementType.type,
      language,
    );

    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
      // $FlowFixMe[incompatible-call]
      elementType: wrapNullable(isElementTypeNullable, _elementType),
    });
  } catch (ex) {
    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
    });
  }
}

function emitArrayType(
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  cxxOnly: boolean,
  nullable: boolean,
  translateTypeAnnotation: $FlowFixMe,
): Nullable<NativeModuleTypeAnnotation> {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
  );

  return translateArrayTypeAnnotation(
    hasteModuleName,
    types,
    aliasMap,
    cxxOnly,
    typeAnnotation.type,
    typeAnnotation.typeParameters.params[0],
    nullable,
    parser.language(),
    translateTypeAnnotation,
  );
}

module.exports = {
  emitArrayType,
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
  emitMixed,
  emitUnion,
  typeAliasResolution,
  translateArrayTypeAnnotation,
};
