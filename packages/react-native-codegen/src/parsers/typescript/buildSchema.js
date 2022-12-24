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

import type {SchemaType, NativeModuleSchema} from '../../CodegenSchema';
import type {Parser} from '../parser';
import type {ParserErrorCapturer} from '../utils';
import type {ComponentSchemaBuilderConfig} from './components/schema';

const {
  buildSchemaFromConfigType,
  getConfigType,
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
  wrapComponentSchema: (config: ComponentSchemaBuilderConfig) => SchemaType,
  buildComponentSchema: (ast: $FlowFixMe) => ComponentSchemaBuilderConfig,
  buildModuleSchema: (
    hasteModuleName: string,
    ast: $FlowFixMe,
    tryParse: ParserErrorCapturer,
    parser: Parser,
  ) => NativeModuleSchema,
  parser: Parser,
): SchemaType {
  // Early return for non-Spec JavaScript files
  if (
    !contents.includes('codegenNativeComponent') &&
    !contents.includes('TurboModule')
  ) {
    return {modules: {}};
  }

  const ast = parser.getAst(contents);
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

module.exports = {
  buildSchema,
};
