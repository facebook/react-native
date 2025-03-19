/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import com.facebook.react.common.annotations.internal.LegacyArchitecture

/** Interface for an animation type that takes care of updating the view layout. */
@LegacyArchitecture
internal interface LayoutHandlingAnimation {
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
  fun onLayoutUpdate(x: Int, y: Int, width: Int, height: Int)

  /**
   * Returns whether the animation is valid and should be used. Because layout animations generally
   * hold {@link java.lang.ref.WeakReference<android.view.View>} objects, it's possible that the
   * view has been garbage collected. In this case, the animation should not be used.
   *
   * @return true if the animation is valid and can be used, false otherwise
   */
  fun isValid(): Boolean
}
