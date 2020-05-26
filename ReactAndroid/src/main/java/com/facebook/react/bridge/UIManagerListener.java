/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/** Listener used to hook into the UIManager update process. */
public interface UIManagerListener {
  /**
   * Called right before view updates are dispatched at the end of a batch. This is useful if a
   * module needs to add UIBlocks to the queue before it is flushed.
   */
  void willDispatchViewUpdates(UIManager uiManager);
  /** Called on the UI thread right before normal mount items are executed. */
  void willDispatchMountItems();
  /** Called on the UI thread right before premount items are executed. */
  void willDispatchPreMountItems();
}
