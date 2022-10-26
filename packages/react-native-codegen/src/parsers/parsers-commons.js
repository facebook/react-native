/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {
  SchemaType,
  NativeModuleSchema,
  NativeModuleTypeAnnotation,
  Nullable,
  NativeModuleMixedTypeAnnotation,
  UnionTypeAnnotationMemberType,
  NativeModuleUnionTypeAnnotation,
} from '../CodegenSchema.js';
const {
  IncorrectlyParameterizedGenericParserError,
  UnsupportedUnionTypeAnnotationParserError,
} = require('./errors');
import type {ParserType} from './errors';

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
  language: ParserType,
) {
  if (typeAnnotation.typeParameters == null) {
    throw new IncorrectlyParameterizedGenericParserError(
      moduleName,
      typeAnnotation,
      language,
    );
  }

  const typeAnnotationType =
    language === 'TypeScript'
      ? 'TSTypeParameterInstantiation'
      : 'TypeParameterInstantiation';

  invariant(
    typeAnnotation.typeParameters.type === typeAnnotationType,
    `assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type '${typeAnnotationType}'`,
  );

  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new IncorrectlyParameterizedGenericParserError(
      moduleName,
      typeAnnotation,
      language,
    );
  }
}

function emitMixedTypeAnnotation(
  nullable: boolean,
): Nullable<NativeModuleMixedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'MixedTypeAnnotation',
  });
}

function remapUnionTypeAnnotationMemberNames(
  types: $FlowFixMe,
  language: ParserType,
): UnionTypeAnnotationMemberType[] {
  const remapLiteral = (item: $FlowFixMe) => {
    if (language === 'Flow') {
      return item.type
        .replace('NumberLiteralTypeAnnotation', 'NumberTypeAnnotation')
        .replace('StringLiteralTypeAnnotation', 'StringTypeAnnotation');
    }

    return item.literal
      ? item.literal.type
          .replace('NumericLiteral', 'NumberTypeAnnotation')
          .replace('StringLiteral', 'StringTypeAnnotation')
      : 'ObjectTypeAnnotation';
  };

  return types
    .map(remapLiteral)
    .filter((value, index, self) => self.indexOf(value) === index);
}

function emitUnionTypeAnnotation(
  nullable: boolean,
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  language: ParserType,
): Nullable<NativeModuleUnionTypeAnnotation> {
  const unionTypes = remapUnionTypeAnnotationMemberNames(
    typeAnnotation.types,
    language,
  );

  // Only support unionTypes of the same kind
  if (unionTypes.length > 1) {
    throw new UnsupportedUnionTypeAnnotationParserError(
      hasteModuleName,
      typeAnnotation,
      unionTypes,
      language,
    );
  }

  return wrapNullable(nullable, {
    type: 'UnionTypeAnnotation',
    memberType: unionTypes[0],
  });
}

module.exports = {
  wrapModuleSchema,
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  emitMixedTypeAnnotation,
  emitUnionTypeAnnotation,
};
