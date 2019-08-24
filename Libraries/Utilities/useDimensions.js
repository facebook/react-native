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
import {useEffect, useState} from 'react';

export default function useDimensions(dim = "window"): DisplayMetrics {
  const [dims, setDims] = useState(() => Dimensions.get(dim));
  useEffect(() => {
    function handleChange(event) {
      setDims(event[dim]);
    }
    Dimensions.addEventListener('change', handleChange);
    // We might have missed an update between calling `get` in render and
    // `addEventListener` in this handler, so we set it here. If there was
    // no change, React will filter out this update as a no-op.
    setDims(Dimensions.get(dim));
    return () => {
      Dimensions.removeEventListener('change', handleChange);
    };
  }, []);
  return dims;
}
