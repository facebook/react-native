/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    D?: ?boolean,
    A?: Array<any>,
    G?: any,
    E?: ?{|
      D?: ?boolean,
      E?: ?{|
        D?: ?boolean,
        E?: ?{|
          D?: boolean,
          E?: number,
          F?: string,
        |},
        F?: string,
      |},
      F?: string,
    |},
    F?: string,
  |};
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
): Spec);
