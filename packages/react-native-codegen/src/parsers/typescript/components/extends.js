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

import type {TypeDeclarationMap} from '../../utils';
const {parseTopLevelType} = require('../parseTopLevelType');

function isEvent(typeAnnotation: $FlowFixMe): boolean {
  if (typeAnnotation.type !== 'TSTypeReference') {
    return false;
  }
  const eventNames = new Set(['BubblingEventHandler', 'DirectEventHandler']);
  return eventNames.has(typeAnnotation.typeName.name);
}

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type PropsAST = Object;

function categorizeProps(
  typeDefinition: $ReadOnlyArray<PropsAST>,
  types: TypeDeclarationMap,
  events: Array<PropsAST>,
): void {
  // find events
  for (const prop of typeDefinition) {
    if (prop.type === 'TSPropertySignature') {
      const topLevelType = parseTopLevelType(
        prop.typeAnnotation.typeAnnotation,
        types,
      );

      if (isEvent(topLevelType.type)) {
        events.push(prop);
      }
    }
  }
}

module.exports = {
  categorizeProps,
};
