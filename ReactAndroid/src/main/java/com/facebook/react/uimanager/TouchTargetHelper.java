/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.graphics.Matrix;
import android.graphics.Rect;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.touch.ReactHitSlopView;

/**
 * Class responsible for identifying which react view should handle a given {@link MotionEvent}. It
 * uses the event coordinates to traverse the view hierarchy and return a suitable view.
 */
public class TouchTargetHelper {

  private static final float[] mEventCoords = new float[2];
  private static final TouchTestResult mTouchTestData = new TouchTestResult();
  private static final float[] mMatrixTransformCoords = new float[2];
  private static final Matrix mInverseMatrix = new Matrix();

  /**
   * Find touch event target view within the provided container given the coordinates provided via
   * {@link MotionEvent}.
   *
   * @param eventX the X screen coordinate of the touch location
   * @param eventY the Y screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @return the react tag ID of the child view that should handle the event
   */
  public static int findTargetTagForTouch(float eventX, float eventY, ViewGroup viewGroup) {
    return findTargetTagAndCoordinatesForTouch(eventX, eventY, viewGroup, mEventCoords, null);
  }

  /**
   * Find touch event target view within the provided container given the coordinates provided via
   * {@link MotionEvent}.
   *
   * @param eventX the X screen coordinate of the touch location
   * @param eventY the Y screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @param nativeViewId the native react view containing this touch target
   * @return the react tag ID of the child view that should handle the event
   */
  public static int findTargetTagForTouch(
      float eventX, float eventY, ViewGroup viewGroup, @Nullable int[] nativeViewId) {
    return findTargetTagAndCoordinatesForTouch(
        eventX, eventY, viewGroup, mEventCoords, nativeViewId);
  }

  /**
   * Find touch event target view within the provided container given the coordinates provided via
   * {@link MotionEvent}.
   *
   * @param eventX the X screen coordinate of the touch location
   * @param eventY the Y screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @param viewCoords an out parameter that will return the X,Y value in the target view
   * @param nativeViewTag an out parameter that will return the native view id
   * @return the react tag ID of the child view that should handle the event
   */
  public static int findTargetTagAndCoordinatesForTouch(
      float eventX,
      float eventY,
      ViewGroup viewGroup,
      float[] viewCoords,
      @Nullable int[] nativeViewTag) {
    UiThreadUtil.assertOnUiThread();
    int targetTag = viewGroup.getId();
    // Store eventCoords in array so that they are modified to be relative to the targetView found.
    viewCoords[0] = eventX;
    viewCoords[1] = eventY;
    View nativeTargetView = findTouchTargetView(viewCoords, viewGroup);
    if (nativeTargetView != null) {
      View reactTargetView = findClosestReactAncestor(nativeTargetView);
      if (reactTargetView != null) {
        if (nativeViewTag != null) {
          nativeViewTag[0] = reactTargetView.getId();
        }
        targetTag = getTouchTargetForView(reactTargetView, viewCoords[0], viewCoords[1]);
      }
    }
    return targetTag;
  }

  private static View findClosestReactAncestor(View view) {
    while (view != null && view.getId() <= 0) {
      view = (View) view.getParent();
    }
    return view;
  }

  /**
   * Returns the touch target View that is either viewGroup or one if its descendants. This is a
   * recursive DFS since view the entire tree must be parsed until the target is found. If the
   * search does not backtrack, it is possible to follow a branch that cannot be a target (because
   * of pointerEvents). For example, if both C and E can be the target of an event: A
   * (pointerEvents: auto) - B (pointerEvents: box-none) - C (pointerEvents: none) \ D
   * (pointerEvents: auto) - E (pointerEvents: auto) If the search goes down the first branch, it
   * would return A as the target, which is incorrect. NB: This modifies the eventCoords to always
   * be relative to the current viewGroup. When the method returns, it will contain the eventCoords
   * relative to the targetView found.
   */
  private static View findTouchTargetView(float[] eventCoords, ViewGroup viewGroup) {
    int childrenCount = viewGroup.getChildCount();
    // Consider z-index when determining the touch target.
    ReactZIndexedViewGroup zIndexedViewGroup =
            viewGroup instanceof ReactZIndexedViewGroup ? (ReactZIndexedViewGroup) viewGroup : null;

    for (int i = childrenCount - 1; i >= 0; i--) {
      int childIndex =
          zIndexedViewGroup != null ? zIndexedViewGroup.getZIndexMappedChildIndex(i) : i;
      View child = viewGroup.getChildAt(childIndex);
      TouchTestResult touchTestData = mTouchTestData;

      if (isTransformedTouchPointInView(
          eventCoords[0], eventCoords[1], viewGroup, child, touchTestData)) {
        // If it is contained within the child View, the childPoint value will contain the view
        // coordinates relative to the child
        // We need to store the existing X,Y for the viewGroup away as it is possible this child
        // will not actually be the target and so we restore them if not
        float restoreX = eventCoords[0];
        float restoreY = eventCoords[1];
        eventCoords[0] = touchTestData.x;
        eventCoords[1] = touchTestData.y;
        View targetView = findTouchTargetViewWithPointerEvents(eventCoords, child, touchTestData.hittest);
        if (targetView != null) {
          return targetView;
        }
        eventCoords[0] = restoreX;
        eventCoords[1] = restoreY;
      }
    }

    return isLocalCoordinateInView(eventCoords[0], eventCoords[1], viewGroup) ? viewGroup : null;
  }

