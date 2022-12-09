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
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleEnumDeclaration,
  NativeModuleSchema,
  NativeModuleTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
  SchemaType,
} from '../CodegenSchema.js';

import type {Parser} from './parser';
import type {ParserType} from './errors';
import type {ParserErrorCapturer, TypeDeclarationMap} from './utils';

const {
  throwIfPropertyValueTypeIsUnsupported,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfModuleTypeIsUnsupported,
} = require('./error-utils');

const {
  MissingTypeParameterGenericParserError,
  MoreThanOneTypeParameterGenericParserError,
  UnsupportedEnumDeclarationParserError,
  UnsupportedGenericParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnnamedFunctionParamParserError,
} = require('./errors');

const invariant = require('invariant');

function wrapModuleSchema(
  nativeModuleSchema: NativeModuleSchema,
  hasteModuleName: string,
): SchemaType {
  return {
    modules: {
      [hasteModuleName]: nativeModuleSchema,
    },
  };
}

function unwrapNullable<+T: NativeModuleTypeAnnotation>(
  x: Nullable<T>,
): [T, boolean] {
  if (x.type === 'NullableTypeAnnotation') {
    return [x.typeAnnotation, true];
  }

  return [x, false];
}

function wrapNullable<+T: NativeModuleTypeAnnotation>(
  nullable: boolean,
  typeAnnotation: T,
): Nullable<T> {
  if (!nullable) {
    return typeAnnotation;
  }

  return {
    type: 'NullableTypeAnnotation',
    typeAnnotation,
  };
}

function assertGenericTypeAnnotationHasExactlyOneTypeParameter(
  moduleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeAnnotation: $FlowFixMe,
  parser: Parser,
) {
  if (typeAnnotation.typeParameters == null) {
    throw new MissingTypeParameterGenericParserError(
      moduleName,
      typeAnnotation,
      parser,
    );
  }

  const typeAnnotationType = parser.typeParameterInstantiation;

  invariant(
    typeAnnotation.typeParameters.type === typeAnnotationType,
    `assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type '${typeAnnotationType}'`,
  );

  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new MoreThanOneTypeParameterGenericParserError(
      moduleName,
      typeAnnotation,
      parser,
    );
  }
}

function isObjectProperty(property: $FlowFixMe, language: ParserType): boolean {
  switch (language) {
    case 'Flow':
      return (
        property.type === 'ObjectTypeProperty' ||
        property.type === 'ObjectTypeIndexer'
      );
    case 'TypeScript':
      return (
        property.type === 'TSPropertySignature' ||
        property.type === 'TSIndexSignature'
      );
    default:
      return false;
  }
}

function parseObjectProperty(
  property: $FlowFixMe,
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  nullable: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): NamedShape<Nullable<NativeModuleBaseTypeAnnotation>> {
  const language = parser.language();

  if (!isObjectProperty(property, language)) {
    throw new UnsupportedObjectPropertyTypeAnnotationParserError(
      hasteModuleName,
      property,
      property.type,
      language,
    );
  }

  const {optional = false} = property;
  const name = parser.getKeyName(property, hasteModuleName);
  const languageTypeAnnotation =
    language === 'TypeScript'
      ? property.typeAnnotation.typeAnnotation
      : property.value;

  if (
    property.type === 'ObjectTypeIndexer' ||
    property.type === 'TSIndexSignature'
  ) {
    return {
      name,
      optional,
      typeAnnotation: wrapNullable(nullable, {
        type: 'GenericObjectTypeAnnotation',
      }), //TODO: use `emitObject` for typeAnnotation
    };
  }

  const [propertyTypeAnnotation, isPropertyNullable] =
    unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        languageTypeAnnotation,
        types,
        aliasMap,
        tryParse,
        cxxOnly,
      ),
    );

  if (
    propertyTypeAnnotation.type === 'FunctionTypeAnnotation' ||
    propertyTypeAnnotation.type === 'PromiseTypeAnnotation' ||
    propertyTypeAnnotation.type === 'VoidTypeAnnotation'
  ) {
    throwIfPropertyValueTypeIsUnsupported(
      hasteModuleName,
      languageTypeAnnotation,
      property.key,
      propertyTypeAnnotation.type,
      language,
    );
  }

  return {
    name,
    optional,
    typeAnnotation: wrapNullable(isPropertyNullable, propertyTypeAnnotation),
  };
}

function translateDefault(
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  nullable: boolean,
  parser: Parser,
): Nullable<NativeModuleEnumDeclaration> {
  const maybeEnumDeclaration =
    types[parser.nameForGenericTypeAnnotation(typeAnnotation)];

  if (maybeEnumDeclaration && parser.isEnumDeclaration(maybeEnumDeclaration)) {
    const memberType = parser.getMaybeEnumMemberType(maybeEnumDeclaration);

    if (
      memberType === 'NumberTypeAnnotation' ||
      memberType === 'StringTypeAnnotation'
    ) {
      return wrapNullable(nullable, {
        type: 'EnumDeclaration',
        memberType: memberType,
      });
    } else {
      throw new UnsupportedEnumDeclarationParserError(
        hasteModuleName,
        typeAnnotation,
        memberType,
        parser.language(),
      );
    }
  }

  throw new UnsupportedGenericParserError(
    hasteModuleName,
    typeAnnotation,
    parser,
  );
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
): $FlowFixMe {
  return language === 'Flow' ? param.name : param.typeAnnotation;
}

function getParameterName(param: $FlowFixMe, language: ParserType): string {
  return language === 'Flow' ? param.name.name : param.name;
}

function getParameterTypeAnnotation(
  param: $FlowFixMe,
  language: ParserType,
): $FlowFixMe {
  return language === 'Flow'
    ? param.typeAnnotation
    : param.typeAnnotation.typeAnnotation;
}

function getTypeAnnotationReturnType(
  typeAnnotation: $FlowFixMe,
  language: ParserType,
): $FlowFixMe {
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

function buildPropertySchema(
  hasteModuleName: string,
  // TODO(T108222691): [TS] Use flow-types for @babel/parser
  // TODO(T71778680): [Flow] This is an ObjectTypeProperty containing either:
  // - a FunctionTypeAnnotation or GenericTypeAnnotation
  // - a NullableTypeAnnoation containing a FunctionTypeAnnotation or GenericTypeAnnotation
  // Flow type this node
  property: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  language: ParserType,
  resolveTypeAnnotation: $FlowFixMe,
  translateTypeAnnotation: $FlowFixMe,
): NativeModulePropertyShape {
  let nullable: boolean = false;
  let {key, value} = property;
  const methodName: string = key.name;

  if (language === 'TypeScript') {
    value =
      property.type === 'TSMethodSignature'
        ? property
        : property.typeAnnotation;
  }

  ({nullable, typeAnnotation: value} = resolveTypeAnnotation(value, types));

  throwIfModuleTypeIsUnsupported(
    hasteModuleName,
    property.value,
    key.name,
    value.type,
    language,
  );

  return {
    name: methodName,
    optional: Boolean(property.optional),
    typeAnnotation: wrapNullable(
      nullable,
      translateFunctionTypeAnnotation(
        hasteModuleName,
        value,
        types,
        aliasMap,
        tryParse,
        cxxOnly,
        translateTypeAnnotation,
        language,
      ),
    ),
  };
}

module.exports = {
  wrapModuleSchema,
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  isObjectProperty,
  parseObjectProperty,
  translateDefault,
  translateFunctionTypeAnnotation,
  buildPropertySchema,
};
