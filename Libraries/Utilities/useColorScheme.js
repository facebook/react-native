/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import {useMemo} from 'react';
import {useSubscription} from 'use-subscription';
import Appearance from './Appearance';
import type {ColorSchemeName} from './NativeAppearance';

export default function useColorScheme(): ?ColorSchemeName {
  const subscription = useMemo(
    () => ({
      getCurrentValue: () => Appearance.getColorScheme(),
      subscribe: callback => {
        Appearance.addChangeListener(callback);
        return () => Appearance.removeChangeListener(callback);
      },
    }),
    [],
  );

  return useSubscription(subscription);
}
