/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

/**
 * This interface should be implemented be native ViewGroup subclasses that can represent more than
 * a single react node. In that case, virtual and non-virtual (mapping to a View) elements can
 * overlap, and TouchTargetHelper may incorrectly dispatch touch event to a wrong element because it
 * priorities children over parents.
 */
public interface ReactCompoundViewGroup extends ReactCompoundView {
  /**
   * Returns true if react node responsible for the touch even is flattened into this ViewGroup. Use
   * reactTagForTouch() to get its tag.
   */
  boolean interceptsTouchEvent(float touchX, float touchY);
}
