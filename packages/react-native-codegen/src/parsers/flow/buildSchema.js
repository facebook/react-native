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

// $FlowFixMe[untyped-import] there's no flowtype flow-parser
const flowParser = require('flow-parser');
const {
  getConfigType,
  buildSchemaFromConfigType,
  isModuleRegistryCall,
} = require('../utils');
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('./components/schema');
const {buildModuleSchema} = require('./modules');

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

module.exports = {
  buildSchema,
};
