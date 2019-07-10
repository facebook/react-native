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

import type {ComponentSchemaBuilderConfig} from './schema.js';
const {getCommands} = require('./commands');
const {getEvents} = require('./events');
const {getProps} = require('./props');
const {getOptions} = require('./options');
const {getExtendsProps} = require('./extends');

function findComponentConfig(ast) {
  const foundConfigs = [];

  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );

  defaultExports.forEach(statement => {
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

  const foundConfig = foundConfigs[0];

  const namedExports = ast.body.filter(
    node => node.type === 'ExportNamedDeclaration',
  );

  const commandsTypeNames = namedExports
    .map(statement => {
      let calleeName;
      try {
        calleeName = statement.declaration.declarations[0].init.callee.name;
      } catch (e) {
        // Not a function call
        return;
      }

      if (calleeName !== 'codegenNativeCommands') {
        return;
      }

      const typeArgumentParam =
        statement.declaration.declarations[0].init.typeArguments.params[0];

      if (typeArgumentParam.type !== 'GenericTypeAnnotation') {
        throw new Error(
          "codegenNativeCommands doesn't support inline definitions. Specify a file local type alias",
        );
      }

      return typeArgumentParam.id.name;
    })
    .filter(Boolean);

  if (commandsTypeNames.length > 1) {
    throw new Error('codegenNativeCommands may only be called once in a file');
  }

  return {
    ...foundConfig,
    commandTypeName: commandsTypeNames[0],
  };
}

function getPropProperties(propsTypeName, types) {
  const typeAlias = types[propsTypeName];
  try {
    return typeAlias.right.typeParameters.params[0].properties;
  } catch (e) {
    throw new Error(
      `Failed to find type definition for "${propsTypeName}", please check that you have a valid codegen flow file`,
    );
  }
}

function getCommandProperties(commandTypeName, types) {
  if (commandTypeName == null) {
    return [];
  }

  const typeAlias = types[commandTypeName];

  if (typeAlias.type !== 'InterfaceDeclaration') {
    throw new Error(
      `The type argument for codegenNativeCommands must be an interface, receieved ${
        typeAlias.type
      }`,
    );
  }

  try {
    return typeAlias.body.properties;
  } catch (e) {
    throw new Error(
      `Failed to find type definition for "${commandTypeName}", please check that you have a valid codegen flow file`,
    );
  }
}

// $FlowFixMe there's no flowtype for AST
function processComponent(ast, types): ComponentSchemaBuilderConfig {
  const {
    componentName,
    propsTypeName,
    commandTypeName,
    optionsExpression,
  } = findComponentConfig(ast);

  const propProperties = getPropProperties(propsTypeName, types);
  const commandProperties = getCommandProperties(commandTypeName, types);

  const extendsProps = getExtendsProps(propProperties);
  const options = getOptions(optionsExpression);

  const props = getProps(propProperties);
  const events = getEvents(propProperties, types);
  const commands = getCommands(commandProperties);

  return {
    filename: componentName,
    componentName,
    options,
    extendsProps,
    events,
    props,
    commands,
  };
}

module.exports = {
  processComponent,
};
