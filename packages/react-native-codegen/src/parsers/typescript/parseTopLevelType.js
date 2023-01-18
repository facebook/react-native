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

import type {TypeDeclarationMap} from '../utils';

export type LegalDefaultValues = string | number | boolean | null;

type TopLevelTypeInternal = {
  unions: Array<$FlowFixMe>,
  optional: boolean,
  defaultValue?: LegalDefaultValues,
};

export type TopLevelType = {
  type: $FlowFixMe,
  optional: boolean,
  defaultValue?: LegalDefaultValues,
};

function getValueFromTypes(
  value: $FlowFixMe,
  types: TypeDeclarationMap,
): $FlowFixMe {
  switch (value.type) {
    case 'TSTypeReference':
      if (types[value.typeName.name]) {
        return getValueFromTypes(types[value.typeName.name], types);
      } else {
        return value;
      }
    case 'TSTypeAliasDeclaration':
      return getValueFromTypes(value.typeAnnotation, types);
    default:
      return value;
  }
}

function isNull(t: $FlowFixMe) {
  return t.type === 'TSNullKeyword' || t.type === 'TSUndefinedKeyword';
}

function isNullOrVoid(t: $FlowFixMe) {
  return isNull(t) || t.type === 'TSVoidKeyword';
}

function couldBeNumericLiteral(type: string) {
  return type === 'Literal' || type === 'NumericLiteral';
}

function couldBeSimpleLiteral(type: string) {
  return (
    couldBeNumericLiteral(type) ||
    type === 'StringLiteral' ||
    type === 'BooleanLiteral'
  );
}

function evaluateLiteral(
  literalNode: $FlowFixMe,
): string | number | boolean | null {
  const valueType = literalNode.type;
  if (valueType === 'TSLiteralType') {
    const literal = literalNode.literal;
    if (couldBeSimpleLiteral(literal.type)) {
      if (
        typeof literal.value === 'string' ||
        typeof literal.value === 'number' ||
        typeof literal.value === 'boolean'
      ) {
        return literal.value;
      }
    } else if (
      literal.type === 'UnaryExpression' &&
      literal.operator === '-' &&
      couldBeNumericLiteral(literal.argument.type) &&
      typeof literal.argument.value === 'number'
    ) {
      return -literal.argument.value;
    }
  } else if (isNull(literalNode)) {
    return null;
  }

  throw new Error(
    'The default value in WithDefault must be string, number, boolean or null .',
  );
}

function handleUnionAndParen(
  type: $FlowFixMe,
  result: TopLevelTypeInternal,
  knownTypes?: TypeDeclarationMap,
): void {
  switch (type.type) {
    case 'TSParenthesizedType': {
      handleUnionAndParen(type.typeAnnotation, result, knownTypes);
      break;
    }
    case 'TSUnionType': {
      // the order is important
      // result.optional must be set first
      for (const t of type.types) {
        if (isNullOrVoid(t)) {
          result.optional = true;
        }
      }
      for (const t of type.types) {
        if (!isNullOrVoid(t)) {
          handleUnionAndParen(t, result, knownTypes);
        }
      }
      break;
    }
    case 'TSTypeReference':
      if (type.typeName.name === 'Readonly') {
        handleUnionAndParen(type.typeParameters.params[0], result, knownTypes);
      } else if (type.typeName.name === 'WithDefault') {
        if (result.optional) {
          throw new Error(
            'WithDefault<> is optional and does not need to be marked as optional. Please remove the union of undefined and/or null',
          );
        }
        if (type.typeParameters.params.length !== 2) {
          throw new Error(
            'WithDefault requires two parameters: type and default value.',
          );
        }
        if (result.defaultValue !== undefined) {
          throw new Error(
            'Multiple WithDefault is not allowed nested or in a union type.',
          );
        }
        result.optional = true;
        result.defaultValue = evaluateLiteral(type.typeParameters.params[1]);
        handleUnionAndParen(type.typeParameters.params[0], result, knownTypes);
      } else if (!knownTypes) {
        result.unions.push(type);
      } else {
        const resolvedType = getValueFromTypes(type, knownTypes);
        if (
          resolvedType.type === 'TSTypeReference' &&
          resolvedType.typeName.name === type.typeName.name
        ) {
          result.unions.push(type);
        } else {
          handleUnionAndParen(resolvedType, result, knownTypes);
        }
      }
      break;
    default:
      result.unions.push(type);
  }
}

function parseTopLevelType(
  type: $FlowFixMe,
  knownTypes?: TypeDeclarationMap,
): TopLevelType {
  let result: TopLevelTypeInternal = {unions: [], optional: false};
  handleUnionAndParen(type, result, knownTypes);
  if (result.unions.length === 0) {
    throw new Error('Union type could not be just null or undefined.');
  } else if (result.unions.length === 1) {
    return {
      type: result.unions[0],
      optional: result.optional,
      defaultValue: result.defaultValue,
    };
  } else {
    return {
      type: {type: 'TSUnionType', types: result.unions},
      optional: result.optional,
      defaultValue: result.defaultValue,
    };
  }
}

module.exports = {
  parseTopLevelType,
};
