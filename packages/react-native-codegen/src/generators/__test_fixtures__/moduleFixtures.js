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

import type {SchemaType} from '../../CodegenSchema.js';

const EMPTY_NATIVE_MODULES: SchemaType = {
  modules: {
    SampleTurboModule: {
      nativeModules: {
        SampleTurboModule: {
          properties: [],
        },
      },
    },
  },
};

module.exports = {
  EMPTY_NATIVE_MODULES,
};
