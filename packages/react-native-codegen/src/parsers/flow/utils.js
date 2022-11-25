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

import type {SchemaType} from '../../CodegenSchema';
import type {Parser} from '../parser';
import type {TypeAliasResolutionStatus, TypeDeclarationMap} from '../utils';
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('./components/schema');
const {buildModuleSchema} = require('./modules');

// $FlowFixMe[untyped-import] there's no flowtype flow-parser
const flowParser = require('flow-parser');
const {
  getConfigType,
  buildSchemaFromConfigType,
  isModuleRegistryCall,
} = require('../utils');

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
    InterfaceExtends(node: $FlowFixMe) {
      if (node.id.name === 'TurboModule') {
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

  const ast = flowParser.parse(contents, {enums: true});
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
 * This FlowFixMe is supposed to refer to an InterfaceDeclaration or TypeAlias
 * declaration type. Unfortunately, we don't have those types, because flow-parser
 * generates them, and flow-parser is not type-safe. In the future, we should find
 * a way to get these types from our flow parser library.
 *
 * TODO(T71778680): Flow type AST Nodes
 */

function getTypes(ast: $FlowFixMe): TypeDeclarationMap {
  return ast.body.reduce((types, node) => {
    if (node.type === 'ExportNamedDeclaration' && node.exportKind === 'type') {
      if (
        node.declaration != null &&
        (node.declaration.type === 'TypeAlias' ||
          node.declaration.type === 'InterfaceDeclaration')
      ) {
        types[node.declaration.id.name] = node.declaration;
      }
    } else if (
      node.type === 'ExportNamedDeclaration' &&
      node.exportKind === 'value' &&
      node.declaration &&
      node.declaration.type === 'EnumDeclaration'
    ) {
      types[node.declaration.id.name] = node.declaration;
    } else if (
      node.type === 'TypeAlias' ||
      node.type === 'InterfaceDeclaration' ||
      node.type === 'EnumDeclaration'
    ) {
      types[node.id.name] = node;
    }
    return types;
  }, {});
}

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
export type ASTNode = Object;

const invariant = require('invariant');

function resolveTypeAnnotation(
  // TODO(T71778680): This is an Flow TypeAnnotation. Flow-type this
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

  let node = typeAnnotation;
  let nullable = false;
  let typeAliasResolutionStatus: TypeAliasResolutionStatus = {
    successful: false,
  };

  for (;;) {
    if (node.type === 'NullableTypeAnnotation') {
      nullable = true;
      node = node.typeAnnotation;
    } else if (node.type === 'GenericTypeAnnotation') {
      typeAliasResolutionStatus = {
        successful: true,
        aliasName: node.id.name,
      };
      const resolvedTypeAnnotation = types[node.id.name];
      if (
        resolvedTypeAnnotation == null ||
        resolvedTypeAnnotation.type === 'EnumDeclaration'
      ) {
        break;
      }

      invariant(
        resolvedTypeAnnotation.type === 'TypeAlias',
        `GenericTypeAnnotation '${node.id.name}' must resolve to a TypeAlias. Instead, it resolved to a '${resolvedTypeAnnotation.type}'`,
      );

      node = resolvedTypeAnnotation.right;
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
  if (value.type === 'GenericTypeAnnotation' && types[value.id.name]) {
    return getValueFromTypes(types[value.id.name].right, types);
  }
  return value;
}

module.exports = {
  buildSchema,
  getValueFromTypes,
  resolveTypeAnnotation,
  getTypes,
};
