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
const {getProperties} = require('./componentsUtils.js');
const {throwIfTypeAliasIsNotInterface} = require('../../error-utils');
const {
  propertyNames,
  getCommandOptions,
  getOptions,
  findComponentConfig,
} = require('../../parsers-commons');

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

  throwIfTypeAliasIsNotInterface(typeAlias, parser);

  const properties = parser.bodyProperties(typeAlias);
  if (!properties) {
    throw new Error(
      `Failed to find type definition for "${commandTypeName}", please check that you have a valid codegen flow file`,
    );
  }

  const flowPropertyNames = propertyNames(properties);

  const commandOptions = getCommandOptions(commandOptionsExpression);

  if (commandOptions == null || commandOptions.supportedCommands == null) {
    throw new Error(
      'codegenNativeCommands must be given an options object with supportedCommands array',
    );
  }

  if (
    commandOptions.supportedCommands.length !== flowPropertyNames.length ||
    !commandOptions.supportedCommands.every(supportedCommand =>
      flowPropertyNames.includes(supportedCommand),
    )
  ) {
    throw new Error(
      `codegenNativeCommands expected the same supportedCommands specified in the ${commandTypeName} interface: ${flowPropertyNames.join(
        ', ',
      )}`,
    );
  }

  return properties;
}

// $FlowFixMe[signature-verification-failure] there's no flowtype for AST
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
  const {extendsProps, props} = parser.getProps(propProperties, types);

  const options = getOptions(optionsExpression);
  const events = getEvents(propProperties, types, parser);
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
