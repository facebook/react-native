/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation;

/** Interface for an animation type that takes care of updating the view layout. */
/* package */ interface LayoutHandlingAnimation {
  /**
   * Notifies the animation of a layout update in case one occurs during the animation. This avoids
   * animating the view to the old layout since it's no longer correct; instead the animation should
   * update and do whatever it can so that the final layout is correct.
   *
   * @param x the new X position for the view
   * @param y the new Y position for the view
   * @param width the new width value for the view
   * @param height the new height value for the view
   */
  void onLayoutUpdate(int x, int y, int width, int height);
}
