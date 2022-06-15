/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;

import android.annotation.SuppressLint;
import android.graphics.Matrix;
import android.graphics.PointF;
import android.graphics.Rect;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.touch.ReactHitSlopView;
import com.facebook.react.uimanager.common.ViewUtil;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;

/**
 * Class responsible for identifying which react view should handle a given {@link MotionEvent}. It
 * uses the event coordinates to traverse the view hierarchy and return a suitable view.
 */
public class TouchTargetHelper {

  private static final float[] mEventCoords = new float[2];
  private static final PointF mTempPoint = new PointF();
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
    View nativeTargetView = findTouchTargetViewWithPointerEvents(viewCoords, viewGroup, null);
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

  /**
   * Find touch event target view within the provided container given the coordinates provided via
   * {@link MotionEvent}.
   *
   * @param eventX the X screen coordinate of the touch location
   * @param eventY the Y screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @param viewCoords an out parameter that will return the X,Y value in the target view
   * @return If a target was found, returns a {@link Lis<ViewTarget>} containing the path through
   *     the view tree of all react tags and views that are a container for the touch target,
   *     ordered from target to root (last element)
   */
  @SuppressLint("ResourceType")
  public static List<ViewTarget> findTargetPathAndCoordinatesForTouch(
      float eventX, float eventY, ViewGroup viewGroup, float[] viewCoords) {
    UiThreadUtil.assertOnUiThread();

    // Store eventCoords in array so that they are modified to be relative to the targetView found.
    viewCoords[0] = eventX;
    viewCoords[1] = eventY;

    List<ViewTarget> pathAccumulator = new ArrayList<>();
    View targetView = findTouchTargetViewWithPointerEvents(viewCoords, viewGroup, pathAccumulator);

    if (targetView != null) {
      View reactTargetView = targetView;
      int firstReactAncestor = 0;
      // Same logic as findClosestReactAncestor but also track the index
      while (reactTargetView != null && reactTargetView.getId() <= 0) {
        reactTargetView = (View) reactTargetView.getParent();
        firstReactAncestor++;
      }

      if (firstReactAncestor > 0) {
        // Drop non-React views from the path trace
        pathAccumulator = pathAccumulator.subList(firstReactAncestor, pathAccumulator.size());
      }

      int targetTag = getTouchTargetForView(reactTargetView, eventX, eventY);
      if (targetTag != reactTargetView.getId()) {
        pathAccumulator.add(0, new ViewTarget(targetTag, (View) null));
      }
    }

    return pathAccumulator;
  }

  @SuppressLint("ResourceType")
  private static View findClosestReactAncestor(View view) {
    while (view != null && view.getId() <= 0) {
      view = (View) view.getParent();
    }
    return view;
  }

  /** Types of allowed return values from {@link #findTouchTargetView}. */
  private enum TouchTargetReturnType {
    /** Allow returning the view passed in through the parameters. */
    SELF,
    /** Allow returning children of the view passed in through parameters. */
    CHILD,
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
  private static View findTouchTargetView(
      float[] eventCoords,
      View view,
      EnumSet<TouchTargetReturnType> allowReturnTouchTargetTypes,
      List<ViewTarget> pathAccumulator) {
    // We prefer returning a child, so we check for a child that can handle the touch first
    if (allowReturnTouchTargetTypes.contains(TouchTargetReturnType.CHILD)
        && view instanceof ViewGroup) {
      ViewGroup viewGroup = (ViewGroup) view;
      if (!isTouchPointInView(eventCoords[0], eventCoords[1], view)) {
        // We don't allow touches on views that are outside the bounds of an `overflow: hidden` and
        // `overflow: scroll` View.
        if (view instanceof ReactOverflowViewWithInset) {
          // If the touch point is outside of the overflowinset for the view, we can safely ignore
          // it.
          if (ViewUtil.getUIManagerType(view.getId()) == FABRIC
              && ReactFeatureFlags.useOverflowInset
              && !isTouchPointInViewWithOverflowInset(eventCoords[0], eventCoords[1], view)) {
            return null;
          }

          @Nullable String overflow = ((ReactOverflowViewWithInset) view).getOverflow();
          if (ViewProps.HIDDEN.equals(overflow) || ViewProps.SCROLL.equals(overflow)) {
            return null;
          }
        }

        // We don't allow touches on views that are outside the bounds and has clipChildren set to
        // true.
        if (viewGroup.getClipChildren()) {
          return null;
        }
      }

      int childrenCount = viewGroup.getChildCount();
      // Consider z-index when determining the touch target.
      ReactZIndexedViewGroup zIndexedViewGroup =
          viewGroup instanceof ReactZIndexedViewGroup ? (ReactZIndexedViewGroup) viewGroup : null;
      for (int i = childrenCount - 1; i >= 0; i--) {
        int childIndex =
            zIndexedViewGroup != null ? zIndexedViewGroup.getZIndexMappedChildIndex(i) : i;
        View child = viewGroup.getChildAt(childIndex);
        PointF childPoint = mTempPoint;
        getChildPoint(eventCoords[0], eventCoords[1], viewGroup, child, childPoint);
        // The childPoint value will contain the view coordinates relative to the child.
        // We need to store the existing X,Y for the viewGroup away as it is possible this child
        // will not actually be the target and so we restore them if not
        float restoreX = eventCoords[0];
        float restoreY = eventCoords[1];
        eventCoords[0] = childPoint.x;
        eventCoords[1] = childPoint.y;
        View targetView = findTouchTargetViewWithPointerEvents(eventCoords, child, pathAccumulator);
        if (targetView != null) {
          return targetView;
        }
        eventCoords[0] = restoreX;
        eventCoords[1] = restoreY;
      }
    }

    // Check if parent can handle the touch after the children
    if (allowReturnTouchTargetTypes.contains(TouchTargetReturnType.SELF)
        && isTouchPointInView(eventCoords[0], eventCoords[1], view)) {
      return view;
    }

    return null;
  }

