/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export opaque type DisplayModeType = number;

/** DisplayMode should be in sync with the method displayModeToInt from
 * react/renderer/uimanager/primitives.h. */
const DisplayMode: {[string]: DisplayModeType} = Object.freeze({
  VISIBLE: 1,
  SUSPENDED: 2,
  HIDDEN: 3,
});

export function coerceDisplayMode(value: ?number): DisplayModeType {
  if (value == null || value === undefined) {
    return DisplayMode.VISIBLE;
  }
  switch (value) {
    case DisplayMode.SUSPENDED:
    case DisplayMode.HIDDEN:
      return value;
  }
  return DisplayMode.VISIBLE;
}

export default DisplayMode;
