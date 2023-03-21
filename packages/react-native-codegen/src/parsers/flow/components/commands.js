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

const {getValueFromTypes} = require('../utils.js');

type EventTypeAST = Object;

function buildCommandSchema(property: EventTypeAST, types: TypeDeclarationMap) {
  const name = property.key.name;
  const optional = property.optional;
  const value = getValueFromTypes(property.value, types);

  const firstParam = value.params[0].typeAnnotation;

  if (
    !(
      firstParam.id != null &&
      firstParam.id.type === 'QualifiedTypeIdentifier' &&
      firstParam.id.qualification.name === 'React' &&
      firstParam.id.id.name === 'ElementRef'
    )
  ) {
    throw new Error(
      `The first argument of method ${name} must be of type React.ElementRef<>`,
    );
  }

  const params = value.params.slice(1).map(param => {
    const paramName = param.name.name;
    const paramValue = getValueFromTypes(param.typeAnnotation, types);
    const type =
      paramValue.type === 'GenericTypeAnnotation'
        ? paramValue.id.name
        : paramValue.type;
    let returnType;

    switch (type) {
      case 'RootTag':
        returnType = {
          type: 'ReservedTypeAnnotation',
          name: 'RootTag',
        };
        break;
      case 'BooleanTypeAnnotation':
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
      case 'StringTypeAnnotation':
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
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildCommandSchema(property, types))
    .filter(Boolean);
}

module.exports = {
  getCommands,
};
