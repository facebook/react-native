/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {CommandTypeShape} from '../../../CodegenSchema.js';

type EventTypeAST = Object;

function buildCommandSchema(property) {
  const name = property.key.name;
  const optional = property.optional;
  const value = property.value;

  const firstParam = value.params[0].typeAnnotation;

  if (
    !(
      firstParam.id.type === 'QualifiedTypeIdentifier' &&
      firstParam.id.qualification.name === 'React' &&
      firstParam.id.id.name === 'Ref'
    )
  ) {
    throw new Error(
      `The first argument of method ${name} must be of type React.Ref<>`,
    );
  }

  const params = value.params.slice(1).map(param => {
    const paramName = param.name.name;
    const type =
      param.typeAnnotation.type === 'GenericTypeAnnotation'
        ? param.typeAnnotation.id.name
        : param.typeAnnotation.type;
    let returnType;

    switch (type) {
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
    },
  };
}

function getCommands(
  commandTypeAST: $ReadOnlyArray<EventTypeAST>,
): $ReadOnlyArray<CommandTypeShape> {
  return commandTypeAST
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(buildCommandSchema)
    .filter(Boolean);
}

module.exports = {
  getCommands,
};
