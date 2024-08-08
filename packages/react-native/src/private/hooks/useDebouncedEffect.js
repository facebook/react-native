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

'use strict';

import useDebouncedEffectImplementation from './DebouncedEffectImplementation';
// $FlowFixMe[untyped-import] used as an opaque type
import Scheduler from 'scheduler';

export default function useDebouncedEffect(
  fn: () => void | (() => void),
  deps?: ?$ReadOnlyArray<mixed>,
): void {
  return useDebouncedEffectImplementation(fn, deps, Scheduler);
}
