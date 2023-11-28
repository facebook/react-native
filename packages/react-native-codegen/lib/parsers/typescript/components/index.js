/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const _require = require('./commands'),
  getCommands = _require.getCommands;
const _require2 = require('./events'),
  getEvents = _require2.getEvents;
const _require3 = require('./extends'),
  categorizeProps = _require3.categorizeProps;
const _require4 = require('../../parsers-commons'),
  getOptions = _require4.getOptions,
  findComponentConfig = _require4.findComponentConfig,
  getCommandProperties = _require4.getCommandProperties;

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser

// $FlowFixMe[signature-verification-failure] TODO(T108222691): Use flow-types for @babel/parser
function buildComponentSchema(ast, parser) {
  const _findComponentConfig = findComponentConfig(ast, parser),
    componentName = _findComponentConfig.componentName,
    propsTypeName = _findComponentConfig.propsTypeName,
    optionsExpression = _findComponentConfig.optionsExpression;
  const types = parser.getTypes(ast);
  const propProperties = parser.getProperties(propsTypeName, types);
  const commandProperties = getCommandProperties(ast, parser);
  const options = getOptions(optionsExpression);
  const componentEventAsts = [];
  categorizeProps(propProperties, types, componentEventAsts);
  const _parser$getProps = parser.getProps(propProperties, types),
    props = _parser$getProps.props,
    extendsProps = _parser$getProps.extendsProps;
  const events = getEvents(componentEventAsts, types, parser);
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
