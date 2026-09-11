/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * A token that owns the Android back gesture until {@link #release()} (or {@link #close()}).
 *
 * <p>Use this for something that is not a stack-slide pop: a modal, form sheet, bottom sheet, or
 * custom JS chrome. While any claim is held, React Native consumes the swipe and
 * FragmentManager does not seek a stack transition. Releasing the last claim returns the gesture
 * to the next owner (another claim, a {@link PredictiveBackHandler}, {@code setInterceptEnabled},
 * or screens / the system).
 *
 * @see ReactActivity#claimPredictiveBack()
 */
public final class PredictiveBackClaim implements AutoCloseable {

  private final ReactActivity mActivity;
  private final AtomicBoolean mReleased = new AtomicBoolean(false);

  PredictiveBackClaim(ReactActivity activity) {
    mActivity = activity;
  }

  public boolean isReleased() {
    return mReleased.get();
  }

  public void release() {
    if (mReleased.compareAndSet(false, true)) {
      mActivity.releasePredictiveBackClaim(this);
    }
  }

  @Override
  public void close() {
    release();
  }
}
