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
  const [dims, setDims] =  React.useState(Dimensions.get('window')); // set initial value
  React.useEffect(() => {
    function handleChange({window}) {
      setDims(window)
    }
    Dimensions.addEventListener('change', handleChange);
    return () => {
      Dimensions.removeEventListener('change', handleChange);
    };
  }, []);
  return dims;
}
