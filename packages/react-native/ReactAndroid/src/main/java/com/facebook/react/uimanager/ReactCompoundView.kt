/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/**
 * This interface should be implemented by native [View] subclasses that can represent more than a
 * single react node (e.g. [TextView]). It is use by touch event emitter for determining the react
 * tag of the inner-view element that was touched.
 */
public interface ReactCompoundView {

  /**
   * Return react tag for touched element. Event coordinates are relative to the view
   *
   * @param touchX the X touch coordinate relative to the view
   * @param touchY the Y touch coordinate relative to the view
   */
  public fun reactTagForTouch(touchX: Float, touchY: Float): Int
}
