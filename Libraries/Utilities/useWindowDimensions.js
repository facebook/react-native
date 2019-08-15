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

import Dimensions from './Dimensions';
import {type DisplayMetrics} from './NativeDeviceInfo';
import * as React from 'react';

export default function useWindowDimensions(): DisplayMetrics {
  const dims = Dimensions.get('window'); // always read the latest value
  const forceUpdate = React.useState(false)[1].bind(null, v => !v);
  const initialDims = React.useState(dims)[0];
  React.useEffect(() => {
    Dimensions.addEventListener('change', forceUpdate);

    const latestDims = Dimensions.get('window');
    if (latestDims !== initialDims) {
      // We missed an update between calling `get` in render and
      // `addEventListener` in this handler...
      forceUpdate();
    }
    return () => {
      Dimensions.removeEventListener('change', forceUpdate);
    };
  }, [forceUpdate, initialDims]);
  return dims;
}
