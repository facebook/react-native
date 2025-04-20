/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Platform from 'react-native/Libraries/Utilities/Platform';

function shouldUseTurboAnimatedModule(): boolean {
  return Platform.OS === 'ios' && global.RN$Bridgeless === true;
}

export default shouldUseTurboAnimatedModule;
