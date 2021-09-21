/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {ObjectTypeAliasTypeShape} from '../../CodegenSchema';

function getTypeAliasTypeAnnotation(
  name: string,
  aliases: $ReadOnly<{[aliasName: string]: ObjectTypeAliasTypeShape, ...}>,
): $ReadOnly<ObjectTypeAliasTypeShape> {
  const typeAnnotation = aliases[name];
  if (!typeAnnotation) {
    throw Error(`No type annotation found for "${name}" in schema`);
  }
  if (typeAnnotation.type === 'ObjectTypeAnnotation') {
    if (typeAnnotation.properties) {
      return typeAnnotation;
    }

    throw new Error(
      `Unsupported type for "${name}". Please provide properties.`,
    );
  }
  // $FlowFixMe[incompatible-type]
  if (typeAnnotation.type === 'TypeAliasTypeAnnotation') {
    return getTypeAliasTypeAnnotation(typeAnnotation.name, aliases);
  }

  throw Error(
    `Unsupported type annotation in alias "${name}", found: ${typeAnnotation.type}`,
  );
}

module.exports = {
  getTypeAliasTypeAnnotation,
};
