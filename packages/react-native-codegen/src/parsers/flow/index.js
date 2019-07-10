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
import type {SchemaBuilderConfig} from './schema.js';
// $FlowFixMe there's no flowtype flow-parser
const flowParser = require('flow-parser');
const fs = require('fs');
const {buildSchema} = require('./schema');
const {getCommands} = require('./commands');
const {getEvents} = require('./events');
const {getProps} = require('./props');
const {getOptions} = require('./options');
const {getExtendsProps} = require('./extends');
const {getMethods} = require('./methods');

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

function getTypes(ast) {
  return ast.body.reduce((types, node) => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration.type !== 'VariableDeclaration') {
        types[node.declaration.id.name] = node.declaration;
      }
    } else if (
      node.type === 'TypeAlias' ||
      node.type === 'InterfaceDeclaration'
    ) {
      types[node.id.name] = node;
    }
    return types;
  }, {});
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

function getConfigType(ast): 'module' | 'component' {
  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );
  if (defaultExports.length !== 1) {
    throw new Error('File should contain only one default export.');
  }
  if (defaultExports[0].declaration && defaultExports[0].declaration.callee) {
    const statement = defaultExports[0].declaration.callee;
    if (statement.name === 'codegenNativeComponent') {
      return 'component';
    }
    if (statement.object && statement.object.name === 'TurboModuleRegistry') {
      return 'module';
    }
  }
  throw new Error(
    `Default export for module specified incorrectly. It should containts
    either "TurboModuleRegistry.getEnforcing" or "codegenNativeComponent".`,
  );
}

function getModuleProperties(types, interfaceName) {
  if (types[interfaceName] && types[interfaceName].body) {
    return types[interfaceName].body.properties;
  }
  throw new Error(
    `Interface properties for "${interfaceName} has been specified incorrectly."`,
  );
}

function findModuleConfig(
  ast,
): $ReadOnly<{|moduleName: string, interfaceName: string|}> {
  const defaultExport = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  )[0];
  try {
    const interfaceName =
      defaultExport.declaration.typeArguments.params[0].id.name;

    const moduleName = defaultExport.declaration.arguments[0].value;
    return {interfaceName, moduleName};
  } catch (e) {
    throw new Error(
      `Default export for module specified incorrectly. It should containts
      either "TurboModuleRegistry.getEnforcing" or "codegenNativeComponent".`,
    );
  }
}

function processString(contents: string): SchemaBuilderConfig {
  const ast = flowParser.parse(contents);

  const types = getTypes(ast);

  const configType = getConfigType(ast);

  if (configType === 'component') {
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
      configType,
      filename: componentName,
      componentName,
      options,
      extendsProps,
      events,
      props,
      commands,
    };
  } else {
    const {interfaceName, moduleName} = findModuleConfig(ast);

    const moduleProperties = getModuleProperties(types, interfaceName);
    const properties = getMethods(moduleProperties, types);
    return {configType, properties, filename: moduleName, moduleName};
  }
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
