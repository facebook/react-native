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
const {
  getOptions,
  findComponentConfig,
  getCommandProperties,
} = require('../../parsers-commons');

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

  const propProperties = parser.getProperties(propsTypeName, types);
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
