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
} from '../CodegenSchema.js';
const {IncorrectlyParameterizedGenericParserError} = require('./errors');
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

module.exports = {
  wrapModuleSchema,
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  emitMixedTypeAnnotation,
};
