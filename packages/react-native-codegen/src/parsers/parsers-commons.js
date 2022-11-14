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
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleEnumDeclaration,
  NativeModuleSchema,
  NativeModuleTypeAnnotation,
  NativeModuleUnionTypeAnnotation,
  Nullable,
  SchemaType,
} from '../CodegenSchema.js';
import type {ParserType} from './errors';
import type {Parser} from './parser';
import type {ParserErrorCapturer, TypeDeclarationMap} from './utils';

const {throwIfPropertyValueTypeIsUnsupported} = require('./error-utils');
const {
  MissingTypeParameterGenericParserError,
  MoreThanOneTypeParameterGenericParserError,
  UnsupportedEnumDeclarationParserError,
  UnsupportedGenericParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedUnionTypeAnnotationParserError,
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

function emitUnionTypeAnnotation(
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

module.exports = {
  wrapModuleSchema,
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  isObjectProperty,
  parseObjectProperty,
  emitUnionTypeAnnotation,
  translateDefault,
};
