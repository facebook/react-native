/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {
  NamedShape,
  CommandTypeAnnotation,
} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../../utils';
const {parseTopLevelType} = require('../parseTopLevelType');

type EventTypeAST = Object;

function buildCommandSchema(property: EventTypeAST, types: TypeDeclarationMap) {
  const topLevelType = parseTopLevelType(
    property.typeAnnotation.typeAnnotation,
    types,
  );
  const name = property.key.name;
  const optional = property.optional || topLevelType.optional;
  const value = topLevelType.type;
  const firstParam = value.parameters[0].typeAnnotation;

  if (
    !(
      firstParam.typeAnnotation != null &&
      firstParam.typeAnnotation.type === 'TSTypeReference' &&
      firstParam.typeAnnotation.typeName.left?.name === 'React' &&
      firstParam.typeAnnotation.typeName.right?.name === 'ElementRef'
    )
  ) {
    throw new Error(
      `The first argument of method ${name} must be of type React.ElementRef<>`,
    );
  }

  const params = value.parameters.slice(1).map(param => {
    const paramName = param.name;
    const paramValue = parseTopLevelType(
      param.typeAnnotation.typeAnnotation,
      types,
    ).type;

    const type =
      paramValue.type === 'TSTypeReference'
        ? paramValue.typeName.name
        : paramValue.type;
    let returnType;

    switch (type) {
      case 'RootTag':
        returnType = {
          type: 'ReservedTypeAnnotation',
          name: 'RootTag',
        };
        break;
      case 'TSBooleanKeyword':
        returnType = {
          type: 'BooleanTypeAnnotation',
        };
        break;
      case 'Int32':
        returnType = {
          type: 'Int32TypeAnnotation',
        };
        break;
      case 'Double':
        returnType = {
          type: 'DoubleTypeAnnotation',
        };
        break;
      case 'Float':
        returnType = {
          type: 'FloatTypeAnnotation',
        };
        break;
      case 'TSStringKeyword':
        returnType = {
          type: 'StringTypeAnnotation',
        };
        break;
      default:
        (type: empty);
        throw new Error(
          `Unsupported param type for method "${name}", param "${paramName}". Found ${type}`,
        );
    }

    return {
      name: paramName,
      typeAnnotation: returnType,
    };
  });

  return {
    name,
    optional,
    typeAnnotation: {
      type: 'FunctionTypeAnnotation',
      params,
      returnTypeAnnotation: {
        type: 'VoidTypeAnnotation',
      },
    },
  };
}

function getCommands(
  commandTypeAST: $ReadOnlyArray<EventTypeAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<NamedShape<CommandTypeAnnotation>> {
  return commandTypeAST
    .filter(property => property.type === 'TSPropertySignature')
    .map(property => buildCommandSchema(property, types))
    .filter(Boolean);
}

module.exports = {
  getCommands,
};
