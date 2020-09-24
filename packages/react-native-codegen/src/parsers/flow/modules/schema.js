/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {
  SchemaType,
  ObjectTypeAliasTypeShape,
  NativeModuleMethodTypeShape,
} from '../../../CodegenSchema.js';

export type NativeModuleSchemaBuilderConfig = $ReadOnly<{|
  aliases: $ReadOnly<{[aliasName: string]: ObjectTypeAliasTypeShape, ...}>,
  properties: $ReadOnlyArray<NativeModuleMethodTypeShape>,
|}>;

function buildModuleSchema(
  {aliases, properties}: NativeModuleSchemaBuilderConfig,
  moduleName: string,
): SchemaType {
  return {
    modules: {
      [`Native${moduleName}`]: {
        nativeModules: {
          [moduleName]: {
            aliases,
            properties,
          },
        },
      },
    },
  };
}

module.exports = {
  buildModuleSchema,
};
