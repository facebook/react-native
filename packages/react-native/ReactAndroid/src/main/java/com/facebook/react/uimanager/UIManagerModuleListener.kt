/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/** Listener used to hook into the UIManager update process. */
@Deprecated("Use UIManagerListener instead. This will be deleted in some future release.")
public interface UIManagerModuleListener {
  /**
   * Called right before view updates are dispatched at the end of a batch. This is useful if a
   * module needs to add UIBlocks to the queue before it is flushed.
   */
  public fun willDispatchViewUpdates(uiManager: UIManagerModule)
}
