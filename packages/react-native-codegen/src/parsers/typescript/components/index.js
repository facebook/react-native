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
import type {Parser} from '../../parser';
import type {ComponentSchemaBuilderConfig} from '../../schema.js';

const {getCommands} = require('./commands');
const {getEvents} = require('./events');
const {categorizeProps} = require('./extends');
const {getProps} = require('./props');
const {getProperties} = require('./componentsUtils.js');
const {throwIfMoreThanOneCodegenNativecommands} = require('../../error-utils');
const {
  createComponentConfig,
  findNativeComponentType,
  propertyNames,
  getCommandOptions,
  getOptions,
  getCommandTypeNameAndOptionsExpression,
} = require('../../parsers-commons');
const {
  throwIfConfigNotfound,
  throwIfMoreThanOneConfig,
} = require('../../error-utils');

// $FlowFixMe[signature-verification-failure] TODO(T108222691): Use flow-types for @babel/parser
function findComponentConfig(ast: $FlowFixMe, parser: Parser) {
  const foundConfigs: Array<{[string]: string}> = [];

  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );

  defaultExports.forEach(statement =>
    findNativeComponentType(statement, foundConfigs, parser),
  );

  throwIfConfigNotfound(foundConfigs);
  throwIfMoreThanOneConfig(foundConfigs);

  const foundConfig = foundConfigs[0];

  const namedExports = ast.body.filter(
    node => node.type === 'ExportNamedDeclaration',
  );

  const commandsTypeNames = namedExports
    .map(statement => getCommandTypeNameAndOptionsExpression(statement, parser))
    .filter(Boolean);

  throwIfMoreThanOneCodegenNativecommands(commandsTypeNames);

  return createComponentConfig(foundConfig, commandsTypeNames);
}

function getCommandProperties(ast: $FlowFixMe, parser: Parser) {
  const {commandTypeName, commandOptionsExpression} = findComponentConfig(
    ast,
    parser,
  );
  if (commandTypeName == null) {
    return [];
  }

  const types = parser.getTypes(ast);
  const typeAlias = types[commandTypeName];

  if (typeAlias.type !== 'TSInterfaceDeclaration') {
    throw new Error(
      `The type argument for codegenNativeCommands must be an interface, received ${typeAlias.type}`,
    );
  }

  const properties = parser.bodyProperties(typeAlias);
  if (!properties) {
    throw new Error(
      `Failed to find type definition for "${commandTypeName}", please check that you have a valid codegen typescript file`,
    );
  }

  const typeScriptPropertyNames = propertyNames(properties);

  const commandOptions = getCommandOptions(commandOptionsExpression);
  if (commandOptions == null || commandOptions.supportedCommands == null) {
    throw new Error(
      'codegenNativeCommands must be given an options object with supportedCommands array',
    );
  }

  if (
    commandOptions.supportedCommands.length !==
      typeScriptPropertyNames.length ||
    !commandOptions.supportedCommands.every(supportedCommand =>
      typeScriptPropertyNames.includes(supportedCommand),
    )
  ) {
    throw new Error(
      `codegenNativeCommands expected the same supportedCommands specified in the ${commandTypeName} interface: ${typeScriptPropertyNames.join(
        ', ',
      )}`,
    );
  }

  return properties;
}

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type PropsAST = Object;

// $FlowFixMe[signature-verification-failure] TODO(T108222691): Use flow-types for @babel/parser
function buildComponentSchema(
  ast: $FlowFixMe,
  parser: Parser,
): ComponentSchemaBuilderConfig {
  const {componentName, propsTypeName, optionsExpression} = findComponentConfig(
    ast,
    parser,
  );

  const types = parser.getTypes(ast);

  const propProperties = getProperties(propsTypeName, types);

  const commandProperties = getCommandProperties(ast, parser);

  const options = getOptions(optionsExpression);

  const componentEventAsts: Array<PropsAST> = [];
  categorizeProps(propProperties, types, componentEventAsts);
  const {props, extendsProps} = getProps(propProperties, types);
  const events = getEvents(componentEventAsts, types);
  const commands = getCommands(commandProperties, types);

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
  buildComponentSchema,
};
