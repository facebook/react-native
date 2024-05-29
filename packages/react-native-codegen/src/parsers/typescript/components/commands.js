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
  CommandTypeAnnotation,
  NamedShape,
} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../../utils';

const {parseTopLevelType} = require('../parseTopLevelType');
const {getPrimitiveTypeAnnotation} = require('./componentsUtils');

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type EventTypeAST = Object;

function buildCommandSchemaInternal(
  name: string,
  optional: boolean,
  parameters: Array<$FlowFixMe>,
  types: TypeDeclarationMap,
): NamedShape<CommandTypeAnnotation> {
  const firstParam = parameters[0].typeAnnotation;
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

  const params = parameters.slice(1).map(param => {
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
      case 'Int32':
      case 'Double':
      case 'Float':
      case 'TSStringKeyword':
        returnType = getPrimitiveTypeAnnotation(type);
        break;
      case 'Array':
      case 'ReadOnlyArray':
        if (!paramValue.type === 'TSTypeReference') {
          throw new Error(
            'Array and ReadOnlyArray are TSTypeReference for array',
          );
        }
        returnType = {
          type: 'ArrayTypeAnnotation',
          elementType: getPrimitiveTypeAnnotation(
            // TODO: T172453752 support complex type annotation for array element
            paramValue.typeParameters.params[0].type,
          ),
        };
        break;
      case 'TSArrayType':
        returnType = {
          type: 'ArrayTypeAnnotation',
          elementType: {
            // TODO: T172453752 support complex type annotation for array element
            type: getPrimitiveTypeAnnotation(paramValue.elementType.type).type,
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

function buildCommandSchema(
  property: EventTypeAST,
  types: TypeDeclarationMap,
): NamedShape<CommandTypeAnnotation> {
  if (property.type === 'TSPropertySignature') {
    const topLevelType = parseTopLevelType(
      property.typeAnnotation.typeAnnotation,
      types,
    );
    const name = property.key.name;
    const optional = property.optional || topLevelType.optional;
    const parameters = topLevelType.type.parameters || topLevelType.type.params;
    return buildCommandSchemaInternal(name, optional, parameters, types);
  } else {
    const name = property.key.name;
    const optional = property.optional || false;
    const parameters = property.parameters || property.params;
    return buildCommandSchemaInternal(name, optional, parameters, types);
  }
}

function getCommands(
  commandTypeAST: $ReadOnlyArray<EventTypeAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<NamedShape<CommandTypeAnnotation>> {
  return commandTypeAST
    .filter(
      property =>
        property.type === 'TSPropertySignature' ||
        property.type === 'TSMethodSignature',
    )
    .map(property => buildCommandSchema(property, types))
    .filter(Boolean);
}

module.exports = {
  getCommands,
};
