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

import type {NativeModuleShape} from '../../../CodegenSchema';
const {getAliases} = require('./aliases');
const {getMethods} = require('./methods');

import type {TypeDeclarations} from '../index';

// TODO(T71778680): Flow type AST Nodes
function getModuleProperties(
  types: TypeDeclarations,
): $ReadOnlyArray<$FlowFixMe> {
  const declaredModuleNames: Array<string> = Object.keys(types).filter(
    (typeName: string) => {
      const declaration = types[typeName];
      return (
        declaration.type === 'InterfaceDeclaration' &&
        declaration.extends.length === 1 &&
        declaration.extends[0].type === 'InterfaceExtends' &&
        declaration.extends[0].id.name === 'TurboModule'
      );
    },
  );

  return types[declaredModuleNames[0]].body.properties;
}

// TODO(T71778680): Flow type AST Nodes
function getModuleAliases(
  types: TypeDeclarations,
  aliasNames,
): $ReadOnlyArray<{[aliasName: string]: $FlowFixMe}> {
  return Object.keys(types)
    .filter((typeName: string) => {
      const declaration = types[typeName];
      return (
        declaration.type === 'TypeAlias' &&
        declaration.right.type === 'ObjectTypeAnnotation'
      );
    })
    .map(aliasName => ({[aliasName]: types[aliasName].right}));
}

function processModule(types: TypeDeclarations): NativeModuleShape {
  const moduleProperties = getModuleProperties(types);
  const properties = getMethods(moduleProperties, types);

  const moduleAliases = getModuleAliases(types);
  const aliases = getAliases(moduleAliases, types);

  return {aliases, properties};
}

module.exports = {
  processModule,
};
