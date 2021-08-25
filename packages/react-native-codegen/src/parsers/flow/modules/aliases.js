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

import type {ObjectTypeAliasTypeShape} from '../../../CodegenSchema.js';

import type {TypeMap} from '../utils.js';

const {getObjectProperties} = require('./properties');

// $FlowFixMe there's no flowtype for ASTs
type MethodAST = Object;

function getAliases(
  typeDefinition: $ReadOnlyArray<MethodAST>,
  types: TypeMap,
): $ReadOnly<{[aliasName: string]: ObjectTypeAliasTypeShape, ...}> {
  const aliases = {};
  typeDefinition.map(moduleAlias => {
    const aliasName = Object.keys(moduleAlias)[0];
    const typeAnnotation = moduleAlias[Object.keys(moduleAlias)[0]];

    switch (typeAnnotation.type) {
      case 'ObjectTypeAnnotation':
        aliases[aliasName] = {
          type: 'ObjectTypeAnnotation',
          ...(typeAnnotation.properties && {
            properties: getObjectProperties(
              aliasName,
              {properties: typeAnnotation.properties},
              aliasName,
              types,
            ),
          }),
        };
        return;
      case 'GenericTypeAnnotation':
        if (typeAnnotation.id.name && typeAnnotation.id.name !== '') {
          aliases[aliasName] = {
            type: 'TypeAliasTypeAnnotation',
            name: typeAnnotation.id.name,
          };
          return;
        } else {
          throw new Error(
            `Cannot use "${typeAnnotation.type}" type annotation for "${aliasName}": must specify a type alias name`,
          );
        }
      default:
        // TODO (T65847278): Figure out why this does not work.
        // (typeAnnotation.type: empty);
        throw new Error(
          `Unknown prop type, found "${typeAnnotation.type}" in "${aliasName}"`,
        );
    }
  });
  return aliases;
}

module.exports = {
  getAliases,
};
