/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import android.graphics.Canvas;
import android.graphics.Rect;
import android.view.View;
import android.view.animation.Animation;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.views.view.ReactClippingViewGroupHelper;

/**
 * Implementation of a {@link DrawCommandManager} with clipping.  Performs drawing by iterating
 * over an array of DrawCommands, executing them one by one except when the commands are clipped.
 */
/* package */ final class ClippingDrawCommandManager extends DrawCommandManager {
  private final FlatViewGroup mFlatViewGroup;
  DrawCommand[] mDrawCommands = DrawCommand.EMPTY_ARRAY;

  // lookups in o(1) instead of o(log n) - trade space for time
  private final Map<Integer, DrawView> mDrawViewMap = new HashMap<>();
  // When grandchildren are promoted, these can only be FlatViewGroups, but we need to handle the
  // case that we clip subviews and don't promote grandchildren.
  private final Map<Integer, View> mClippedSubviews = new HashMap<>();

  private final Rect mClippingRect = new Rect();

  ClippingDrawCommandManager(FlatViewGroup flatViewGroup, DrawCommand[] drawCommands) {
    mFlatViewGroup = flatViewGroup;
    initialSetup(drawCommands);
  }

  private void initialSetup(DrawCommand[] drawCommands) {
    mountDrawCommands(drawCommands);
    updateClippingRect();
  }

  @Override
  public void mountDrawCommands(DrawCommand[] drawCommands) {
    mDrawCommands = drawCommands;
    mDrawViewMap.clear();
    for (DrawCommand drawCommand : mDrawCommands) {
      if (drawCommand instanceof DrawView) {
        DrawView drawView = (DrawView) drawCommand;
        mDrawViewMap.put(drawView.reactTag, drawView);
      }
    }
  }

  private void clip(int id, View view) {
    mClippedSubviews.put(id, view);
  }

  private void unclip(int id) {
    mClippedSubviews.remove(id);
  }

  private boolean isClipped(int id) {
    return mClippedSubviews.containsKey(id);
  }

  @Override
  public void mountViews(ViewResolver viewResolver, int[] viewsToAdd, int[] viewsToDetach) {
    for (int viewToAdd : viewsToAdd) {
      if (viewToAdd > 0) {
        // This view was not previously attached to this parent.
        View view = viewResolver.getView(viewToAdd);
        ensureViewHasNoParent(view);
        DrawView drawView = Assertions.assertNotNull(mDrawViewMap.get(viewToAdd));
        drawView.mWasMounted = true;
        if (animating(view) || withinBounds(drawView)) {
          // View should be drawn.  This view can't currently be clipped because it wasn't
          // previously attached to this parent.
          mFlatViewGroup.addViewInLayout(view);
        } else {
          clip(drawView.reactTag, view);
        }
      } else {
        // This view was previously attached, and just temporarily detached.
        DrawView drawView = Assertions.assertNotNull(mDrawViewMap.get(-viewToAdd));
        View view = viewResolver.getView(drawView.reactTag);
        ensureViewHasNoParent(view);
        if (drawView.mWasMounted) {
          // The DrawView has been mounted before.
          if (!isClipped(drawView.reactTag)) {
            // The DrawView is not clipped.  Attach it.
            mFlatViewGroup.attachViewToParent(view);
          }
          // else The DrawView has been previously mounted and is clipped, so don't attach it.
        } else {
          // We are mounting it, so lets get this part out of the way.
          drawView.mWasMounted = true;
          // The DrawView has not been mounted before, which means the bounds changed and triggered
          // a new DrawView when it was collected from the shadow node.  We have a view with the
          // same id temporarily detached, but its bounds have changed.
          if (animating(view) || withinBounds(drawView)) {
            // View should be drawn.
            if (isClipped(drawView.reactTag)) {
              // View was clipped, so add it.
              mFlatViewGroup.addViewInLayout(view);
              unclip(drawView.reactTag);
            } else {
              // View was just temporarily removed, so attach it.  We already know it isn't clipped,
              // so no need to unclip it.
              mFlatViewGroup.attachViewToParent(view);
            }
          } else {
            // View should be clipped.
            if (!isClipped(drawView.reactTag)) {
              // View was onscreen.
              mFlatViewGroup.removeDetachedView(view);
              clip(drawView.reactTag, view);
            }
            // else view is already clipped and not within bounds.
          }
        }
      }
    }

    for (int viewToDetach : viewsToDetach) {
      View view = viewResolver.getView(viewToDetach);
      if (view.getParent() != null) {
        throw new RuntimeException("Trying to remove view not owned by FlatViewGroup");
      } else {
        mFlatViewGroup.removeDetachedView(view);
      }
      // The view isn't clipped anymore, but gone entirely.
      unclip(viewToDetach);
    }
  }

  // Returns true if a view is currently animating.
  static boolean animating(View view) {
    Animation animation = view.getAnimation();
    return animation != null && !animation.hasEnded();
  }

  // Return true if a view is currently onscreen.
  boolean withinBounds(View view) {
    if (view instanceof FlatViewGroup) {
      FlatViewGroup flatChildView = (FlatViewGroup) view;
      return mClippingRect.intersects(
          flatChildView.getLeft() + flatChildView.mLogicalAdjustments.left,
          flatChildView.getTop() + flatChildView.mLogicalAdjustments.top,
          flatChildView.getRight() + flatChildView.mLogicalAdjustments.right,
          flatChildView.getBottom() + flatChildView.mLogicalAdjustments.bottom);
    } else {
      return mClippingRect.intersects(
          view.getLeft(),
          view.getTop(),
          view.getRight(),
          view.getBottom());
    }
  }

  // Return true if a DrawView is currently onscreen.
  boolean withinBounds(DrawView drawView) {
    return mClippingRect.intersects(
        Math.round(drawView.getLeft()),
        Math.round(drawView.getTop()),
        Math.round(drawView.getRight()),
        Math.round(drawView.getBottom()));
  }

  @Override
  public boolean updateClippingRect() {
    ReactClippingViewGroupHelper.calculateClippingRect(mFlatViewGroup, mClippingRect);
    if (mFlatViewGroup.getParent() == null || mClippingRect.top == mClippingRect.bottom) {
      // If we are unparented or are clipping to an empty rect, no op.  Return false so we don't
      // invalidate.
      return false;
    }

    int index = 0;
    boolean needsInvalidate = false;
    for (DrawCommand drawCommand : mDrawCommands) {
      if (drawCommand instanceof DrawView) {
        DrawView drawView = (DrawView) drawCommand;
        View view = mClippedSubviews.get(drawView.reactTag);
        if (view == null) {
          // Not clipped, visible
          view = mFlatViewGroup.getChildAt(index++);
          if (!animating(view) && !withinBounds(view)) {
            // Now off the screen.  Don't invalidate in this case, as the canvas should not be
            // redrawn unless new elements are coming onscreen.
            clip(drawView.reactTag, view);
            mFlatViewGroup.removeViewsInLayout(--index, 1);
          }
        } else {
          // Clipped, invisible. We obviously aren't animating here, as if we were then we would not
          // have clipped in the first place.
          if (withinBounds(view)) {
            // Now on the screen.  Invalidate as we have a new element to draw.
            unclip(drawView.reactTag);
            mFlatViewGroup.addViewInLayout(view, index++);
            needsInvalidate = true;
          }
        }
      }
    }

    return needsInvalidate;
  }

  @Override
  public void getClippingRect(Rect outClippingRect) {
    outClippingRect.set(mClippingRect);
  }

  @Override
  public Collection<View> getDetachedViews() {
    return mClippedSubviews.values();
  }

  @Override
  public void draw(Canvas canvas) {
    for (DrawCommand drawCommand : mDrawCommands) {
      if (drawCommand instanceof DrawView) {
        if (!isClipped(((DrawView) drawCommand).reactTag)) {
          drawCommand.draw(mFlatViewGroup, canvas);
        }
        // else, don't draw, and don't increment index
      } else {
        drawCommand.draw(mFlatViewGroup, canvas);
      }
    }
  }

  @Override
  void debugDraw(Canvas canvas) {
    for (DrawCommand drawCommand : mDrawCommands) {
      if (drawCommand instanceof DrawView) {
        if (!isClipped(((DrawView) drawCommand).reactTag)) {
          drawCommand.debugDraw(mFlatViewGroup, canvas);
        }
        // else, don't draw, and don't increment index
      } else {
        drawCommand.debugDraw(mFlatViewGroup, canvas);
      }
    }
  }
}
