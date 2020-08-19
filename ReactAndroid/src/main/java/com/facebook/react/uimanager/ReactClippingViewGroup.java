/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.graphics.Rect;
import android.view.View;

import androidx.annotation.Nullable;

/**
 * Interface that should be implemented by {@link View} subclasses that support {@code
 * removeClippedSubviews} property. When this property is set for the {@link ViewGroup} subclass
 * it's responsible for detaching it's child views that are clipped by the view boundaries. Those
 * view boundaries should be determined based on it's parent clipping area and current view's offset
 * in parent and doesn't necessarily reflect the view visible area (in a sense of a value that
 * {@link View#getGlobalVisibleRect} may return). In order to determine the clipping rect for
 * current view helper method {@link ReactClippingViewGroupHelper#calculateClippingRect} can be used
 * that takes into account parent view settings.
 */
public interface ReactClippingViewGroup {

  /**
   * Notify view that clipping area may have changed and it should recalculate the list of children
   * that should be attached/detached. This method should be called only when property {@code
   * removeClippedSubviews} is set to {@code true} on a view.
   *
   * <p>CAUTION: Views are responsible for calling {@link #updateClippingRect} on it's children.
   * This should happen if child implement {@link ReactClippingViewGroup}, return true from {@link
   * #getRemoveClippedSubviews} and clipping rect change of the current view may affect clipping
   * rect of this child.
   */
  void updateClippingRect();

  /**
   * Get rectangular bounds to which view is currently clipped to. Called only on views that has set
   * {@code removeCLippedSubviews} property value to {@code true}.
   *
   * @param outClippingRect output clipping rect should be written to this object.
   */
  void getClippingRect(Rect outClippingRect);

  /**
   * Sets property {@code removeClippedSubviews} as a result of property update in JS. Should be
   * called only from @{link ViewManager#updateView} method.
   *
   * <p>Helper method {@link ReactClippingViewGroupHelper#applyRemoveClippedSubviewsProperty} may be
   * used by {@link ViewManager} subclass to apply this property based on property update map {@link
   * ReactStylesDiffMap}.
   */
  void setRemoveClippedSubviews(boolean removeClippedSubviews);

  /** Get the current value of {@code removeClippedSubviews} property. */
  boolean getRemoveClippedSubviews();

  /**
   * Sets property {@code overflow} as a result of style update in JS.
   */
  void setOverflow(String overflow);

  /** Get the current value of {@code overflow} property. */
  @Nullable
  String getOverflow();
}
