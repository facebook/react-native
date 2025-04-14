/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Rect
import android.view.View

/**
 * Interface that should be implemented by [View] subclasses that support `removeClippedSubviews`
 * property. When this property is set for the [android.view.ViewGroup] subclass it's responsible
 * for detaching it's child views that are clipped by the view boundaries. Those view boundaries
 * should be determined based on it's parent clipping area and current view's offset in parent and
 * doesn't necessarily reflect the view visible area (in a sense of a value that
 * [View.getGlobalVisibleRect] may return). In order to determine the clipping rect for current view
 * helper method [ReactClippingViewGroupHelper.calculateClippingRect] can be used that takes into
 * account parent view settings.
 */
public interface ReactClippingViewGroup {
  /**
   * Notify view that clipping area may have changed and it should recalculate the list of children
   * that should be attached/detached. This method should be called only when property
   * [removeClippedSubviews] is set to `true` on a view.
   *
   * CAUTION: Views are responsible for calling [updateClippingRect] on it's children. This should
   * happen if child implement [ReactClippingViewGroup], return true from [removeClippedSubviews]
   * and clipping rect change of the current view may affect clipping rect of this child.
   */
  public fun updateClippingRect()

  public fun updateClippingRect(excludedView: Set<Int>?)

  /**
   * Get rectangular bounds to which view is currently clipped to. Called only on views that has set
   * `removeCLippedSubviews` property value to `true`.
   *
   * @param outClippingRect output clipping rect should be written to this object.
   */
  public fun getClippingRect(outClippingRect: Rect)

  /**
   * Sets property `removeClippedSubviews` as a result of property update in JS. Should be called
   * only from [ViewManager.updateView] method.
   *
   * Helper method [ReactClippingViewGroupHelper.applyRemoveClippedSubviewsProperty] may be used by
   * [ViewManager] subclass to apply this property based on property update map
   * [ReactStylesDiffMap].
   */
  public var removeClippedSubviews: Boolean
}
