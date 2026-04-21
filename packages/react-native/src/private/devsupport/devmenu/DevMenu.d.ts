/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * The DevMenu module exposes methods for interacting with the Dev Menu in development.
 */
export interface DevMenuStatic {
  /**
   * Show the Dev Menu.
   */
  show(): void;
}

declare const $$DevMenu: DevMenuStatic;
export default $$DevMenu;
