/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.util.ArrayList;
import java.util.Arrays;

import android.graphics.Canvas;
import android.graphics.Rect;
import android.util.SparseArray;
import android.util.SparseIntArray;
import android.view.View;
import android.view.animation.Animation;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.ReactClippingViewGroup;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;

/**
 * Abstract class for a {@link DrawCommandManager} with directional clipping.  Allows support for
 * vertical and horizontal clipping by implementing abstract methods.
 *
 * Uses two dynamic programming arrays to efficiently update which views and commands are onscreen,
 * while not having to sort the incoming draw commands.  The draw commands are loosely sorted, as
 * they represent a flattening of the normal view hierarchy, and we use that information to quickly
 * find children that should be considered onscreen.  One array keeps track of, for each index, the
 * maximum bottom position that occurs at or before that index; the other keeps track of the
 * minimum top position that occurs at or after that index. Given the following children:
 *
 *       +---------------------------------+    0 (Y coordinate)
 *       | 0                               |
 *       |  +-----------+                  |   10
 *       |  | 1         |                  |
 *       |  |           | +--------------+ |   20
 *       |  |           | | 3            | |
 *       |  +-----------+ |              | |   30
 *       |                |              | |
 *       |  +-----------+ |              | |   40
 *       |  | 2         | |              | |
 *       |  |           | +--------------+ |   50
 *       |  |           |                  |
 *       |  +-----------+                  |   60
 *       |                                 |
 *       +---------------------------------+   70
 *
 *          +-----------+                      80
 *          | 4         |
 *          |           | +--------------+     90
 *          |           | | 6            |
 *          +-----------+ |              |    100
 *                        |              |
 *          +-----------+ |              |    110
 *          | 5         | |              |
 *          |           | +--------------+    120
 *          |           |
 *          +-----------+                     130
 *
 * The two arrays are:
 *                 0   1   2   3    4    5    6
 *   Max Bottom: [70, 70, 70, 70, 100, 130, 130]
 *   Min Top:    [ 0,  0,  0,  0,  80,  90,  90]
 *
 * We can then binary search for the first max bottom that is above our rect, and the first min top
 * that is below our rect.
 *
 * If the top and bottom of the rect are 55 and 85, respectively, we will start drawing at index 0
 * and stop at index 4.
 *
 *       +---------------------------------+    0 (Y coordinate)
 *       | 0                               |
 *       |  +-----------+                  |   10
 *       |  | 1         |                  |
 *       |  |           | +--------------+ |   20
 *       |  |           | | 3            | |
 *       |  +-----------+ |              | |   30
 *       |                |              | |
 *       |  +-----------+ |              | |   40
 *       |  | 2         | |              | |
 *       |  |           | +--------------+ |   50
 *   -  -| -| -  -  -  -| -  -  -  -  -  - |-  -  -
 *       |  +-----------+                  |   60
 *       |                                 |
 *       +---------------------------------+   70
 *
 *          +-----------+                      80
 *   -  -  -| 4 -  -  - | -  -  -  -  -  -  -  -  -
 *          |           | +--------------+     90
 *          |           | | 6            |
 *          +-----------+ |              |    100
 *                        |              |
 *          +-----------+ |              |    110
 *          | 5         | |              |
 *          |           | +--------------+    120
 *          |           |
 *          +-----------+                     130
 *
 * If the top and bottom are 75 and 105 respectively, we will start drawing at index 4 and stop at
 * index 6.
 *
 *       +---------------------------------+    0 (Y coordinate)
 *       | 0                               |
 *       |  +-----------+                  |   10
 *       |  | 1         |                  |
 *       |  |           | +--------------+ |   20
 *       |  |           | | 3            | |
 *       |  +-----------+ |              | |   30
 *       |                |              | |
 *       |  +-----------+ |              | |   40
 *       |  | 2         | |              | |
 *       |  |           | +--------------+ |   50
 *       |  |           |                  |
 *       |  +-----------+                  |   60
 *       |                                 |
 *       +---------------------------------+   70
 *   -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
 *          +-----------+                      80
 *          | 4         |
 *          |           | +--------------+     90
 *          |           | | 6            |
 *          +-----------+ |              |    100
 *   -  -  -  -  -  -  -  |-  -  -  -  - |  -  -  -
 *          +-----------+ |              |    110
 *          | 5         | |              |
 *          |           | +--------------+    120
 *          |           |
 *          +-----------+                     130
 *
 * While this doesn't map exactly to all of the commands that could be clipped, it means that
 * children which contain other children (a pretty common case when flattening views) are clipped
 * or unclipped as one logical unit.  This has the side effect of minimizing the amount of
 * invalidates coming from minor clipping rect adjustments.  The underlying dynamic programming
 * arrays can be calculated off the UI thread in O(n) time, requiring just two passes through the
 * command array.
 *
 * We do a similar optimization when searching for matching node regions, as node regions are
 * loosely sorted as well when clipping.
 */
