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

import android.graphics.Rect;
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

  private static final Rect mVisibleRect = new Rect();
  private static final int[] mViewLocationInScreen = {0, 0};

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
    View nativeTargetView = findTouchTargetView(eventX, eventY, viewGroup);
    if (nativeTargetView != null) {
      View reactTargetView = findClosestReactAncestor(nativeTargetView);
      if (reactTargetView != null) {
        targetTag = getTouchTargetForView(reactTargetView, eventX, eventY);
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
   * NB: This method is not thread-safe as it uses static instance of {@link Rect}
   */
  private static View findTouchTargetView(float eventX, float eventY, ViewGroup viewGroup) {
    int childrenCount = viewGroup.getChildCount();
    for (int i = childrenCount - 1; i >= 0; i--) {
      View child = viewGroup.getChildAt(i);
      // Views with `removeClippedSubviews` are exposing removed subviews through `getChildAt` to
      // support proper view cleanup. Views removed by this option will be detached from it's
      // parent, therefore `getGlobalVisibleRect` call will return bogus result as it treat view
      // with no parent as a root of the view hierarchy. To prevent this from happening we check
      // that view has a parent before visiting it.
      if (child.getParent() != null && isTouchPointInView(eventX, eventY, viewGroup, child)) {
        // Apply offset to event coordinates to transform them into the coordinate space of the
        // child view, taken from {@link ViewGroup#dispatchTransformedTouchEvent()}.
        eventX += viewGroup.getScrollX() - child.getLeft();
        eventY += viewGroup.getScrollY() - child.getTop();
        View targetView = findTouchTargetViewWithPointerEvents(eventX, eventY, child);
        if (targetView != null) {
          return targetView;
        }
      }
    }
    return viewGroup;
}

  // Taken from {@link ViewGroup#isTransformedTouchPointInView()}
  private static boolean isTouchPointInView(float x, float y, ViewGroup parent, View child) {
    float localX = x + parent.getScrollX() - child.getLeft();
    float localY = y + parent.getScrollY() - child.getTop();
    // Taken from {@link View#pointInView()}.
    return localX >= 0 && localX < (child.getRight() - child.getLeft())
        && localY >= 0 && localY < (child.getBottom() - child.getTop());
  }

  /**
   * Returns the touch target View of the event given, or null if neither the given View nor any of
   * its descendants are the touch target.
   */
  private static @Nullable View findTouchTargetViewWithPointerEvents(
      float eventX,
      float eventY,
      View view) {
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
        View targetView = findTouchTargetView(eventX, eventY, (ViewGroup) view);
        return targetView != view ? targetView : null;
      }
      return null;

    } else if (pointerEvents == PointerEvents.AUTO) {
      // Either this view or one of its children is the target
      if (view instanceof ViewGroup) {
        return findTouchTargetView(eventX, eventY, (ViewGroup) view);
      }
      return view;

    } else {
      throw new JSApplicationIllegalArgumentException(
          "Unknown pointer event type: " + pointerEvents.toString());
    }
  }

  private static int getTouchTargetForView(View targetView, float eventX, float eventY) {
    if (targetView instanceof ReactCompoundView) {
      // Use coordinates relative to the view. Use getLocationOnScreen() API, which is slightly more
      // expensive than getGlobalVisibleRect(), otherwise partially visible views offset is wrong.
      targetView.getLocationOnScreen(mViewLocationInScreen);
      return ((ReactCompoundView) targetView).reactTagForTouch(
          eventX - mViewLocationInScreen[0],
          eventY - mViewLocationInScreen[1]);
    }
    return targetView.getId();
  }

}
