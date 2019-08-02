/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  ObjectPropertyType,
} from '../../../CodegenSchema.js';

function getPropertyType(name, optional, typeAnnotation) {
  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
        name,
        optional,
      };
    case 'StringTypeAnnotation':
      return {
        type: 'StringTypeAnnotation',
        name,
        optional,
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
        name,
        optional,
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
        name,
        optional,
      };
    case 'ObjectTypeAnnotation':
      return {
        type: 'ObjectTypeAnnotation',
        name,
        optional,
        properties: typeAnnotation.properties.map(buildPropertiesForEvent),
      };
    case 'UnionTypeAnnotation':
      return {
        type: 'StringEnumTypeAnnotation',
        name,
        optional,
        options: typeAnnotation.types.map(option => ({name: option.value})),
      };
    default:
      (type: empty);
      throw new Error(`Unable to determine event type for "${name}"`);
  }
}

function findEventArgumentsAndType(
  typeAnnotation,
  types,
  bubblingType,
  paperName,
) {
  const name = typeAnnotation.id.name;
  if (name === '$ReadOnly') {
    return {
      argumentProps: typeAnnotation.typeParameters.params[0].properties,
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  } else if (name === 'BubblingEventHandler' || name === 'DirectEventHandler') {
    const eventType = name === 'BubblingEventHandler' ? 'bubble' : 'direct';
    const paperTopLevelNameDeprecated =
      typeAnnotation.typeParameters.params.length > 1
        ? typeAnnotation.typeParameters.params[1].value
        : null;
    if (
      typeAnnotation.typeParameters.params[0].type ===
      'NullLiteralTypeAnnotation'
    ) {
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
      types[name].right,
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

function buildPropertiesForEvent(property): ObjectPropertyType {
  const name = property.key.name;
  const optional =
    property.value.type === 'NullableTypeAnnotation' || property.optional;
  let typeAnnotation =
    property.value.type === 'NullableTypeAnnotation'
      ? property.value.typeAnnotation
      : property.value;

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
  const optional =
    property.optional || property.value.type === 'NullableTypeAnnotation';

  let typeAnnotation =
    property.value.type === 'NullableTypeAnnotation'
      ? property.value.typeAnnotation
      : property.value;

  if (
    typeAnnotation.type !== 'GenericTypeAnnotation' ||
    (typeAnnotation.id.name !== 'BubblingEventHandler' &&
      typeAnnotation.id.name !== 'DirectEventHandler')
  ) {
    return null;
  }

  const {
    argumentProps,
    bubblingType,
    paperTopLevelNameDeprecated,
  } = findEventArgumentsAndType(typeAnnotation, types);

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
    throw new Error(`Unabled to determine event arguments for "${name}"`);
  }

  if (bubblingType === null) {
    throw new Error(`Unabled to determine event arguments for "${name}"`);
  }
}

// $FlowFixMe there's no flowtype for ASTs
type EventTypeAST = Object;

type TypeMap = {
  // $FlowFixMe there's no flowtype for ASTs
  [string]: Object,
};

function getEvents(
  eventTypeAST: $ReadOnlyArray<EventTypeAST>,
  types: TypeMap,
): $ReadOnlyArray<EventTypeShape> {
  return eventTypeAST
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildEventSchema(types, property))
    .filter(Boolean);
}

module.exports = {
  getEvents,
};
