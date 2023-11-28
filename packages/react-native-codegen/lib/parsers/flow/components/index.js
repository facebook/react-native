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
const _require3 = require('../../parsers-commons'),
  getOptions = _require3.getOptions,
  findComponentConfig = _require3.findComponentConfig,
  getCommandProperties = _require3.getCommandProperties;

// $FlowFixMe[signature-verification-failure] there's no flowtype for AST
function buildComponentSchema(ast, parser) {
  const _findComponentConfig = findComponentConfig(ast, parser),
    componentName = _findComponentConfig.componentName,
    propsTypeName = _findComponentConfig.propsTypeName,
    optionsExpression = _findComponentConfig.optionsExpression;
  const types = parser.getTypes(ast);
  const propProperties = parser.getProperties(propsTypeName, types);
  const commandProperties = getCommandProperties(ast, parser);
  const _parser$getProps = parser.getProps(propProperties, types),
    extendsProps = _parser$getProps.extendsProps,
    props = _parser$getProps.props;
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
