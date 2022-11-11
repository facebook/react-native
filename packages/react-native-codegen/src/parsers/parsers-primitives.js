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

import type {
  BooleanTypeAnnotation,
  DoubleTypeAnnotation,
  Int32TypeAnnotation,
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleFloatTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleGenericObjectTypeAnnotation,
  NativeModuleMixedTypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePromiseTypeAnnotation,
  NativeModuleTypeAliasTypeAnnotation,
  Nullable,
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

const {
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
} = require('./error-utils');
const {UnnamedFunctionParamParserError} = require('./errors');
const {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  unwrapNullable,
  wrapNullable,
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

function emitMixedTypeAnnotation(
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
): Nullable<NativeModulePromiseTypeAnnotation> {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
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

function getTypeAnnotationParameters(
  typeAnnotation: $FlowFixMe,
  language: ParserType,
): $ReadOnlyArray<$FlowFixMe> {
  return language === 'Flow'
    ? typeAnnotation.params
    : typeAnnotation.parameters;
}

function getFunctionNameFromParameter(
  param: NamedShape<Nullable<NativeModuleParamTypeAnnotation>>,
  language: ParserType,
) {
  return language === 'Flow' ? param.name : param.typeAnnotation;
}

function getParameterName(param: $FlowFixMe, language: ParserType): string {
  return language === 'Flow' ? param.name.name : param.name;
}

function getParameterTypeAnnotation(param: $FlowFixMe, language: ParserType) {
  return language === 'Flow'
    ? param.typeAnnotation
    : param.typeAnnotation.typeAnnotation;
}

function getTypeAnnotationReturnType(
  typeAnnotation: $FlowFixMe,
  language: ParserType,
) {
  return language === 'Flow'
    ? typeAnnotation.returnType
    : typeAnnotation.typeAnnotation.typeAnnotation;
}

function translateFunctionTypeAnnotation(
  hasteModuleName: string,
  // TODO(T108222691): Use flow-types for @babel/parser
  // TODO(T71778680): This is a FunctionTypeAnnotation. Type this.
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  language: ParserType,
): NativeModuleFunctionTypeAnnotation {
  type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;
  const params: Array<Param> = [];

  for (const param of getTypeAnnotationParameters(typeAnnotation, language)) {
    const parsedParam = tryParse(() => {
      if (getFunctionNameFromParameter(param, language) == null) {
        throw new UnnamedFunctionParamParserError(
          param,
          hasteModuleName,
          language,
        );
      }

      const paramName = getParameterName(param, language);

      const [paramTypeAnnotation, isParamTypeAnnotationNullable] =
        unwrapNullable<$FlowFixMe>(
          translateTypeAnnotation(
            hasteModuleName,
            getParameterTypeAnnotation(param, language),
            types,
            aliasMap,
            tryParse,
            cxxOnly,
          ),
        );

      if (
        paramTypeAnnotation.type === 'VoidTypeAnnotation' ||
        paramTypeAnnotation.type === 'PromiseTypeAnnotation'
      ) {
        return throwIfUnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          param.typeAnnotation,
          paramName,
          paramTypeAnnotation.type,
        );
      }

      return {
        name: paramName,
        optional: Boolean(param.optional),
        typeAnnotation: wrapNullable(
          isParamTypeAnnotationNullable,
          paramTypeAnnotation,
        ),
      };
    });

    if (parsedParam != null) {
      params.push(parsedParam);
    }
  }

  const [returnTypeAnnotation, isReturnTypeAnnotationNullable] =
    unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        getTypeAnnotationReturnType(typeAnnotation, language),
        types,
        aliasMap,
        tryParse,
        cxxOnly,
      ),
    );

  throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
    hasteModuleName,
    typeAnnotation,
    'FunctionTypeAnnotation',
    language,
    cxxOnly,
    returnTypeAnnotation.type,
  );

  return {
    type: 'FunctionTypeAnnotation',
    returnTypeAnnotation: wrapNullable(
      isReturnTypeAnnotationNullable,
      returnTypeAnnotation,
    ),
    params,
  };
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
  emitMixedTypeAnnotation,
  typeAliasResolution,
  translateFunctionTypeAnnotation,
};