  /**
   * Checks whether a touch at {@code x} and {@code y} are within the bounds of the View. Both
   * {@code x} and {@code y} must be relative to the top-left corner of the view.
   */
  private static boolean isTouchPointInView(float x, float y, View view) {
    if (view instanceof ReactHitSlopView && ((ReactHitSlopView) view).getHitSlopRect() != null) {
      Rect hitSlopRect = ((ReactHitSlopView) view).getHitSlopRect();
      if ((x >= -hitSlopRect.left && x < (view.getWidth()) + hitSlopRect.right)
          && (y >= -hitSlopRect.top && y < (view.getHeight()) + hitSlopRect.bottom)) {
        return true;
      }

      return false;
    } else {
      if ((x >= 0 && x < (view.getWidth())) && (y >= 0 && y < (view.getHeight()))) {
        return true;
      }

      return false;
    }
  }

  private static boolean isTouchPointInViewWithOverflowInset(float x, float y, View view) {
    if (!(view instanceof ReactOverflowViewWithInset)) {
      return false;
    }

    final Rect overflowInset = ((ReactOverflowViewWithInset) view).getOverflowInset();
    return (x >= overflowInset.left && x < view.getWidth() - overflowInset.right)
        && (y >= overflowInset.top && y < view.getHeight() - overflowInset.bottom);
  }

  /**
   * Returns the coordinates of a touch in the child View. It is transform aware and will invert the
   * transform Matrix to find the true local points This code is taken from {@link
   * ViewGroup#isTransformedTouchPointInView()}
   */
  private static void getChildPoint(
      float x, float y, ViewGroup parent, View child, PointF outLocalPoint) {
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
    outLocalPoint.set(localX, localY);
  }

  /**
   * Returns the touch target View of the event given, or null if neither the given View nor any of
   * its descendants are the touch target.
   */
  private static @Nullable View findTouchTargetViewWithPointerEvents(
      float eventCoords[], View view, @Nullable List<ViewTarget> pathAccumulator) {
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
      // This view may be the target, its children don't matter
      View targetView =
          findTouchTargetView(
              eventCoords, view, EnumSet.of(TouchTargetReturnType.SELF), pathAccumulator);
      if (targetView != null && pathAccumulator != null) {
        pathAccumulator.add(new ViewTarget(view.getId(), view));
      }
      return targetView;

    } else if (pointerEvents == PointerEvents.BOX_NONE) {
      // This view can't be the target, but its children might.
      View targetView =
          findTouchTargetView(
              eventCoords, view, EnumSet.of(TouchTargetReturnType.CHILD), pathAccumulator);
      if (targetView != null) {
        if (pathAccumulator != null) {
          pathAccumulator.add(new ViewTarget(view.getId(), view));
        }
        return targetView;
      }

      // PointerEvents.BOX_NONE means that this react element cannot receive pointer events.
      // However, there might be virtual children that can receive pointer events, in which case
      // we still want to return this View and dispatch a pointer event to the virtual element.
      // Note that this currently only applies to Nodes/FlatViewGroup as it's the only class that
      // is both a ViewGroup and ReactCompoundView (ReactTextView is a ReactCompoundView but not a
      // ViewGroup).
      if (view instanceof ReactCompoundView
          && isTouchPointInView(eventCoords[0], eventCoords[1], view)) {
        int reactTag = ((ReactCompoundView) view).reactTagForTouch(eventCoords[0], eventCoords[1]);
        // make sure we exclude the View itself because of the PointerEvents.BOX_NONE
        if (reactTag != view.getId()) {
          if (pathAccumulator != null) {
            pathAccumulator.add(new ViewTarget(view.getId(), view));
          }
          return view;
        }
      }

      return null;

    } else if (pointerEvents == PointerEvents.AUTO) {
      // Either this view or one of its children is the target
      if (view instanceof ReactCompoundViewGroup
          && isTouchPointInView(eventCoords[0], eventCoords[1], view)
          && ((ReactCompoundViewGroup) view).interceptsTouchEvent(eventCoords[0], eventCoords[1])) {
        if (pathAccumulator != null) {
          pathAccumulator.add(new ViewTarget(view.getId(), view));
        }
        return view;
      }

      View result =
          findTouchTargetView(
              eventCoords,
              view,
              EnumSet.of(TouchTargetReturnType.SELF, TouchTargetReturnType.CHILD),
              pathAccumulator);
      if (result != null && pathAccumulator != null) {
        pathAccumulator.add(new ViewTarget(view.getId(), view));
      }
      return result;

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

  public static class ViewTarget {
    private final int mViewId;
    private final @Nullable View mView;

    private ViewTarget(int viewId, @Nullable View view) {
      mViewId = viewId;
      mView = view;
    }

    public int getViewId() {
      return mViewId;
    }

    @Nullable
    public View getView() {
      return mView;
    }

    @Override
    public boolean equals(Object o) {
      // If the object is compared with itself then return true
      if (o == this) {
        return true;
      }

      // Check if o is an instance of ViewTarget. Note that "null instanceof ViewTarget" also
      // returns false.
      if (!(o instanceof ViewTarget)) {
        return false;
      }

      ViewTarget other = (ViewTarget) o;
      // We only need to compare view id, as we assume the same view id will always map to the same
      // view. TargetView is not mutable so this should be safe.
      return other.getViewId() == mViewId;
    }

    @Override
    public int hashCode() {
      return Objects.hashCode(mViewId);
    }
  }
}
