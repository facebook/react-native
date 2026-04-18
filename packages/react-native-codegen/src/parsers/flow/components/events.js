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

import type {EventTypeShape} from '../../../CodegenSchema.js';
import type {Parser} from '../../parser';
import type {EventArgumentReturnType} from '../../parsers-commons';

const {
  extractArrayElementType,
  getPropertyType,
} = require('../../components/events-commons');
const {
  throwIfArgumentPropsAreNull,
  throwIfBubblingTypeIsNull,
  throwIfEventHasNoName,
} = require('../../error-utils');
const {
  emitBuildEventSchema,
  getEventArgument,
  handleEventHandler,
} = require('../../parsers-commons');

function findEventArgumentsAndType(
  parser: Parser,
  typeAnnotation: $FlowFixMe,
  types: TypeMap,
  bubblingType: void | 'direct' | 'bubble',
  paperName: ?$FlowFixMe,
): EventArgumentReturnType {
  throwIfEventHasNoName(typeAnnotation, parser);
  const name = parser.getTypeAnnotationName(typeAnnotation);
  if (name === '$ReadOnly' || name === 'Readonly') {
    return {
      argumentProps: typeAnnotation.typeParameters.params[0].properties,
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  } else if (name === 'BubblingEventHandler' || name === 'DirectEventHandler') {
    return handleEventHandler(
      name,
      typeAnnotation,
      parser,
      types,
      findEventArgumentsAndType,
    );
  } else if (types[name]) {
    return findEventArgumentsAndType(
      parser,
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

function buildEventSchema(
  types: TypeMap,
  property: EventTypeAST,
  parser: Parser,
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
    (parser.getTypeAnnotationName(typeAnnotation) !== 'BubblingEventHandler' &&
      parser.getTypeAnnotationName(typeAnnotation) !== 'DirectEventHandler')
  ) {
    return null;
  }

  const {argumentProps, bubblingType, paperTopLevelNameDeprecated} =
    findEventArgumentsAndType(parser, typeAnnotation, types);

  const nonNullableArgumentProps = throwIfArgumentPropsAreNull(
    argumentProps,
    name,
  );
  const nonNullableBubblingType = throwIfBubblingTypeIsNull(bubblingType, name);

  const argument = getEventArgument(
    nonNullableArgumentProps,
    parser,
    getPropertyType,
  );

  return emitBuildEventSchema(
    paperTopLevelNameDeprecated,
    name,
    optional,
    nonNullableBubblingType,
    argument,
  );
}

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type EventTypeAST = Object;

type TypeMap = {
  // $FlowFixMe[unclear-type] there's no flowtype for ASTs
  [string]: Object,
  ...
};

function getEvents(
  eventTypeAST: ReadonlyArray<EventTypeAST>,
  types: TypeMap,
  parser: Parser,
): ReadonlyArray<EventTypeShape> {
  return eventTypeAST
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildEventSchema(types, property, parser))
    .filter(Boolean);
}

module.exports = {
  getEvents,
  extractArrayElementType,
};
