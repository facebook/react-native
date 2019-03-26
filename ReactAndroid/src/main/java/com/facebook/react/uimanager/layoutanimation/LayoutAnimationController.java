// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager.layoutanimation;

import javax.annotation.Nullable;
import javax.annotation.concurrent.NotThreadSafe;

import android.util.SparseArray;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;

/**
 * Class responsible for animation layout changes, if a valid layout animation config has been
 * supplied. If not animation is available, layout change is applied immediately instead of
 * performing an animation.
 *
 * TODO(7613721): Invoke success callback at the end of animation and when animation gets cancelled.
 */
@NotThreadSafe
public class LayoutAnimationController {

  private static final boolean ENABLED = true;

  private final AbstractLayoutAnimation mLayoutCreateAnimation = new LayoutCreateAnimation();
  private final AbstractLayoutAnimation mLayoutUpdateAnimation = new LayoutUpdateAnimation();
  private final AbstractLayoutAnimation mLayoutDeleteAnimation = new LayoutDeleteAnimation();
  private final SparseArray<LayoutHandlingAnimation> mLayoutHandlers = new SparseArray<>(0);
  private boolean mShouldAnimateLayout;

  public void initializeFromConfig(final @Nullable ReadableMap config) {
    if (!ENABLED) {
      return;
    }

    if (config == null) {
      reset();
      return;
    }

    mShouldAnimateLayout = false;
    int globalDuration = config.hasKey("duration") ? config.getInt("duration") : 0;
    if (config.hasKey(LayoutAnimationType.CREATE.toString())) {
      mLayoutCreateAnimation.initializeFromConfig(
          config.getMap(LayoutAnimationType.CREATE.toString()), globalDuration);
      mShouldAnimateLayout = true;
    }
    if (config.hasKey(LayoutAnimationType.UPDATE.toString())) {
      mLayoutUpdateAnimation.initializeFromConfig(
          config.getMap(LayoutAnimationType.UPDATE.toString()), globalDuration);
      mShouldAnimateLayout = true;
    }
    if (config.hasKey(LayoutAnimationType.DELETE.toString())) {
      mLayoutDeleteAnimation.initializeFromConfig(
          config.getMap(LayoutAnimationType.DELETE.toString()), globalDuration);
      mShouldAnimateLayout = true;
    }
  }

  public void reset() {
    mLayoutCreateAnimation.reset();
    mLayoutUpdateAnimation.reset();
    mLayoutDeleteAnimation.reset();
    mShouldAnimateLayout = false;
  }

  public boolean shouldAnimateLayout(View viewToAnimate) {
    // if view parent is null, skip animation: view have been clipped, we don't want animation to
    // resume when view is re-attached to parent, which is the standard android animation behavior.
    // If there's a layout handling animation going on, it should be animated nonetheless since the
    // ongoing animation needs to be updated.
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
    LayoutHandlingAnimation existingAnimation = mLayoutHandlers.get(reactTag);

    // Update an ongoing animation if possible, otherwise the layout update would be ignored as
    // the existing animation would still animate to the old layout.
    if (existingAnimation != null) {
      existingAnimation.onLayoutUpdate(x, y, width, height);
      return;
    }

    // Determine which animation to use : if view is initially invisible, use create animation,
    // otherwise use update animation. This approach is easier than maintaining a list of tags
    // for recently created views.
    AbstractLayoutAnimation layoutAnimation = (view.getWidth() == 0 || view.getHeight() == 0) ?
        mLayoutCreateAnimation :
        mLayoutUpdateAnimation;

    Animation animation = layoutAnimation.createAnimation(view, x, y, width, height);

    if (animation instanceof LayoutHandlingAnimation) {
      animation.setAnimationListener(new Animation.AnimationListener() {
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
      view.startAnimation(animation);
    }
  }

  /**
   * Animate a view deletion using the layout animation configuration supplied during initialization.
   *
   * @param view     The view to animate.
   * @param listener Called once the animation is finished, should be used to
   *                 completely remove the view.
   */
  public void deleteView(final View view, final LayoutAnimationListener listener) {
    UiThreadUtil.assertOnUiThread();

    AbstractLayoutAnimation layoutAnimation = mLayoutDeleteAnimation;

    Animation animation = layoutAnimation.createAnimation(
        view, view.getLeft(), view.getTop(), view.getWidth(), view.getHeight());

    if (animation != null) {
      disableUserInteractions(view);

      animation.setAnimationListener(new Animation.AnimationListener() {
        @Override
        public void onAnimationStart(Animation anim) {}

        @Override
        public void onAnimationRepeat(Animation anim) {}

        @Override
        public void onAnimationEnd(Animation anim) {
          listener.onAnimationEnd();
        }
      });

      view.startAnimation(animation);
    } else {
      listener.onAnimationEnd();
    }
  }

  /**
   * Disables user interactions for a view and all it's subviews.
   */
  private void disableUserInteractions(View view) {
    view.setClickable(false);
    if (view instanceof ViewGroup) {
      ViewGroup viewGroup = (ViewGroup)view;
      for (int i = 0; i < viewGroup.getChildCount(); i++) {
        disableUserInteractions(viewGroup.getChildAt(i));
      }
    }
  }
}
