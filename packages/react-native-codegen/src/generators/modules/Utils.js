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

import type {
  SchemaType,
  NativeModuleAliasMap,
  Required,
  NativeModuleObjectTypeAnnotation,
  NativeModuleSchema,
} from '../../CodegenSchema';

const invariant = require('invariant');

export type AliasResolver = (
  aliasName: string,
) => Required<NativeModuleObjectTypeAnnotation>;

function createAliasResolver(aliasMap: NativeModuleAliasMap): AliasResolver {
  return (aliasName: string) => {
    const alias = aliasMap[aliasName];
    invariant(alias != null, `Unable to resolve type alias '${aliasName}'.`);
    return alias;
  };
}

function getModules(
  schema: SchemaType,
): $ReadOnly<{|[moduleName: string]: NativeModuleSchema|}> {
  return Object.keys(schema.modules)
    .map<?{+[string]: NativeModuleSchema}>(
      moduleName => schema.modules[moduleName].nativeModules,
    )
    .filter(Boolean)
    .reduce<{+[string]: NativeModuleSchema}>(
      (acc, modules) => ({...acc, ...modules}),
      {},
    );
}

module.exports = {
  createAliasResolver,
  getModules,
};
