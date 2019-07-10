/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {SchemaType, MethodTypeShape} from '../../../CodegenSchema.js';

export type NativeModuleSchemaBuilderConfig = $ReadOnly<{|
  filename: string,
  moduleName: string,
  properties: $ReadOnlyArray<MethodTypeShape>,
|}>;

function buildModuleSchema({
  filename,
  moduleName,
  properties,
}: NativeModuleSchemaBuilderConfig): SchemaType {
  return {
    modules: {
      [filename]: {
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
