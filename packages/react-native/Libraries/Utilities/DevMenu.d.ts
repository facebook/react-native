/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * The DevMenu module exposes methods for show the dev menu in development.
 */
export interface DevMenuStatic {
  /**
   * Show the developer menu.
   */
  show(): void;
}

export const DevMenu: DevMenuStatic;
