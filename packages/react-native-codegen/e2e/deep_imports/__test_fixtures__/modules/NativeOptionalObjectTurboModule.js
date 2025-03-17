/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {
    D?: ?boolean,
    A?: Array<any>,
    E?: ?{
      D?: ?boolean,
      E?: ?{
        D?: ?boolean,
        E?: ?{
          D?: boolean,
          E?: number,
          F?: string,
        },
        F?: string,
      },
      F?: string,
    },
    F?: string,
  };
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
): Spec);
