/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';
import type {TypeDeclarationMap} from '../utils';
import type {CommandOptions} from './options';
import type {ComponentSchemaBuilderConfig} from './schema.js';

const {getTypes} = require('../utils');
const {getCommands} = require('./commands');
const {getEvents} = require('./events');
const {getExtendsProps, removeKnownExtends} = require('./extends');
const {getCommandOptions, getOptions} = require('./options');
const {getPropProperties, getProps} = require('./props');

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function findComponentConfig(ast) {
  const foundConfigs = [];

  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );

  defaultExports.forEach(statement => {
    let declaration = statement.declaration;

    // codegenNativeComponent can be nested inside a cast
    // expression so we need to go one level deeper
    if (declaration.type === 'TypeCastExpression') {
      declaration = declaration.expression;
    }

    try {
      if (declaration.callee.name === 'codegenNativeComponent') {
        const typeArgumentParams = declaration.typeArguments.params;
        const funcArgumentParams = declaration.arguments;

        const nativeComponentType: {[string]: string} = {
          propsTypeName: typeArgumentParams[0].id.name,
          componentName: funcArgumentParams[0].value,
        };
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
      let callExpression;
      let calleeName;
      try {
        callExpression = statement.declaration.declarations[0].init;
        calleeName = callExpression.callee.name;
      } catch (e) {
        return;
      }

      if (calleeName !== 'codegenNativeCommands') {
        return;
      }

      // const statement.declaration.declarations[0].init
      if (callExpression.arguments.length !== 1) {
        throw new Error(
          'codegenNativeCommands must be passed options including the supported commands',
        );
      }

      const typeArgumentParam = callExpression.typeArguments.params[0];

      if (typeArgumentParam.type !== 'GenericTypeAnnotation') {
        throw new Error(
          "codegenNativeCommands doesn't support inline definitions. Specify a file local type alias",
        );
      }

      return {
        commandTypeName: typeArgumentParam.id.name,
        commandOptionsExpression: callExpression.arguments[0],
      };
    })
    .filter(Boolean);

  if (commandsTypeNames.length > 1) {
    throw new Error('codegenNativeCommands may only be called once in a file');
  }

  return {
    ...foundConfig,
    commandTypeName:
      commandsTypeNames[0] == null
        ? null
        : commandsTypeNames[0].commandTypeName,
    commandOptionsExpression:
      commandsTypeNames[0] == null
        ? null
        : commandsTypeNames[0].commandOptionsExpression,
  };
}

function getCommandProperties(
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  commandTypeName,
  types: TypeDeclarationMap,
  commandOptions: ?CommandOptions,
) {
  if (commandTypeName == null) {
    return [];
  }

  const typeAlias = types[commandTypeName];

  if (typeAlias.type !== 'InterfaceDeclaration') {
    throw new Error(
      `The type argument for codegenNativeCommands must be an interface, received ${typeAlias.type}`,
    );
  }

  let properties;
  try {
    properties = typeAlias.body.properties;
  } catch (e) {
    throw new Error(
      `Failed to find type definition for "${commandTypeName}", please check that you have a valid codegen flow file`,
    );
  }

  const flowPropertyNames = properties
    .map(property => property && property.key && property.key.name)
    .filter(Boolean);

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
/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function buildComponentSchema(ast): ComponentSchemaBuilderConfig {
  const {
    componentName,
    propsTypeName,
    commandTypeName,
    commandOptionsExpression,
    optionsExpression,
  } = findComponentConfig(ast);

  const types = getTypes(ast);

  const propProperties = getPropProperties(propsTypeName, types);
  const commandOptions = getCommandOptions(commandOptionsExpression);

  const commandProperties = getCommandProperties(
    commandTypeName,
    types,
    commandOptions,
  );

  const extendsProps = getExtendsProps(propProperties, types);
  const options = getOptions(optionsExpression);

  const nonExtendsProps = removeKnownExtends(propProperties, types);
  const props = getProps(nonExtendsProps, types);
  const events = getEvents(propProperties, types);
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
