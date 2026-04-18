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
  EventTypeAnnotation,
  EventTypeShape,
  NamedShape,
} from '../../../CodegenSchema.js';
import type {Parser} from '../../parser';
import type {TypeDeclarationMap} from '../../utils';

const {
  extractArrayElementType,
  getPropertyType: getPropertyTypeCommon,
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
const {parseTopLevelType} = require('../parseTopLevelType');
const {flattenProperties} = require('./componentsUtils');

/**
 * TypeScript wrapper around the shared getPropertyType that applies
 * parseTopLevelType to unwrap Readonly, WithDefault, and nullable unions
 * before delegating to the shared type resolution logic.
 */
function getPropertyType(
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  name: string,
  optionalProperty: boolean,
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  annotation: $FlowFixMe,
  parser: Parser,
): NamedShape<EventTypeAnnotation> {
  const topLevelType = parseTopLevelType(annotation, parser);
  const typeAnnotation = topLevelType.type;
  const optional = optionalProperty || topLevelType.optional;
  return getPropertyTypeCommon(name, optional, typeAnnotation, parser);
}

function findEventArgumentsAndType(
  parser: Parser,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  bubblingType: void | 'direct' | 'bubble',
  paperName: ?$FlowFixMe,
): {
  argumentProps: ?ReadonlyArray<$FlowFixMe>,
  paperTopLevelNameDeprecated: ?$FlowFixMe,
  bubblingType: ?'direct' | 'bubble',
} {
  if (typeAnnotation.type === 'TSInterfaceDeclaration') {
    return {
      argumentProps: flattenProperties([typeAnnotation], types, parser),
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  }

  if (typeAnnotation.type === 'TSTypeLiteral') {
    return {
      argumentProps: parser.getObjectProperties(typeAnnotation),
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  }

  throwIfEventHasNoName(typeAnnotation, parser);
  const name = parser.getTypeAnnotationName(typeAnnotation);
  if (name === 'Readonly') {
    return findEventArgumentsAndType(
      parser,
      typeAnnotation.typeParameters.params[0],
      types,
      bubblingType,
      paperName,
    );
  } else if (name === 'BubblingEventHandler' || name === 'DirectEventHandler') {
    return handleEventHandler(
      name,
      typeAnnotation,
      parser,
      types,
      findEventArgumentsAndType,
    );
  } else if (types[name]) {
    let elementType = types[name];
    if (elementType.type === 'TSTypeAliasDeclaration') {
      elementType = elementType.typeAnnotation;
    }
    return findEventArgumentsAndType(
      parser,
      elementType,
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

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type EventTypeAST = Object;

function buildEventSchema(
  types: TypeDeclarationMap,
  property: EventTypeAST,
  parser: Parser,
): ?EventTypeShape {
  // unpack WithDefault, (T) or T|U
  const topLevelType = parseTopLevelType(
    property.typeAnnotation.typeAnnotation,
    parser,
    types,
  );

  const name = property.key.name;
  const typeAnnotation = topLevelType.type;
  const optional = property.optional || topLevelType.optional;
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

function getEvents(
  eventTypeAST: ReadonlyArray<EventTypeAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): ReadonlyArray<EventTypeShape> {
  return eventTypeAST
    .map(property => buildEventSchema(types, property, parser))
    .filter(Boolean);
}

module.exports = {
  getEvents,
  extractArrayElementType,
};
