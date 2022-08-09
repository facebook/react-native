/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  /* Called right after view updates are dispatched for a frame. */
  void didDispatchMountItems(UIManager uiManager);
  /* Called right after scheduleMountItems is called in Fabric, after a new tree is committed. */
  void didScheduleMountItems(UIManager uiManager);
}
