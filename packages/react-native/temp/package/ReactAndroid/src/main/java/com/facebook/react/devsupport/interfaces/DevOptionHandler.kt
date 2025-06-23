/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

/**
 * Callback class for custom options that may appear in [DevSupportManager] developer options menu.
 * In case when option registered for this handler is selected from the menu, the instance method
 * [.onOptionSelected] will be triggered.
 */
public fun interface DevOptionHandler {
  /**
   * Triggered in case when user select custom developer option from the developers options menu
   * displayed with [DevSupportManager].
   */
  public fun onOptionSelected()
}
