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

import type {ColorSchemeName} from './NativeAppearance';

import {addChangeListener, getColorScheme} from './Appearance';
import {useSyncExternalStore} from 'react';

const subscribe = (onStoreChange: () => void) => {
  const appearanceSubscription = addChangeListener(onStoreChange);
  return () => appearanceSubscription.remove();
};

export default function useColorScheme(): ?ColorSchemeName {
  return useSyncExternalStore(subscribe, getColorScheme);
}
