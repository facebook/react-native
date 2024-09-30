/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeDevMenu from '../specs/modules/NativeDevMenu';

/**
 * The DevMenu module exposes methods for interacting with the Dev Menu in development.
 */
type DevMenuStatic = {
  /**
   * Show the Dev Menu.
   */
  show(): void,
};

const DevMenu: DevMenuStatic = {
  show(): void {
    if (__DEV__) {
      NativeDevMenu.show?.();
    }
  },
};

module.exports = DevMenu;
