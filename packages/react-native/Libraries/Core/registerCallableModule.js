/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {
  isBridgeless,
  registerCallableModule as nativeRegisterCallableModule,
} from '../../src/private/runtime/ReactNativeRuntimeGlobals';

type Module = {...};
type RegisterCallableModule = (
  name: string,
  moduleOrFactory: Module | (void => Module),
) => void;

const registerCallableModule: RegisterCallableModule = (function () {
  if (isBridgeless) {
    return (name, moduleOrFactory) => {
      if (typeof moduleOrFactory === 'function') {
        nativeRegisterCallableModule?.(name, moduleOrFactory);
        return;
      }

      nativeRegisterCallableModule?.(name, () => moduleOrFactory);
    };
  }

  const BatchedBridge = require('../BatchedBridge/BatchedBridge').default;
  return (name, moduleOrFactory) => {
    if (typeof moduleOrFactory === 'function') {
      BatchedBridge.registerLazyCallableModule(name, moduleOrFactory);
      return;
    }

    BatchedBridge.registerCallableModule(name, moduleOrFactory);
  };
})();

export default registerCallableModule;
