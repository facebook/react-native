// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager.layoutanimation;

import javax.annotation.Nullable;
import javax.annotation.concurrent.NotThreadSafe;

import android.view.View;
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
  }

  public void reset() {
    mLayoutCreateAnimation.reset();
    mLayoutUpdateAnimation.reset();
    mShouldAnimateLayout = false;
  }

  public boolean shouldAnimateLayout(View viewToAnimate) {
    // if view parent is null, skip animation: view have been clipped, we don't want animation to
    // resume when view is re-attached to parent, which is the standard android animation behavior.
    return mShouldAnimateLayout && viewToAnimate.getParent() != null;
  }

  /**
   * Update layout of given view, via immediate update or animation depending on the current batch
   * layout animation configuration supplied during initialization.
   *
   * @param view the view to update layout of
   * @param x the new X position for the view
   * @param y the new Y position for the view
   * @param width the new width value for the view
   * @param height the new height value for the view
   */
  public void applyLayoutUpdate(View view, int x, int y, int width, int height) {
    UiThreadUtil.assertOnUiThread();

    // Determine which animation to use : if view is initially invisible, use create animation.
    // If view is becoming invisible, use delete animation. Otherwise, use update animation.
    // This approach is easier than maintaining a list of tags for recently created/deleted views.
    AbstractLayoutAnimation layoutAnimation = (view.getWidth() == 0 || view.getHeight() == 0) ?
        mLayoutCreateAnimation :
        mLayoutUpdateAnimation;

    Animation animation = layoutAnimation.createAnimation(view, x, y, width, height);
    if (animation == null || !(animation instanceof HandleLayout)) {
      view.layout(x, y, x + width, y + height);
    }
    if (animation != null) {
      view.startAnimation(animation);
    }
  }
}
