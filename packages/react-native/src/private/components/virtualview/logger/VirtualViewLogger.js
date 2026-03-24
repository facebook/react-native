/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {IVirtualViewLogFunctions} from './VirtualViewLoggerTypes';

import {useRef} from 'react';

export hook useVirtualViewLogging(
  initiallyHidden: boolean,
  nativeID?: string,
): React.RefObject<?IVirtualViewLogFunctions> {
  return useRef(null);
}
