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
   *
   * This is called by Paper only.
   */
  void willDispatchViewUpdates(UIManager uiManager);
  /**
   * Called on UIThread right before view updates are executed.
   *
   * This is called by Fabric only.
   */
  void willMountItems(UIManager uiManager);
  /**
   * Called on UIThread right after view updates are executed.
   *
   * This is called by Fabric only.
   */
  void didMountItems(UIManager uiManager);
  /**
   * Called on UIThread right after view updates are dispatched for a frame. Note that this will be called
   * for every frame even if there are no updates.
   *
   * This is called by Fabric only.
   */
  void didDispatchMountItems(UIManager uiManager);
  /**
   * Called right after scheduleMountItems is called in Fabric, after a new tree is committed.
   *
   * This is called by Fabric only.
   */
  void didScheduleMountItems(UIManager uiManager);
}
