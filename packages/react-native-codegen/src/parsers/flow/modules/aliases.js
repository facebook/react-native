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

import type {NativeModuleAliasMap} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../utils';

const {getObjectProperties} = require('./properties');

function getAliases(types: TypeDeclarationMap): NativeModuleAliasMap {
  const typeNames: Array<string> = Object.keys(types);
  return typeNames
    .filter((typeName: string) => {
      const declaration = types[typeName];
      return (
        declaration.type === 'TypeAlias' &&
        declaration.right.type === 'ObjectTypeAnnotation'
      );
    })
    .reduce((aliases: NativeModuleAliasMap, aliasName: string) => {
      const alias = types[aliasName];
      return {
        ...aliases,
        [aliasName]: {
          type: 'ObjectTypeAnnotation',
          properties: getObjectProperties(
            aliasName,
            {properties: alias.right.properties},
            aliasName,
            types,
          ),
        },
      };
    }, ({}: NativeModuleAliasMap));
}

module.exports = {
  getAliases,
};
