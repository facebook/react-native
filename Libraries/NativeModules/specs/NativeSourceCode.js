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

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    scriptURL: string,
  |};
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('SourceCode');
let constants = null;

const NativeSourceCode = {
  getConstants(): {|
    scriptURL: string,
  |} {
    if (constants == null) {
      constants = NativeModule.getConstants();
    }

    return constants;
  },
};

export default NativeSourceCode;