  /**
   * Returns whether the touch point is within the child View It is transform aware and will invert
   * the transform Matrix to find the true local points
   */
  private static boolean isTransformedTouchPointInView(
          float x, float y, ViewGroup parent, View child,
          TouchTestResult outTestData) {
    float localX = x + parent.getScrollX() - child.getLeft();
    float localY = y + parent.getScrollY() - child.getTop();
    Matrix matrix = child.getMatrix();
    if (!matrix.isIdentity()) {
      float[] localXY = mMatrixTransformCoords;
      localXY[0] = localX;
      localXY[1] = localY;
      Matrix inverseMatrix = mInverseMatrix;
      matrix.invert(inverseMatrix);
      inverseMatrix.mapPoints(localXY);
      localX = localXY[0];
      localY = localXY[1];
    }

    boolean hittest = isLocalCoordinateInView(localX, localY, child);

    String overflow = child instanceof ReactClippingViewGroup
      ? ((ReactClippingViewGroup) child).getOverflow()
      : null;

    if (hittest || (overflow == null || overflow.equals(ViewProps.VISIBLE))) {
      outTestData.set(localX, localY, hittest);
      return true;
    }

    return false;
  }

  private static boolean isLocalCoordinateInView(
          float x, float y, View view) {
    if (view instanceof ReactHitSlopView && ((ReactHitSlopView) view).getHitSlopRect() != null) {
      Rect hitSlopRect = ((ReactHitSlopView) view).getHitSlopRect();
      return (x >= -hitSlopRect.left
              && x < (view.getRight() - view.getLeft()) + hitSlopRect.right)
              && (y >= -hitSlopRect.top
              && y < (view.getBottom() - view.getTop()) + hitSlopRect.bottom);
    } else {
      return (x >= 0 && x < (view.getRight() - view.getLeft()))
              && (y >= 0 && y < (view.getBottom() - view.getTop()));
    }
  }

  /**
   * Returns the touch target View of the event given, or null if neither the given View nor any of
   * its descendants are the touch target.
   */
  private static @Nullable View findTouchTargetViewWithPointerEvents(
      float eventCoords[], View view, boolean hittest) {
    PointerEvents pointerEvents =
        view instanceof ReactPointerEventsView
            ? ((ReactPointerEventsView) view).getPointerEvents()
            : PointerEvents.AUTO;

    // Views that are disabled should never be the target of pointer events. However, their children
    // can be because some views (SwipeRefreshLayout) use enabled but still have children that can
    // be valid targets.
    if (!view.isEnabled()) {
      if (pointerEvents == PointerEvents.AUTO) {
        pointerEvents = PointerEvents.BOX_NONE;
      } else if (pointerEvents == PointerEvents.BOX_ONLY) {
        pointerEvents = PointerEvents.NONE;
      }
    }

    if (pointerEvents == PointerEvents.NONE) {
      // This view and its children can't be the target
      return null;

    } else if (pointerEvents == PointerEvents.BOX_ONLY) {
      // This view is the target, its children don't matter
      return hittest ? view : null;
    } else if (pointerEvents == PointerEvents.BOX_NONE) {
      // This view can't be the target, but its children might.
      if (view instanceof ViewGroup) {
        View targetView = findTouchTargetView(eventCoords, (ViewGroup) view);
        if (targetView != view) {
          return targetView;
        }

        // PointerEvents.BOX_NONE means that this react element cannot receive pointer events.
        // However, there might be virtual children that can receive pointer events, in which case
        // we still want to return this View and dispatch a pointer event to the virtual element.
        // Note that this currently only applies to Nodes/FlatViewGroup as it's the only class that
        // is both a ViewGroup and ReactCompoundView (ReactTextView is a ReactCompoundView but not a
        // ViewGroup).
        if (view instanceof ReactCompoundView && hittest) {
          int reactTag =
              ((ReactCompoundView) view).reactTagForTouch(eventCoords[0], eventCoords[1]);
          if (reactTag != view.getId()) {
            // make sure we exclude the View itself because of the PointerEvents.BOX_NONE
            return view;
          }
        }
      }
      return null;

    } else if (pointerEvents == PointerEvents.AUTO) {
      // Either this view or one of its children is the target
      if (view instanceof ReactCompoundViewGroup) {
        if (((ReactCompoundViewGroup) view).interceptsTouchEvent(eventCoords[0], eventCoords[1]) &&
                hittest) {
          return view;
        }
      }
      if (view instanceof ViewGroup) {
        return findTouchTargetView(eventCoords, (ViewGroup) view);
      }

      return hittest ? view : null;

    } else {
      throw new JSApplicationIllegalArgumentException(
          "Unknown pointer event type: " + pointerEvents.toString());
    }
  }

  private static int getTouchTargetForView(View targetView, float eventX, float eventY) {
    if (targetView instanceof ReactCompoundView) {
      // Use coordinates relative to the view, which have been already computed by
      // {@link #findTouchTargetView()}.
      return ((ReactCompoundView) targetView).reactTagForTouch(eventX, eventY);
    }
    return targetView.getId();
  }

  private static class TouchTestResult {
    TouchTestResult() {}

    public float x;
    public float y;
    public boolean hittest;

    /**
     * Set the point's x and y coordinates
     */
    public final void set(float x, float y, boolean hittest) {
      this.x = x;
      this.y = y;
      this.hittest = hittest;
    }
  }
}
