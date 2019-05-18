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

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';
import Platform from 'Platform';

export interface Spec extends TurboModule {
  // Exported methods.
  +getConstants: () => {|
    // Common interface
    isTesting: boolean,
    reactNativeVersion: {
      major: number,
      minor: number,
      patch: number,
      prerelease: ?number,
    },

    // Android only
    Version?: number,
    Release?: string,
    Serial?: string,
    Fingerprint?: string,
    Model?: string,
    ServerHost?: string,
    uiMode?: 'tv' | 'car' | 'desk' | 'watch' | 'normal' | 'unknown',

    // iOS only
    forceTouchAvailable?: boolean,
    osVersion?: number,
    systemName?: string,
    interfaceIdiom?: 'phone' | 'pad' | 'tv' | 'carplay' | 'unknown',
  |};

  // Android only
  +getAndroidID?: () => string;
}

export default (Platform.OS === 'ios'
  ? TurboModuleRegistry.getEnforcing<Spec>('Platform')
  : TurboModuleRegistry.getEnforcing<Spec>('PlatformConstants'));
