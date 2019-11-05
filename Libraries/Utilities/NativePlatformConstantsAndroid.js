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

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    isTesting: boolean,
    reactNativeVersion: {|
      major: number,
      minor: number,
      patch: number,
      prerelease: ?number,
    |},
    Version: number,
    Release: string,
    Serial: string,
    Fingerprint: string,
    Model: string,
    ServerHost: string,
    uiMode: string,
  |};
  +getAndroidID: () => string;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'PlatformConstants',
): Spec);
