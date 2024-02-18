/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/** Listener used to hook into the UIManager update process. */
public interface UIManagerListener {
  /**
   * Called right before view updates are dispatched at the end of a batch. This is useful if a
   * module needs to add UIBlocks to the queue before it is flushed.
   *
   * <p>This is called by Paper only.
   */
  public fun willDispatchViewUpdates(uiManager: UIManager): Unit
  /**
   * Called on UIThread right before view updates are executed.
   *
   * <p>This is called by Fabric only.
   */
  public fun willMountItems(uiManager: UIManager): Unit
  /**
   * Called on UIThread right after view updates are executed.
   *
   * <p>This is called by Fabric only.
   */
  public fun didMountItems(uiManager: UIManager): Unit
  /**
   * Called on UIThread right after view updates are dispatched for a frame. Note that this will be
   * called for every frame even if there are no updates.
   *
   * <p>This is called by Fabric only.
   */
  public fun didDispatchMountItems(uiManager: UIManager): Unit
  /**
   * Called right after scheduleMountItems is called in Fabric, after a new tree is committed.
   *
   * <p>This is called by Fabric only.
   */
  public fun didScheduleMountItems(uiManager: UIManager): Unit
}
