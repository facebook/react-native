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

import type {TypeAliasResolutionStatus, TypeDeclarationMap} from '../utils';
import type {Parser} from '../parser';

// $FlowFixMe[untyped-import] Use flow-types for @babel/parser
const babelParser = require('@babel/parser');
const {
  buildSchemaFromConfigType,
  getConfigType,
  isModuleRegistryCall,
} = require('../utils');
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('./components/schema');
const {buildModuleSchema} = require('./modules');
const {parseTopLevelType} = require('./parseTopLevelType');
import type {SchemaType} from '../../CodegenSchema';

function Visitor(infoMap: {isComponent: boolean, isModule: boolean}) {
  return {
    CallExpression(node: $FlowFixMe) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'codegenNativeComponent'
      ) {
        infoMap.isComponent = true;
      }

      if (isModuleRegistryCall(node)) {
        infoMap.isModule = true;
      }
    },

    TSInterfaceDeclaration(node: $FlowFixMe) {
      if (
        Array.isArray(node.extends) &&
        node.extends.some(
          extension => extension.expression.name === 'TurboModule',
        )
      ) {
        infoMap.isModule = true;
      }
    },
  };
}

function buildSchema(
  contents: string,
  filename: ?string,
  parser: Parser,
): SchemaType {
  // Early return for non-Spec JavaScript files
  if (
    !contents.includes('codegenNativeComponent') &&
    !contents.includes('TurboModule')
  ) {
    return {modules: {}};
  }

  const ast = babelParser.parse(contents, {
    sourceType: 'module',
    plugins: ['typescript'],
  }).program;

  const configType = getConfigType(ast, Visitor);

  return buildSchemaFromConfigType(
    configType,
    filename,
    ast,
    wrapComponentSchema,
    buildComponentSchema,
    buildModuleSchema,
    parser,
  );
}

/**
 * TODO(T108222691): Use flow-types for @babel/parser
 */
function getTypes(ast: $FlowFixMe): TypeDeclarationMap {
  return ast.body.reduce((types, node) => {
    switch (node.type) {
      case 'ExportNamedDeclaration': {
        if (node.declaration) {
          switch (node.declaration.type) {
            case 'TSTypeAliasDeclaration':
            case 'TSInterfaceDeclaration':
            case 'TSEnumDeclaration': {
              types[node.declaration.id.name] = node.declaration;
              break;
            }
          }
        }
        break;
      }
      case 'TSTypeAliasDeclaration':
      case 'TSInterfaceDeclaration':
      case 'TSEnumDeclaration': {
        types[node.id.name] = node;
        break;
      }
    }
    return types;
  }, {});
}

// $FlowFixMe[unclear-type] Use flow-types for @babel/parser
export type ASTNode = Object;

const invariant = require('invariant');

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
    const topLevelType = parseTopLevelType(node);
    nullable = nullable || topLevelType.optional;
    node = topLevelType.type;

    if (node.type === 'TSTypeReference') {
      typeAliasResolutionStatus = {
        successful: true,
        aliasName: node.typeName.name,
      };
      const resolvedTypeAnnotation = types[node.typeName.name];
      if (
        resolvedTypeAnnotation == null ||
        resolvedTypeAnnotation.type === 'TSEnumDeclaration'
      ) {
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

module.exports = {
  buildSchema,
  resolveTypeAnnotation,
  getTypes,
};
