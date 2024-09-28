/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeDevMenu from '../NativeModules/specs/NativeDevMenu';

let DevMenu: {
  show(): void,
} = {
  show(): void {},
};

if (__DEV__) {
  DevMenu = {
    show(): void {
      NativeDevMenu.show?.();
    },
  };
}

module.exports = DevMenu;
