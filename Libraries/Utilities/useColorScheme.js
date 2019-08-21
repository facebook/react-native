/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import {useMemo} from 'react';
import {useSubscription} from 'use-subscription';
import Appearance from './Appearance';

export default function useColorScheme() {
  const subscription = useMemo(
    () => ({
      getCurrentValue: () => Appearance.get('colorScheme'),
      subscribe: callback => {
        Appearance.addChangeListener(callback);
        return () => Appearance.removeChangeListener(callback);
      },
    }),
    [],
  );

  return useSubscription(subscription);
}
