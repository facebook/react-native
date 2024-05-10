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

import type {
  CommandParamTypeAnnotation,
  CommandTypeAnnotation,
  NamedShape,
} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../../utils';

const {getValueFromTypes} = require('../utils.js');

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type EventTypeAST = Object;

function buildCommandSchema(
  property: EventTypeAST,
  types: TypeDeclarationMap,
): $ReadOnly<{
  name: string,
  optional: boolean,
  typeAnnotation: {
    type: 'FunctionTypeAnnotation',
    params: $ReadOnlyArray<{
      name: string,
      optional: boolean,
      typeAnnotation: CommandParamTypeAnnotation,
    }>,
    returnTypeAnnotation: {
      type: 'VoidTypeAnnotation',
    },
  },
}> {
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
    let returnType: CommandParamTypeAnnotation;

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
      case 'Array':
      case '$ReadOnlyArray':
        if (!paramValue.type === 'GenericTypeAnnotation') {
          throw new Error(
            'Array and $ReadOnlyArray are GenericTypeAnnotation for array',
          );
        }
        returnType = {
          type: 'ArrayTypeAnnotation',
          elementType: {
            // TODO: T172453752 support complex type annotation for array element
            type: paramValue.typeParameters.params[0].type,
          },
        };
        break;
      case 'ArrayTypeAnnotation':
        returnType = {
          type: 'ArrayTypeAnnotation',
          elementType: {
            // TODO: T172453752 support complex type annotation for array element
            type: paramValue.elementType.type,
          },
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
      optional: false,
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
