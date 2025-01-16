/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/**
 * This interface should be implemented by native ViewGroup subclasses that can represent more than
 * a single react node. In that case, virtual and non-virtual (mapping to a View) elements can
 * overlap, and TouchTargetHelper may incorrectly dispatch touch event to a wrong element because it
 * prioritizes children over parents.
 */
public interface ReactCompoundViewGroup : ReactCompoundView {
  /**
   * Returns true if react node responsible for the touch event is flattened into this ViewGroup.
   * Use reactTagForTouch() to get its tag.
   */
  public fun interceptsTouchEvent(touchX: Float, touchY: Float): Boolean
}
