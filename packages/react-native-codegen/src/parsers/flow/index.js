/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {SchemaType} from '../../CodegenSchema.js';
// $FlowFixMe there's no flowtype flow-parser
const flowParser = require('flow-parser');
const fs = require('fs');
const {buildSchema} = require('./schema');
const {getEvents} = require('./events');
const {getProps} = require('./props');
const {getOptions} = require('./options');
const {getExtendsProps} = require('./extends');

function findConfig(ast) {
  const foundConfigs = [];

  const allExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );

  allExports.forEach(statement => {
    try {
      if (statement.declaration.callee.name === 'codegenNativeComponent') {
        const typeArgumentParams = statement.declaration.typeArguments.params;
        const funcArgumentParams = statement.declaration.arguments;

        const nativeComponentType = {};
        nativeComponentType.propsTypeName = typeArgumentParams[0].id.name;
        nativeComponentType.componentName = funcArgumentParams[0].value;
        if (funcArgumentParams.length > 1) {
          nativeComponentType.optionsExpression = funcArgumentParams[1];
        }
        foundConfigs.push(nativeComponentType);
      }
    } catch (e) {
      // ignore
    }
  });

  if (foundConfigs.length === 0) {
    throw new Error('Could not find component config for native component');
  }
  if (foundConfigs.length > 1) {
    throw new Error('Only one component is supported per file');
  }

  return foundConfigs[0];
}

function getTypes(ast) {
  return ast.body
    .filter(node => node.type === 'TypeAlias')
    .reduce((types, node) => {
      types[node.id.name] = node;
      return types;
    }, {});
}

function getPropProperties(propsTypeName, types) {
  const typeAlias = types[propsTypeName];
  try {
    return typeAlias.right.typeParameters.params[0].properties;
  } catch (e) {
    throw new Error(
      `Failed find type definition for "${propsTypeName}", please check that you have a valid codegen flow file`,
    );
  }
}

function processString(contents: string) {
  const ast = flowParser.parse(contents);

  const types = getTypes(ast);
  const {componentName, propsTypeName, optionsExpression} = findConfig(ast);

  const propProperties = getPropProperties(propsTypeName, types);

  const extendsProps = getExtendsProps(propProperties);
  const options = getOptions(optionsExpression);

  const props = getProps(propProperties);
  const events = getEvents(propProperties, types);

  return {
    filename: componentName,
    componentName,
    options,
    extendsProps,
    events,
    props,
  };
}

function parseFile(filename: string): ?SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(processString(contents));
}

function parseString(contents: string): ?SchemaType {
  return buildSchema(processString(contents));
}

module.exports = {
  parseFile,
  parseString,
};
