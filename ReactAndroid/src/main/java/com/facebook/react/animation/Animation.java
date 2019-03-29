/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import javax.annotation.Nullable;

import android.view.View;

import com.facebook.infer.annotation.Assertions;

/**
 * Base class for various catalyst animation engines. Subclasses of this class should implement
 * {@link #run} method which should bootstrap the animation. Then in each animation frame we expect
 * animation engine to call {@link #onUpdate} with a float progress which then will be transferred
 * to the underlying {@link AnimationPropertyUpdater} instance.
 *
 * Animation engine should support animation cancelling by monitoring the returned value of
 * {@link #onUpdate}. In case of returning false, animation should be considered cancelled and
 * engine should not attempt to call {@link #onUpdate} again.
 */
public abstract class Animation {

  private final int mAnimationID;
  private final AnimationPropertyUpdater mPropertyUpdater;
  private volatile boolean mCancelled = false;
  private volatile boolean mIsFinished = false;
  private @Nullable AnimationListener mAnimationListener;
  private @Nullable View mAnimatedView;

  public Animation(int animationID, AnimationPropertyUpdater propertyUpdater) {
    mAnimationID = animationID;
    mPropertyUpdater = propertyUpdater;
  }

  public void setAnimationListener(AnimationListener animationListener) {
    mAnimationListener = animationListener;
  }

  public final void start(View view) {
    mAnimatedView = view;
    mPropertyUpdater.prepare(view);
    run();
  }

  public abstract void run();

  /**
   * Animation engine should call this method for every animation frame passing animation progress
   * value as a parameter. Animation progress should be within the range 0..1 (the exception here
   * would be a spring animation engine which may slightly exceed start and end progress values).
   *
   * This method will return false if the animation has been cancelled. In that case animation
   * engine should not attempt to call this method again. Otherwise this method will return true
   */
  protected final boolean onUpdate(float value) {
    Assertions.assertCondition(!mIsFinished, "Animation must not already be finished!");
    if (!mCancelled) {
      mPropertyUpdater.onUpdate(Assertions.assertNotNull(mAnimatedView), value);
    }
    return !mCancelled;
  }

  /**
   * Animation engine should call this method when the animation is finished. Should be called only
   * once
   */
  protected final void finish() {
    Assertions.assertCondition(!mIsFinished, "Animation must not already be finished!");
    mIsFinished = true;
    if (!mCancelled) {
      if (mAnimatedView != null) {
        mPropertyUpdater.onFinish(mAnimatedView);
      }
      if (mAnimationListener != null) {
        mAnimationListener.onFinished();
      }
    }
  }

  /**
   * Cancels the animation.
   *
   * It is possible for this to be called after finish() and should handle that gracefully.
   */
  public final void cancel() {
    if (mIsFinished || mCancelled) {
      // If we were already finished, ignore
      return;
    }

    mCancelled = true;
    if (mAnimationListener != null) {
      mAnimationListener.onCancel();
    }
  }

  public int getAnimationID() {
    return mAnimationID;
  }
}
