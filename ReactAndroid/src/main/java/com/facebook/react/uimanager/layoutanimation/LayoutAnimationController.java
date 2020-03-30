/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation;

import android.os.Handler;
import android.os.Looper;
import android.util.SparseArray;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import javax.annotation.concurrent.NotThreadSafe;

/**
 * Class responsible for animation layout changes, if a valid layout animation config has been
 * supplied. If not animation is available, layout change is applied immediately instead of
 * performing an animation.
 */
@NotThreadSafe
public class LayoutAnimationController {

  private final AbstractLayoutAnimation mLayoutCreateAnimation = new LayoutCreateAnimation();
  private final AbstractLayoutAnimation mLayoutUpdateAnimation = new LayoutUpdateAnimation();
  private final AbstractLayoutAnimation mLayoutDeleteAnimation = new LayoutDeleteAnimation();
  private final SparseArray<LayoutHandlingAnimation> mLayoutHandlers = new SparseArray<>(0);

  private boolean mShouldAnimateLayout;
  private long mMaxAnimationDuration = -1;
  @Nullable private Runnable mCompletionRunnable;

  @Nullable private static Handler sCompletionHandler;

  public void initializeFromConfig(
      final @Nullable ReadableMap config, final Callback completionCallback) {
    if (config == null) {
      reset();
      return;
    }

    mShouldAnimateLayout = false;
    int globalDuration = config.hasKey("duration") ? config.getInt("duration") : 0;
    if (config.hasKey(LayoutAnimationType.toString(LayoutAnimationType.CREATE))) {
      mLayoutCreateAnimation.initializeFromConfig(
          config.getMap(LayoutAnimationType.toString(LayoutAnimationType.CREATE)), globalDuration);
      mShouldAnimateLayout = true;
    }
    if (config.hasKey(LayoutAnimationType.toString(LayoutAnimationType.UPDATE))) {
      mLayoutUpdateAnimation.initializeFromConfig(
          config.getMap(LayoutAnimationType.toString(LayoutAnimationType.UPDATE)), globalDuration);
      mShouldAnimateLayout = true;
    }
    if (config.hasKey(LayoutAnimationType.toString(LayoutAnimationType.DELETE))) {
      mLayoutDeleteAnimation.initializeFromConfig(
          config.getMap(LayoutAnimationType.toString(LayoutAnimationType.DELETE)), globalDuration);
      mShouldAnimateLayout = true;
    }

    if (mShouldAnimateLayout && completionCallback != null) {
      mCompletionRunnable =
          new Runnable() {
            @Override
            public void run() {
              completionCallback.invoke(Boolean.TRUE);
            }
          };
    }
  }

  public void reset() {
    mLayoutCreateAnimation.reset();
    mLayoutUpdateAnimation.reset();
    mLayoutDeleteAnimation.reset();
    mCompletionRunnable = null;
    mShouldAnimateLayout = false;
    mMaxAnimationDuration = -1;
  }

  public boolean shouldAnimateLayout(View viewToAnimate) {
    // if view parent is null, skip animation: view have been clipped, we don't want animation to
    // resume when view is re-attached to parent, which is the standard android animation behavior.
    // If there's a layout handling animation going on, it should be animated nonetheless since the
    // ongoing animation needs to be updated.
    if (viewToAnimate == null) {
      return false;
    }
    return (mShouldAnimateLayout && viewToAnimate.getParent() != null)
        || mLayoutHandlers.get(viewToAnimate.getId()) != null;
  }

  /**
   * Update layout of given view, via immediate update or animation depending on the current batch
   * layout animation configuration supplied during initialization. Handles create and update
   * animations.
   *
   * @param view the view to update layout of
   * @param x the new X position for the view
   * @param y the new Y position for the view
   * @param width the new width value for the view
   * @param height the new height value for the view
   */
  public void applyLayoutUpdate(View view, int x, int y, int width, int height) {
    UiThreadUtil.assertOnUiThread();

    final int reactTag = view.getId();

    // Update an ongoing animation if possible, otherwise the layout update would be ignored as
    // the existing animation would still animate to the old layout.
    LayoutHandlingAnimation existingAnimation = mLayoutHandlers.get(reactTag);
    if (existingAnimation != null) {
      existingAnimation.onLayoutUpdate(x, y, width, height);
      return;
    }

    // Determine which animation to use : if view is initially invisible, use create animation,
    // otherwise use update animation. This approach is easier than maintaining a list of tags
    // for recently created views.
    AbstractLayoutAnimation layoutAnimation =
        (view.getWidth() == 0 || view.getHeight() == 0)
            ? mLayoutCreateAnimation
            : mLayoutUpdateAnimation;

    Animation animation = layoutAnimation.createAnimation(view, x, y, width, height);

    if (animation instanceof LayoutHandlingAnimation) {
      animation.setAnimationListener(
          new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) {
              mLayoutHandlers.put(reactTag, (LayoutHandlingAnimation) animation);
            }

            @Override
            public void onAnimationEnd(Animation animation) {
              mLayoutHandlers.remove(reactTag);
            }

            @Override
            public void onAnimationRepeat(Animation animation) {}
          });
    } else {
      view.layout(x, y, x + width, y + height);
    }

    if (animation != null) {
      long animationDuration = animation.getDuration();
      if (animationDuration > mMaxAnimationDuration) {
        mMaxAnimationDuration = animationDuration;
        scheduleCompletionCallback(animationDuration);
      }

      view.startAnimation(animation);
    }
  }

  /**
   * Animate a view deletion using the layout animation configuration supplied during
   * initialization.
   *
   * @param view The view to animate.
   * @param listener Called once the animation is finished, should be used to completely remove the
   *     view.
   */
  public void deleteView(final View view, final LayoutAnimationListener listener) {
    UiThreadUtil.assertOnUiThread();

    Animation animation =
        mLayoutDeleteAnimation.createAnimation(
            view, view.getLeft(), view.getTop(), view.getWidth(), view.getHeight());

    if (animation != null) {
      disableUserInteractions(view);

      animation.setAnimationListener(
          new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation anim) {}

            @Override
            public void onAnimationRepeat(Animation anim) {}

            @Override
            public void onAnimationEnd(Animation anim) {
              listener.onAnimationEnd();
            }
          });

      long animationDuration = animation.getDuration();
      if (animationDuration > mMaxAnimationDuration) {
        scheduleCompletionCallback(animationDuration);
        mMaxAnimationDuration = animationDuration;
      }

      view.startAnimation(animation);
    } else {
      listener.onAnimationEnd();
    }
  }

  /** Disables user interactions for a view and all it's subviews. */
  private void disableUserInteractions(View view) {
    view.setClickable(false);
    if (view instanceof ViewGroup) {
      ViewGroup viewGroup = (ViewGroup) view;
      for (int i = 0; i < viewGroup.getChildCount(); i++) {
        disableUserInteractions(viewGroup.getChildAt(i));
      }
    }
  }

  private void scheduleCompletionCallback(long delayMillis) {
    if (sCompletionHandler == null) {
      sCompletionHandler = new Handler(Looper.getMainLooper());
    }

    if (mCompletionRunnable != null) {
      sCompletionHandler.removeCallbacks(mCompletionRunnable);
      sCompletionHandler.postDelayed(mCompletionRunnable, delayMillis);
    }
  }
}
