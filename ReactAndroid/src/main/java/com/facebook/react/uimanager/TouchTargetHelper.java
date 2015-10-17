/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import javax.annotation.Nullable;

import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.UiThreadUtil;

/**
 * Class responsible for identifying which react view should handle a given {@link MotionEvent}.
 * It uses the event coordinates to traverse the view hierarchy and return a suitable view.
 */
public class TouchTargetHelper {

  private static final float[] mEventCoords = new float[2];

  /**
   * Find touch event target view within the provided container given the coordinates provided
   * via {@link MotionEvent}.
   *
   * @param eventY the Y screen coordinate of the touch location
   * @param eventX the X screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @return the react tag ID of the child view that should handle the event
   */
  public static int findTargetTagForTouch(
      float eventY,
      float eventX,
      ViewGroup viewGroup) {
    UiThreadUtil.assertOnUiThread();
    int targetTag = viewGroup.getId();
    // Store eventCoords in array so that they are modified to be relative to the targetView found.
    float[] eventCoords = mEventCoords;
    eventCoords[0] = eventY;
    eventCoords[1] = eventX;
    View nativeTargetView = findTouchTargetView(eventCoords, viewGroup);
    if (nativeTargetView != null) {
      View reactTargetView = findClosestReactAncestor(nativeTargetView);
      if (reactTargetView != null) {
        targetTag = getTouchTargetForView(reactTargetView, eventCoords[0], eventCoords[1]);
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
   * Returns the touch target View that is either viewGroup or one if its descendants.
   * This is a recursive DFS since view the entire tree must be parsed until the target is found.
   * If the search does not backtrack, it is possible to follow a branch that cannot be a target
   * (because of pointerEvents). For example, if both C and E can be the target of an event:
   * A (pointerEvents: auto) - B (pointerEvents: box-none) - C (pointerEvents: none)
   *  \ D (pointerEvents: auto)  - E (pointerEvents: auto)
   * If the search goes down the first branch, it would return A as the target, which is incorrect.
   * NB: This modifies the eventCoords to always be relative to the current viewGroup. When the
   * method returns, it will contain the eventCoords relative to the targetView found.
   */
  private static View findTouchTargetView(float[] eventCoords, ViewGroup viewGroup) {
    int childrenCount = viewGroup.getChildCount();
    for (int i = childrenCount - 1; i >= 0; i--) {
      View child = viewGroup.getChildAt(i);
      if (isTouchPointInView(eventCoords[0], eventCoords[1], viewGroup, child)) {
        // Apply offset to event coordinates to transform them into the coordinate space of the
        // child view, taken from {@link ViewGroup#dispatchTransformedTouchEvent()}.
        eventCoords[0] += viewGroup.getScrollY() - child.getTop();
        eventCoords[1] += viewGroup.getScrollX() - child.getLeft();
        View targetView = findTouchTargetViewWithPointerEvents(eventCoords, child);
        if (targetView != null) {
          return targetView;
        }
        eventCoords[0] -= viewGroup.getScrollY() - child.getTop();
        eventCoords[1] -= viewGroup.getScrollX() - child.getLeft();
      }
    }
    return viewGroup;
}

  // Taken from {@link ViewGroup#isTransformedTouchPointInView()}
  private static boolean isTouchPointInView(float y, float x, ViewGroup parent, View child) {
    float localY = y + parent.getScrollY() - child.getTop();
    float localX = x + parent.getScrollX() - child.getLeft();
    // Taken from {@link View#pointInView()}.
    return localY >= 0 && localY < (child.getBottom() - child.getTop())
        && localX >= 0 && localX < (child.getRight() - child.getLeft());
  }

  /**
   * Returns the touch target View of the event given, or null if neither the given View nor any of
   * its descendants are the touch target.
   */
  private static @Nullable View findTouchTargetViewWithPointerEvents(
      float eventCoords[], View view) {
    PointerEvents pointerEvents = view instanceof ReactPointerEventsView ?
        ((ReactPointerEventsView) view).getPointerEvents() : PointerEvents.AUTO;
    if (pointerEvents == PointerEvents.NONE) {
      // This view and its children can't be the target
      return null;

    } else if (pointerEvents == PointerEvents.BOX_ONLY) {
      // This view is the target, its children don't matter
      return view;

    } else if (pointerEvents == PointerEvents.BOX_NONE) {
      // This view can't be the target, but its children might
      if (view instanceof ViewGroup) {
        View targetView = findTouchTargetView(eventCoords, (ViewGroup) view);
        return targetView != view ? targetView : null;
      }
      return null;

    } else if (pointerEvents == PointerEvents.AUTO) {
      // Either this view or one of its children is the target
      if (view instanceof ViewGroup) {
        return findTouchTargetView(eventCoords, (ViewGroup) view);
      }
      return view;

    } else {
      throw new JSApplicationIllegalArgumentException(
          "Unknown pointer event type: " + pointerEvents.toString());
    }
  }

  private static int getTouchTargetForView(View targetView, float eventY, float eventX) {
    if (targetView instanceof ReactCompoundView) {
      // Use coordinates relative to the view, which have been already computed by
      // {@link #findTouchTargetView()}.
      return ((ReactCompoundView) targetView).reactTagForTouch(eventX, eventY);
    }
    return targetView.getId();
  }

}
