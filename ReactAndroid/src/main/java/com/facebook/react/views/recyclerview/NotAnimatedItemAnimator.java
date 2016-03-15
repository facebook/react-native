// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.recyclerview;

import android.support.v7.widget.RecyclerView;

/**
 * Implementation of {@link RecyclerView.ItemAnimator} that disables all default animations.
 */
/*package*/ class NotAnimatedItemAnimator extends RecyclerView.ItemAnimator {

  @Override
  public void runPendingAnimations() {
    // nothing
  }

  @Override
  public boolean animateRemove(RecyclerView.ViewHolder holder) {
    dispatchRemoveStarting(holder);
    dispatchRemoveFinished(holder);
    return true;
  }

  @Override
  public boolean animateAdd(RecyclerView.ViewHolder holder) {
    dispatchAddStarting(holder);
    dispatchAddFinished(holder);
    return true;
  }

  @Override
  public boolean animateMove(
      RecyclerView.ViewHolder holder,
      int fromX,
      int fromY,
      int toX,
      int toY) {
    dispatchMoveStarting(holder);
    dispatchMoveFinished(holder);
    return true;
  }

  @Override
  public boolean animateChange(
      RecyclerView.ViewHolder oldHolder,
      RecyclerView.ViewHolder newHolder,
      int fromLeft,
      int fromTop,
      int toLeft,
      int toTop) {
    dispatchChangeStarting(oldHolder, true);
    dispatchChangeFinished(oldHolder, true);
    dispatchChangeStarting(newHolder, false);
    dispatchChangeFinished(newHolder, false);
    return true;
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
