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

import type {EventTypeAnnotation, NamedShape} from '../../CodegenSchema.js';
import type {Parser} from '../parser';

const {buildPropertiesForEvent} = require('../parsers-commons');
const {
  emitBoolProp,
  emitDoubleProp,
  emitFloatProp,
  emitInt32Prop,
  emitMixedProp,
  emitObjectProp,
  emitStringProp,
  emitUnionProp,
} = require('../parsers-primitives');

/**
 * Shared event property type resolution for Flow and TypeScript parsers.
 *
 * Both parsers resolve type annotations to normalized names using:
 *   - parser.extractTypeFromTypeAnnotation() to resolve generic/reference types
 *   - parser.convertKeywordToTypeAnnotation() to normalize language-specific keywords
 *
 * Flow-specific types ($ReadOnly, $ReadOnlyArray) are handled inline since
 * TypeScript's parseTopLevelType() resolves them before this function is called.
 */
// Check if a type annotation represents null, undefined, or void.
// Covers both Flow (NullLiteralTypeAnnotation, VoidTypeAnnotation) and
// TypeScript (TSNullKeyword, TSUndefinedKeyword, TSVoidKeyword) AST nodes.
function isNullOrVoidType(typeAnnotation: $FlowFixMe): boolean {
  return (
    typeAnnotation.type === 'NullLiteralTypeAnnotation' ||
    typeAnnotation.type === 'VoidTypeAnnotation' ||
    typeAnnotation.type === 'TSNullKeyword' ||
    typeAnnotation.type === 'TSUndefinedKeyword' ||
    typeAnnotation.type === 'TSVoidKeyword'
  );
}

function getPropertyType(
  name: string,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
): NamedShape<EventTypeAnnotation> {
  const resolvedType = parser.extractTypeFromTypeAnnotation(typeAnnotation);
  const type = parser.convertKeywordToTypeAnnotation(resolvedType);

  // Handle Flow's read-only wrappers (no-op for TS which pre-resolves these)
  if (resolvedType === '$ReadOnly' || resolvedType === 'Readonly') {
    return getPropertyType(
      name,
      optional,
      typeAnnotation.typeParameters.params[0],
      parser,
    );
  }

  if (resolvedType === '$ReadOnlyArray' || resolvedType === 'ReadonlyArray') {
    return {
      name,
      optional,
      typeAnnotation: extractArrayElementType(typeAnnotation, name, parser),
    };
  }

  // For nullable unions (e.g. 'small' | 'large' | null | undefined),
  // strip null/undefined/void types and unwrap single-type unions.
  // TypeScript's parseTopLevelType handles this at the top level, but
  // nested event properties also need this unwrapping.
  if (type === 'UnionTypeAnnotation') {
    const nonNullableTypes = typeAnnotation.types.filter(
      (t: $FlowFixMe) => !isNullOrVoidType(t),
    );
    if (nonNullableTypes.length < typeAnnotation.types.length) {
      // Had nullable types - unwrap
      if (nonNullableTypes.length === 1) {
        return getPropertyType(name, true, nonNullableTypes[0], parser);
      }
      return emitUnionProp(name, true, parser, {
        ...typeAnnotation,
        types: nonNullableTypes,
      });
    }
  }

  switch (type) {
    case 'BooleanTypeAnnotation':
      return emitBoolProp(name, optional);
    case 'StringTypeAnnotation':
      return emitStringProp(name, optional);
    case 'Int32':
      return emitInt32Prop(name, optional);
    case 'Double':
      return emitDoubleProp(name, optional);
    case 'Float':
      return emitFloatProp(name, optional);
    case 'ObjectTypeAnnotation':
      return emitObjectProp(
        name,
        optional,
        parser,
        typeAnnotation,
        extractArrayElementType,
      );
    case 'UnionTypeAnnotation':
      return emitUnionProp(name, optional, parser, typeAnnotation);
    case 'UnsafeMixed':
      return emitMixedProp(name, optional);
    case 'ArrayTypeAnnotation':
      return {
        name,
        optional,
        typeAnnotation: extractArrayElementType(typeAnnotation, name, parser),
      };
    default:
      throw new Error(`Unable to determine event type for "${name}": ${type}`);
  }
}

function extractArrayElementType(
  typeAnnotation: $FlowFixMe,
  name: string,
  parser: Parser,
): EventTypeAnnotation {
  const resolvedType = parser.extractTypeFromTypeAnnotation(typeAnnotation);
  const type = parser.convertKeywordToTypeAnnotation(resolvedType);

  // Handle TS parenthesized types (no-op for Flow)
  if (typeAnnotation.type === 'TSParenthesizedType') {
    return extractArrayElementType(typeAnnotation.typeAnnotation, name, parser);
  }

  // Handle Flow's read-only arrays (no-op for TS which pre-resolves these)
  if (resolvedType === '$ReadOnlyArray' || resolvedType === 'ReadonlyArray') {
    const genericParams = typeAnnotation.typeParameters.params;
    if (genericParams.length !== 1) {
      throw new Error(
        `Events only supports arrays with 1 Generic type. Found ${
          genericParams.length
        } types:\n${JSON.stringify(genericParams, null, 2)}`,
      );
    }
    return {
      type: 'ArrayTypeAnnotation',
      elementType: extractArrayElementType(genericParams[0], name, parser),
    };
  }

  switch (type) {
    case 'BooleanTypeAnnotation':
      return {type: 'BooleanTypeAnnotation'};
    case 'StringTypeAnnotation':
      return {type: 'StringTypeAnnotation'};
    case 'Int32':
      return {type: 'Int32TypeAnnotation'};
    case 'Float':
      return {type: 'FloatTypeAnnotation'};
    case 'NumberTypeAnnotation':
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
      };
    case 'UnionTypeAnnotation':
      return {
        type: 'UnionTypeAnnotation',
        types: typeAnnotation.types.map(option => ({
          type: 'StringLiteralTypeAnnotation',
          value: parser.getLiteralValue(option),
        })),
      };
    case 'UnsafeMixed':
      return {type: 'MixedTypeAnnotation'};
    case 'ObjectTypeAnnotation':
      return {
        type: 'ObjectTypeAnnotation',
        properties: parser
          .getObjectProperties(typeAnnotation)
          .map(member =>
            buildPropertiesForEvent(member, parser, getPropertyType),
          ),
      };
    case 'ArrayTypeAnnotation':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: extractArrayElementType(
          typeAnnotation.elementType,
          name,
          parser,
        ),
      };
    default:
      throw new Error(
        `Unrecognized ${type} for Array ${name} in events.\n${JSON.stringify(
          typeAnnotation,
          null,
          2,
        )}`,
      );
  }
}

module.exports = {
  getPropertyType,
  extractArrayElementType,
};
