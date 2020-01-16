/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {SchemaType, MethodTypeShape} from '../../../CodegenSchema.js';

export type NativeModuleSchemaBuilderConfig = $ReadOnly<{|
  properties: $ReadOnlyArray<MethodTypeShape>,
|}>;

function buildModuleSchema(
  {properties}: NativeModuleSchemaBuilderConfig,
  moduleName: string,
): SchemaType {
  return {
    modules: {
      [`Native${moduleName}`]: {
        nativeModules: {
          [moduleName]: {
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
