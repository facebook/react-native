// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.recyclerview;

import android.support.v7.widget.RecyclerView;

/**
 * Implementation of {@link RecyclerView.ItemAnimator} that disables all default animations.
 */
/*package*/ class NotAnimatedItemAnimator extends RecyclerView.ItemAnimator {

  @Override
  public boolean animateDisappearance(
      RecyclerView.ViewHolder viewHolder,
      ItemHolderInfo preLayoutInfo,
      ItemHolderInfo postLayoutInfo) {
    dispatchAnimationStarted(viewHolder);
    dispatchAnimationFinished(viewHolder);
    return true;
  }

  @Override
  public boolean animateAppearance(
      RecyclerView.ViewHolder viewHolder,
      ItemHolderInfo preLayoutInfo,
      ItemHolderInfo postLayoutInfo) {
    dispatchAnimationStarted(viewHolder);
    dispatchAnimationFinished(viewHolder);
    return true;
  }

  @Override
  public boolean animatePersistence(
      RecyclerView.ViewHolder viewHolder,
      ItemHolderInfo preLayoutInfo,
      ItemHolderInfo postLayoutInfo) {
    dispatchAnimationStarted(viewHolder);
    dispatchAnimationFinished(viewHolder);
    return true;
  }

  @Override
  public boolean animateChange(
      RecyclerView.ViewHolder oldHolder,
      RecyclerView.ViewHolder newHolder,
      ItemHolderInfo preLayoutInfo,
      ItemHolderInfo postLayoutInfo) {
    dispatchAnimationStarted(oldHolder);
    dispatchAnimationFinished(oldHolder);
    dispatchAnimationStarted(newHolder);
    dispatchAnimationFinished(newHolder);
    return true;
  }

  @Override
  public void runPendingAnimations() {
  }

  @Override
  public void endAnimation(RecyclerView.ViewHolder item) {
  }

  @Override
  public void endAnimations() {
  }

  @Override
  public boolean isRunning() {
    return false;
  }
}
