/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// NOTE: This file supports backwards compatibility of subpath (deep) imports
// from 'react-native' with platform-specific extensions. It can be deleted
// once we remove the "./*" mapping from package.json "exports".

'use strict';

import Platform from '../../Utilities/Platform';

export type {
  DrawerLayoutAndroidProps,
  DrawerSlideEvent,
} from './DrawerLayoutAndroidTypes';

let DrawerLayoutAndroid;

if (Platform.OS === 'android') {
  DrawerLayoutAndroid = require('./DrawerLayoutAndroid.android').default;
} else {
  DrawerLayoutAndroid = require('./DrawerLayoutAndroidFallback').default;
}

export default DrawerLayoutAndroid;
