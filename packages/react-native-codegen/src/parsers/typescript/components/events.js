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

import type {
  EventTypeShape,
  NamedShape,
  EventTypeAnnotation,
} from '../../../CodegenSchema.js';

function getPropertyType(
  name,
  optional,
  typeAnnotation,
): NamedShape<EventTypeAnnotation> {
  const type =
    typeAnnotation.type === 'TSTypeReference'
      ? typeAnnotation.typeName.name
      : typeAnnotation.type;

  switch (type) {
    case 'TSBooleanKeyword':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      };
    case 'TSStringKeyword':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };
    case 'Int32':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'Int32TypeAnnotation',
        },
      };
    case 'Double':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'DoubleTypeAnnotation',
        },
      };
    case 'Float':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'FloatTypeAnnotation',
        },
      };
    case 'Readonly':
      return getPropertyType(
        name,
        optional,
        typeAnnotation.typeParameters.params[0],
      );

    case 'TSTypeLiteral':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'ObjectTypeAnnotation',
          properties: typeAnnotation.members.map(buildPropertiesForEvent),
        },
      };

    case 'TSUnionType':
      // Check for <T | null | void>
      if (
        typeAnnotation.types.some(
          t => t.type === 'TSNullKeyword' || t.type === 'TSVoidKeyword',
        )
      ) {
        const optionalType = typeAnnotation.types.filter(
          t => t.type !== 'TSNullKeyword' && t.type !== 'TSVoidKeyword',
        )[0];

        // Check for <(T | T2) | null | void>
        if (optionalType.type === 'TSParenthesizedType') {
          return getPropertyType(name, true, optionalType.typeAnnotation);
        }

        return getPropertyType(name, true, optionalType);
      }

      return {
        name,
        optional,
        typeAnnotation: {
          type: 'StringEnumTypeAnnotation',
          options: typeAnnotation.types.map(option => option.literal.value),
        },
      };
    default:
      (type: empty);
      throw new Error(`Unable to determine event type for "${name}": ${type}`);
  }
}

function findEventArgumentsAndType(
  typeAnnotation,
  types,
  bubblingType,
  paperName,
) {
  if (!typeAnnotation.typeName) {
    throw new Error("typeAnnotation of event doesn't have a name");
  }
  const name = typeAnnotation.typeName.name;
  if (name === 'Readonly') {
    return {
      argumentProps: typeAnnotation.typeParameters.params[0].members,
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  } else if (name === 'BubblingEventHandler' || name === 'DirectEventHandler') {
    const eventType = name === 'BubblingEventHandler' ? 'bubble' : 'direct';
    const paperTopLevelNameDeprecated =
      typeAnnotation.typeParameters.params.length > 1
        ? typeAnnotation.typeParameters.params[1].literal.value
        : null;

    if (typeAnnotation.typeParameters.params[0].type === 'TSNullKeyword') {
      return {
        argumentProps: [],
        bubblingType: eventType,
        paperTopLevelNameDeprecated,
      };
    }
    return findEventArgumentsAndType(
      typeAnnotation.typeParameters.params[0],
      types,
      eventType,
      paperTopLevelNameDeprecated,
    );
  } else if (types[name]) {
    return findEventArgumentsAndType(
      types[name].typeAnnotation,
      types,
      bubblingType,
      paperName,
    );
  } else {
    return {
      argumentProps: null,
      bubblingType: null,
      paperTopLevelNameDeprecated: null,
    };
  }
}

function buildPropertiesForEvent(property): NamedShape<EventTypeAnnotation> {
  const name = property.key.name;
  const optional = property.optional || false;
  let typeAnnotation = property.typeAnnotation.typeAnnotation;

  return getPropertyType(name, optional, typeAnnotation);
}

function getEventArgument(argumentProps, name) {
  return {
    type: 'ObjectTypeAnnotation',
    properties: argumentProps.map(buildPropertiesForEvent),
  };
}

function buildEventSchema(
  types: TypeMap,
  property: EventTypeAST,
): ?EventTypeShape {
  const name = property.key.name;

  let optional = property.optional || false;
  let typeAnnotation = property.typeAnnotation.typeAnnotation;

  // Check for T | null | void
  if (
    typeAnnotation.type === 'TSUnionType' &&
    typeAnnotation.types.some(
      t => t.type === 'TSNullKeyword' || t.type === 'TSVoidKeyword',
    )
  ) {
    typeAnnotation = typeAnnotation.types.filter(
      t => t.type !== 'TSNullKeyword' && t.type !== 'TSVoidKeyword',
    )[0];
    optional = true;
  }

  if (
    typeAnnotation.type !== 'TSTypeReference' ||
    (typeAnnotation.typeName.name !== 'BubblingEventHandler' &&
      typeAnnotation.typeName.name !== 'DirectEventHandler')
  ) {
    return null;
  }

  const {argumentProps, bubblingType, paperTopLevelNameDeprecated} =
    findEventArgumentsAndType(typeAnnotation, types);

  if (bubblingType && argumentProps) {
    if (paperTopLevelNameDeprecated != null) {
      return {
        name,
        optional,
        bubblingType,
        paperTopLevelNameDeprecated,
        typeAnnotation: {
          type: 'EventTypeAnnotation',
          argument: getEventArgument(argumentProps, name),
        },
      };
    }

    return {
      name,
      optional,
      bubblingType,
      typeAnnotation: {
        type: 'EventTypeAnnotation',
        argument: getEventArgument(argumentProps, name),
      },
    };
  }

  if (argumentProps === null) {
    throw new Error(`Unable to determine event arguments for "${name}"`);
  }

  if (bubblingType === null) {
    throw new Error(`Unable to determine event arguments for "${name}"`);
  }
}

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type EventTypeAST = Object;

type TypeMap = {
  // $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
  [string]: Object,
  ...
};

function getEvents(
  eventTypeAST: $ReadOnlyArray<EventTypeAST>,
  types: TypeMap,
): $ReadOnlyArray<EventTypeShape> {
  return eventTypeAST
    .filter(property => property.type === 'TSPropertySignature')
    .map(property => buildEventSchema(types, property))
    .filter(Boolean);
}

module.exports = {
  getEvents,
};
