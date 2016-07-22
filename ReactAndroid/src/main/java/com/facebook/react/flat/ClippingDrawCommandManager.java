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
        View view = viewResolver.getView(viewToAdd);
        ensureViewHasNoParent(view);
        mFlatViewGroup.addViewInLayout(view);
      } else {
        View view = viewResolver.getView(-viewToAdd);
        ensureViewHasNoParent(view);
        DrawView drawView = Assertions.assertNotNull(mDrawViewMap.get(-viewToAdd));
        if (!drawView.mPreviouslyDrawn) {
          // The DrawView has not been drawn before, which means the bounds changed and triggered
          // a new DrawView when it was collected from the shadow node.  We have a view with the
          // same id temporarily detached, but we no longer know the bounds.
          unclip(drawView.reactTag);
          mFlatViewGroup.attachViewToParent(view);
        } else if (!isClipped(drawView.reactTag)) {
          // The DrawView has been drawn before, and is not clipped.  Attach it, and it will get
          // removed if we update the clipping rect.
          mFlatViewGroup.attachViewToParent(view);
        }
        // The DrawView has been previously drawn and is clipped, so don't attach it.
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
            mFlatViewGroup.detachView(--index);
          }
        } else {
          // Clipped, invisible. We obviously aren't animating here, as if we were then we would not
          // have clipped in the first place.
          if (withinBounds(view)) {
            // Now on the screen.  Invalidate as we have a new element to draw.
            unclip(drawView.reactTag);
            mFlatViewGroup.attachViewToParent(view, index++);
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
