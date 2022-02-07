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

const {ParserError} = require('./errors');

/**
 * TODO(T108222691): Use flow-types for @babel/parser
 */
export type TypeDeclarationMap = {[declarationName: string]: $FlowFixMe};

function getTypes(ast: $FlowFixMe): TypeDeclarationMap {
  return ast.body.reduce((types, node) => {
    if (node.type === 'ExportNamedDeclaration' && node.exportKind === 'type') {
      if (
        node.declaration.type === 'TSTypeAliasDeclaration' ||
        node.declaration.type === 'TSInterfaceDeclaration'
      ) {
        types[node.declaration.id.name] = node.declaration;
      }
    } else if (
      node.type === 'TSTypeAliasDeclaration' ||
      node.type === 'TSInterfaceDeclaration'
    ) {
      types[node.id.name] = node;
    }

    return types;
  }, {});
}

// $FlowFixMe[unclear-type] Use flow-types for @babel/parser
export type ASTNode = Object;

const invariant = require('invariant');

type TypeAliasResolutionStatus =
  | $ReadOnly<{
      successful: true,
      aliasName: string,
    }>
  | $ReadOnly<{
      successful: false,
    }>;

function resolveTypeAnnotation(
  // TODO(T108222691): Use flow-types for @babel/parser
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
): {
  nullable: boolean,
  typeAnnotation: $FlowFixMe,
  typeAliasResolutionStatus: TypeAliasResolutionStatus,
} {
  invariant(
    typeAnnotation != null,
    'resolveTypeAnnotation(): typeAnnotation cannot be null',
  );

  let node =
    typeAnnotation.type === 'TSTypeAnnotation'
      ? typeAnnotation.typeAnnotation
      : typeAnnotation;
  let nullable = false;
  let typeAliasResolutionStatus: TypeAliasResolutionStatus = {
    successful: false,
  };

  for (;;) {
    // Check for optional type in union e.g. T | null | void
    if (
      node.type === 'TSUnionType' &&
      node.types.some(
        t => t.type === 'TSNullKeyword' || t.type === 'TSVoidKeyword',
      )
    ) {
      node = node.types.filter(
        t => t.type !== 'TSNullKeyword' && t.type !== 'TSVoidKeyword',
      )[0];
      nullable = true;
    } else if (node.type === 'TSTypeReference') {
      typeAliasResolutionStatus = {
        successful: true,
        aliasName: node.typeName.name,
      };
      const resolvedTypeAnnotation = types[node.typeName.name];
      if (resolvedTypeAnnotation == null) {
        break;
      }

      invariant(
        resolvedTypeAnnotation.type === 'TSTypeAliasDeclaration',
        `GenericTypeAnnotation '${node.typeName.name}' must resolve to a TSTypeAliasDeclaration. Instead, it resolved to a '${resolvedTypeAnnotation.type}'`,
      );

      node = resolvedTypeAnnotation.typeAnnotation;
    } else {
      break;
    }
  }

  return {
    nullable: nullable,
    typeAnnotation: node,
    typeAliasResolutionStatus,
  };
}

function getValueFromTypes(value: ASTNode, types: TypeDeclarationMap): ASTNode {
  if (value.type === 'TSTypeReference' && types[value.typeName.name]) {
    return getValueFromTypes(types[value.typeName.name], types);
  }

  if (value.type === 'TSTypeAliasDeclaration') {
    return value.typeAnnotation;
  }

  return value;
}

export type ParserErrorCapturer = <T>(fn: () => T) => ?T;

function createParserErrorCapturer(): [
  Array<ParserError>,
  ParserErrorCapturer,
] {
  const errors = [];
  function guard<T>(fn: () => T): ?T {
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof ParserError)) {
        throw error;
      }
      errors.push(error);

      return null;
    }
  }

  return [errors, guard];
}

// TODO(T108222691): Use flow-types for @babel/parser
function visit(
  astNode: $FlowFixMe,
  visitor: {
    [type: string]: (node: $FlowFixMe) => void,
  },
) {
  const queue = [astNode];
  while (queue.length !== 0) {
    let item = queue.shift();

    if (!(typeof item === 'object' && item != null)) {
      continue;
    }

    if (
      typeof item.type === 'string' &&
      typeof visitor[item.type] === 'function'
    ) {
      // Don't visit any children
      visitor[item.type](item);
    } else if (Array.isArray(item)) {
      queue.push(...item);
    } else {
      queue.push(...Object.values(item));
    }
  }
}

// TODO(T108222691): Use flow-types for @babel/parser
function isModuleRegistryCall(node: $FlowFixMe): boolean {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callExpression = node;

  if (callExpression.callee.type !== 'MemberExpression') {
    return false;
  }

  const memberExpression = callExpression.callee;
  if (
    !(
      memberExpression.object.type === 'Identifier' &&
      memberExpression.object.name === 'TurboModuleRegistry'
    )
  ) {
    return false;
  }

  if (
    !(
      memberExpression.property.type === 'Identifier' &&
      (memberExpression.property.name === 'get' ||
        memberExpression.property.name === 'getEnforcing')
    )
  ) {
    return false;
  }

  if (memberExpression.computed) {
    return false;
  }

  return true;
}

module.exports = {
  getValueFromTypes,
  resolveTypeAnnotation,
  createParserErrorCapturer,
  getTypes,
  visit,
  isModuleRegistryCall,
};
