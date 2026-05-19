/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';
import Platform from '../Utilities/Platform';

function shouldUseTurboAnimatedModule(): boolean {
  if (ReactNativeFeatureFlags.cxxNativeAnimatedEnabled()) {
    return false;
  } else {
    return Platform.OS === 'ios' && global.RN$Bridgeless === true;
  }
}

export default shouldUseTurboAnimatedModule;