/* package */ abstract class ClippingDrawCommandManager extends DrawCommandManager {

  private static final String TAG = ClippingDrawCommandManager.class.getSimpleName();

  private final FlatViewGroup mFlatViewGroup;
  private DrawCommand[] mDrawCommands = DrawCommand.EMPTY_ARRAY;
  protected float[] mCommandMaxBottom = StateBuilder.EMPTY_FLOAT_ARRAY;
  protected float[] mCommandMinTop = StateBuilder.EMPTY_FLOAT_ARRAY;

  private NodeRegion[] mNodeRegions = NodeRegion.EMPTY_ARRAY;
  protected float[] mRegionMaxBottom = StateBuilder.EMPTY_FLOAT_ARRAY;
  protected float[] mRegionMinTop = StateBuilder.EMPTY_FLOAT_ARRAY;

  // Onscreen bounds of draw command array.
  private int mStart;
  private int mStop;

  // Mapping of ids to index position within the draw command array.  O(log n) lookups should be
  // less in our case because of the large constant overhead and auto boxing of the map.
  private SparseIntArray mDrawViewIndexMap = StateBuilder.EMPTY_SPARSE_INT;
  // Map of views that are currently clipped.
  private final SparseArray<View> mClippedSubviews = new SparseArray<>();

  protected final Rect mClippingRect = new Rect();

  // Used in updating the clipping rect, as sometimes we want to detach all views, which means we
  // need to temporarily store the views we are detaching and removing.  These are always of size
  // 0, except when used in update clipping rect.
  private final SparseArray<View> mViewsToRemove = new SparseArray<>();
  private final ArrayList<View> mViewsToKeep = new ArrayList<>();

  // Currently clipping ViewGroups
  private final ArrayList<ReactClippingViewGroup> mClippingViewGroups = new ArrayList<>();

  ClippingDrawCommandManager(FlatViewGroup flatViewGroup, DrawCommand[] drawCommands) {
    mFlatViewGroup = flatViewGroup;
    initialSetup(drawCommands);
  }

  /**
   * Initially setup this instance.  Makes sure the draw commands are mounted, and that our
   * clipping rect reflects our current bounds.
   *
   * @param drawCommands The list of current draw commands.  In current implementations, this will
   *   always be DrawCommand.EMPTY_ARRAY
   */
  private void initialSetup(DrawCommand[] drawCommands) {
    mountDrawCommands(
        drawCommands,
        mDrawViewIndexMap,
        mCommandMaxBottom,
        mCommandMinTop,
        true);
    updateClippingRect();
  }

  /**
   * @return index of the first command that could be on the screen.
   */
  abstract int commandStartIndex();

  /**
   * @return index of the first command that is guaranteed to be off the screen, starting from the
   *   given start.
   */
  abstract int commandStopIndex(int start);

  /**
   * @return index of the first region that is guaranteed to be outside of the bounds for touch.
   */
  abstract int regionStopIndex(float touchX, float touchY);

  /**
   * Whether an index and all indices before it are guaranteed to be out of bounds for the current
   * touch.
   *
   * @param index The region index to check.
   * @param touchX X coordinate.
   * @param touchY Y coordinate.
   * @return true if the index and all before it are out of bounds.
   */
  abstract boolean regionAboveTouch(int index, float touchX, float touchY);

  @Override
  public void mountDrawCommands(
      DrawCommand[] drawCommands,
      SparseIntArray drawViewIndexMap,
      float[] maxBottom,
      float[] minTop,
      boolean willMountViews) {
    mDrawCommands = drawCommands;
    mCommandMaxBottom = maxBottom;
    mCommandMinTop = minTop;
    mDrawViewIndexMap = drawViewIndexMap;
    if (mClippingRect.bottom != mClippingRect.top) {
      mStart = commandStartIndex();
      mStop = commandStopIndex(mStart);
      if (!willMountViews) {
        // If we are not mounting views, we still need to update view indices and positions.  It is
        // possible that a child changed size and we still need new clipping even though we are not
        // mounting views.
        updateClippingToCurrentRect();
      }
    }
  }

  @Override
  public void mountNodeRegions(NodeRegion[] nodeRegions, float[] maxBottom, float[] minTop) {
    mNodeRegions = nodeRegions;
    mRegionMaxBottom = maxBottom;
    mRegionMinTop = minTop;
  }

  @Override
  public @Nullable NodeRegion virtualNodeRegionWithinBounds(float touchX, float touchY) {
    int i = regionStopIndex(touchX, touchY);
    while (i-- > 0) {
      NodeRegion nodeRegion = mNodeRegions[i];
      if (!nodeRegion.mIsVirtual) {
        // only interested in virtual nodes
        continue;
      }
      if (regionAboveTouch(i, touchX, touchY)) {
        break;
      }
      if (nodeRegion.withinBounds(touchX, touchY)) {
        return nodeRegion;
      }
    }

    return null;
  }

  @Override
  public @Nullable NodeRegion anyNodeRegionWithinBounds(float touchX, float touchY) {
    int i = regionStopIndex(touchX, touchY);
    while (i-- > 0) {
      NodeRegion nodeRegion = mNodeRegions[i];
      if (regionAboveTouch(i, touchX, touchY)) {
        break;
      }
      if (nodeRegion.withinBounds(touchX, touchY)) {
        return nodeRegion;
      }
    }

    return null;
  }

  private void clip(int id, View view) {
    mClippedSubviews.put(id, view);
  }

  private void unclip(int id) {
    mClippedSubviews.remove(id);
  }

  private boolean isClipped(int id) {
    return mClippedSubviews.get(id) != null;
  }

  private boolean isNotClipped(int id) {
    return mClippedSubviews.get(id) == null;
  }

  @Override
  void onClippedViewDropped(View view) {
    unclip(view.getId());
    mFlatViewGroup.removeDetachedView(view);
  }

  @Override
  public void mountViews(ViewResolver viewResolver, int[] viewsToAdd, int[] viewsToDetach) {
    mClippingViewGroups.clear();
    for (int viewToAdd : viewsToAdd) {
      // Views that are just temporarily detached are marked with a negative value.
      boolean newView = viewToAdd > 0;
      if (!newView) {
        viewToAdd = -viewToAdd;
      }

      int commandArrayIndex = mDrawViewIndexMap.get(viewToAdd);
      DrawView drawView = (DrawView) mDrawCommands[commandArrayIndex];
      View view = viewResolver.getView(drawView.reactTag);
      ensureViewHasNoParent(view);

      // these views need to support recursive clipping of subviews
      if (view instanceof ReactClippingViewGroup &&
          ((ReactClippingViewGroup) view).getRemoveClippedSubviews()) {
        mClippingViewGroups.add((ReactClippingViewGroup) view);
      }

      if (newView) {
        // This view was not previously attached to this parent.
        drawView.mWasMounted = true;
        if (animating(view) || withinBounds(commandArrayIndex)) {
          // View should be drawn.  This view can't currently be clipped because it wasn't
          // previously attached to this parent.
          mFlatViewGroup.addViewInLayout(view);
        } else {
          clip(drawView.reactTag, view);
        }
      } else {
        // This view was previously attached, and just temporarily detached.
        if (drawView.mWasMounted) {
          // The DrawView has been mounted before.
          if (isNotClipped(drawView.reactTag)) {
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
          if (animating(view) || withinBounds(commandArrayIndex)) {
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
            if (isNotClipped(drawView.reactTag)) {
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

  /**
   * Returns true if a view is currently animating.
   */
  private static boolean animating(View view) {
    Animation animation = view.getAnimation();
    return animation != null && !animation.hasEnded();
  }

  /**
   * Returns true if a command index is currently onscreen.
   */
  private boolean withinBounds(int i) {
    return mStart <= i && i < mStop;
  }

  @Override
  public boolean updateClippingRect() {
    ReactClippingViewGroupHelper.calculateClippingRect(mFlatViewGroup, mClippingRect);
    if (mFlatViewGroup.getParent() == null || mClippingRect.top == mClippingRect.bottom) {
      // If we are unparented or are clipping to an empty rect, no op.  Return false so we don't
      // invalidate.
      return false;
    }

    int start = commandStartIndex();
    int stop = commandStopIndex(start);
    if (mStart <= start && stop <= mStop) {
      // We would only be removing children, don't invalidate and don't bother changing the
      // attached children.
      updateClippingRecursively();
      return false;
    }

    mStart = start;
    mStop = stop;

    updateClippingToCurrentRect();
    updateClippingRecursively();
    return true;
  }

  private void updateClippingRecursively() {
    for (int i = 0, children = mClippingViewGroups.size(); i < children; i++) {
      ReactClippingViewGroup view = mClippingViewGroups.get(i);
      if (isNotClipped(((View) view).getId())) {
        view.updateClippingRect();
      }
    }
  }

  /**
   * Used either after we have updated the current rect, or when we have mounted new commands and
   * the rect hasn't changed.  Updates the clipping after mStart and mStop have been set to the
   * correct values.  For draw commands, this is all it takes to update the command mounting, as
   * draw commands are only attached in a conceptual sense, and don't rely on the android view
   * hierarchy.
   *
   * For native children, we have to walk through our current views and remove any that are no
   * longer on screen, and add those that are newly on screen.  As an optimization for fling, if we
   * are removing two or more native views we instead detachAllViews from the {@link FlatViewGroup}
   * and re-attach or add as needed.
   *
   * This approximation is roughly correct, as we tend to add and remove the same amount of views,
   * and each add and remove pair is O(n); detachAllViews and re-attach requires two passes, so
   * using this once we are removing more than two native views is a good breakpoint.
   */
  private void updateClippingToCurrentRect() {
    for (int i = 0, size = mFlatViewGroup.getChildCount(); i < size; i++) {
      View view = mFlatViewGroup.getChildAt(i);
      int index = mDrawViewIndexMap.get(view.getId());
      if (withinBounds(index) || animating(view)) {
        mViewsToKeep.add(view);
      } else {
        mViewsToRemove.append(i, view);
        clip(view.getId(), view);
      }
    }

    int removeSize = mViewsToRemove.size();
    boolean removeAll = removeSize > 2;

    if (removeAll) {
      // Detach all, as we are changing quite a few views, whether flinging or otherwise.
      mFlatViewGroup.detachAllViewsFromParent();

      for (int i = 0; i < removeSize; i++) {
        mFlatViewGroup.removeDetachedView(mViewsToRemove.valueAt(i));
      }
    } else {
      // Simple clipping sweep, as we are changing relatively few views.
      while (removeSize-- > 0) {
        mFlatViewGroup.removeViewsInLayout(mViewsToRemove.keyAt(removeSize), 1);
      }
    }
    mViewsToRemove.clear();

    int current = mStart;
    int childIndex = 0;

    for (int i = 0, size = mViewsToKeep.size(); i < size; i++) {
      View view = mViewsToKeep.get(i);
      int commandIndex = mDrawViewIndexMap.get(view.getId());
      if (current <= commandIndex) {
        while (current != commandIndex) {
          if (mDrawCommands[current] instanceof DrawView) {
            DrawView drawView = (DrawView) mDrawCommands[current];
            mFlatViewGroup.addViewInLayout(
                Assertions.assumeNotNull(mClippedSubviews.get(drawView.reactTag)),
                childIndex++);
            unclip(drawView.reactTag);
          }
          current++;
        }
        // We are currently at the command index, but we want to increment beyond it.
        current++;
      }
      if (removeAll) {
        mFlatViewGroup.attachViewToParent(view, childIndex);
      }
      // We want to make sure we increment the child index even if we didn't detach it to maintain
      // order.
      childIndex++;
    }
    mViewsToKeep.clear();

    while (current < mStop) {
      if (mDrawCommands[current] instanceof DrawView) {
        DrawView drawView = (DrawView) mDrawCommands[current];
        mFlatViewGroup.addViewInLayout(
            Assertions.assumeNotNull(mClippedSubviews.get(drawView.reactTag)),
            childIndex++);
        unclip(drawView.reactTag);
      }
      current++;
    }
  }

  @Override
  public void getClippingRect(Rect outClippingRect) {
    outClippingRect.set(mClippingRect);
  }

  @Override
  public SparseArray<View> getDetachedViews() {
    return mClippedSubviews;
  }

  /**
   * Draws the unclipped commands on the given canvas.  This would be much simpler if we didn't
   * have to worry about animating views, as we could simply:
   *
   *   for (int i = start; i < stop; i++) {
   *     drawCommands[i].draw(...);
   *   }
   *
   * This is complicated however by animating views, which may occur before or after the current
   * clipping rect.  Consider the following array:
   *
   *   +--------------+
   *   |  DrawView    | 0
   *   | *animating*  |
   *   +--------------+
   *   | DrawCommmand | 1
   *   |  *clipped*   |
   *   +--------------+
   *   | DrawCommand  | 2 start
   *   |              |
   *   +--------------+
   *   | DrawCommand  | 3
   *   |              |
   *   +--------------+
   *   |  DrawView    | 4
   *   |              |
   *   +--------------+
   *   |  DrawView    | 5 stop
   *   |  *clipped*   |
   *   +--------------+
   *   |  DrawView    | 6
   *   | *animating*  |
   *   +--------------+
   *
   * 2, 3, and 4 are onscreen according to bounds, while 0 and 6 are onscreen according to
   * animation.  We have to walk through the attached children making sure to draw any draw
   * commands that should be drawn before that draw view, as well as making sure not to draw any
   * draw commands that are out of bounds.
   *
   * @param canvas The canvas to draw on.
   */
  @Override
  public void draw(Canvas canvas) {
    int commandIndex = mStart;
    int size = mFlatViewGroup.getChildCount();

    // Iterate through the children, making sure that we draw any draw commands we haven't drawn
    // that should happen before the next draw view.
    for (int i = 0; i < size; i++) {
      // This is the command index of the next view that we need to draw.  Since a view might be
      // animating, this view is either before all the commands onscreen, onscreen, or after the
      // onscreen commands.
      int viewIndex = mDrawViewIndexMap.get(mFlatViewGroup.getChildAt(i).getId());
      if (mStop < viewIndex) {
        // The current view is outside of the viewport bounds.  We want to draw all the commands
        // up to the stop, then draw all the views outside the viewport bounds.
        while (commandIndex < mStop) {
          mDrawCommands[commandIndex++].draw(mFlatViewGroup, canvas);
        }
        // We are now out of commands to draw, so we could just draw the remaining attached
        // children, but the for loop logic will draw the rest anyway.
      } else if (commandIndex <= viewIndex) {
        // The viewIndex is within our onscreen bounds (or == stop).  We want to draw all the
        // commands from the current position to the current view, inclusive.
        while (commandIndex < viewIndex) {
          mDrawCommands[commandIndex++].draw(mFlatViewGroup, canvas);
        }
        // Command index now == viewIndex, so increment beyond it.
        commandIndex++;
      }
      mDrawCommands[viewIndex].draw(mFlatViewGroup, canvas);
    }

    // If we get here, it means we have drawn all the views, now just draw the remaining draw
    // commands.
    while (commandIndex < mStop) {
      DrawCommand command = mDrawCommands[commandIndex++];
      if (command instanceof DrawView) {
        // We should never have more DrawView commands at this point. But in case we do, fail safely
        // by ignoring the DrawView command
        FLog.w(
            TAG,
            "Unexpected DrawView command at index " + (commandIndex-1) + " with mStop=" +
              mStop + ". " + Arrays.toString(mDrawCommands));
        continue;
      }
      command.draw(mFlatViewGroup, canvas);
    }
  }

  @Override
  void debugDraw(Canvas canvas) {
    // Draws clipped draw commands, but does not draw clipped views.
    for (DrawCommand drawCommand : mDrawCommands) {
      if (drawCommand instanceof DrawView) {
        if (isNotClipped(((DrawView) drawCommand).reactTag)) {
          drawCommand.debugDraw(mFlatViewGroup, canvas);
        }
        // else, don't draw, and don't increment index
      } else {
        drawCommand.debugDraw(mFlatViewGroup, canvas);
      }
    }
  }
}
