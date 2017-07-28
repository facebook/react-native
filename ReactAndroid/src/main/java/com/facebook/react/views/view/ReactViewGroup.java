/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.view;

import javax.annotation.Nullable;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.animation.Animation;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.touch.ReactHitSlopView;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.touch.OnInterceptTouchEventListener;
import com.facebook.react.uimanager.MeasureSpecAssertions;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactClippingViewGroup;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.ReactPointerEventsView;
import com.facebook.react.uimanager.ReactZIndexedViewGroup;
import com.facebook.react.uimanager.ViewGroupDrawingOrderHelper;

/**
 * Backing for a React View. Has support for borders, but since borders aren't common, lazy
 * initializes most of the storage needed for them.
 */
public class ReactViewGroup extends ViewGroup implements
    ReactInterceptingViewGroup, ReactClippingViewGroup, ReactPointerEventsView, ReactHitSlopView,
    ReactZIndexedViewGroup {

  private static final int ARRAY_CAPACITY_INCREMENT = 12;
  private static final int DEFAULT_BACKGROUND_COLOR = Color.TRANSPARENT;
  private static final LayoutParams sDefaultLayoutParam = new ViewGroup.LayoutParams(0, 0);
  /* should only be used in {@link #updateClippingToRect} */
  private static final Rect sHelperRect = new Rect();

  /**
   * This listener will be set for child views when removeClippedSubview property is enabled. When
   * children layout is updated, it will call {@link #updateSubviewClipStatus} to notify parent
   * view about that fact so that view can be attached/detached if necessary.
   *
   * TODO(7728005): Attach/detach views in batch - once per frame in case when multiple children
   * update their layout.
   */
  private static final class ChildrenLayoutChangeListener implements OnLayoutChangeListener {

    private final ReactViewGroup mParent;

    private ChildrenLayoutChangeListener(ReactViewGroup parent) {
      mParent = parent;
    }

    @Override
    public void onLayoutChange(
        View v,
        int left,
        int top,
        int right,
        int bottom,
        int oldLeft,
        int oldTop,
        int oldRight,
        int oldBottom) {
      if (mParent.getRemoveClippedSubviews()) {
        mParent.updateSubviewClipStatus(v);
      }
    }
  }

  // Following properties are here to support the option {@code removeClippedSubviews}. This is a
  // temporary optimization/hack that is mainly applicable to the large list of images. The way
  // it's implemented is that we store an additional array of children in view node. We selectively
  // remove some of the views (detach) from it while still storing them in that additional array.
  // We override all possible add methods for {@link ViewGroup} so that we can control this process
  // whenever the option is set. We also override {@link ViewGroup#getChildAt} and
  // {@link ViewGroup#getChildCount} so those methods may return views that are not attached.
  // This is risky but allows us to perform a correct cleanup in {@link NativeViewHierarchyManager}.
  private boolean mRemoveClippedSubviews = false;
  private @Nullable View[] mAllChildren = null;
  private int mAllChildrenCount;
  private @Nullable Rect mClippingRect;
  private @Nullable Rect mHitSlopRect;
  private PointerEvents mPointerEvents = PointerEvents.AUTO;
  private @Nullable ChildrenLayoutChangeListener mChildrenLayoutChangeListener;
  private @Nullable ReactViewBackgroundDrawable mReactBackgroundDrawable;
  private @Nullable OnInterceptTouchEventListener mOnInterceptTouchEventListener;
  private boolean mNeedsOffscreenAlphaCompositing = false;
  private final ViewGroupDrawingOrderHelper mDrawingOrderHelper;

  public ReactViewGroup(Context context) {
    super(context);

    mDrawingOrderHelper = new ViewGroupDrawingOrderHelper(this);
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec);

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec),
        MeasureSpec.getSize(heightMeasureSpec));
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    // No-op since UIManagerModule handles actually laying out children.
  }

  @Override
  public void requestLayout() {
    // No-op, terminate `requestLayout` here, UIManagerModule handles laying out children and
    // `layout` is called on all RN-managed views by `NativeViewHierarchyManager`
  }

  @Override
  public void setBackgroundColor(int color) {
    if (color == Color.TRANSPARENT && mReactBackgroundDrawable == null) {
      // don't do anything, no need to allocate ReactBackgroundDrawable for transparent background
    } else {
      getOrCreateReactViewBackground().setColor(color);
    }
  }

  @Override
  public void setBackground(Drawable drawable) {
    throw new UnsupportedOperationException(
        "This method is not supported for ReactViewGroup instances");
  }

  public void setTranslucentBackgroundDrawable(@Nullable Drawable background) {
    // it's required to call setBackground to null, as in some of the cases we may set new
    // background to be a layer drawable that contains a drawable that has been previously setup
    // as a background previously. This will not work correctly as the drawable callback logic is
    // messed up in AOSP
    super.setBackground(null);
    if (mReactBackgroundDrawable != null && background != null) {
      LayerDrawable layerDrawable =
          new LayerDrawable(new Drawable[] {mReactBackgroundDrawable, background});
      super.setBackground(layerDrawable);
    } else if (background != null) {
      super.setBackground(background);
    }
  }

  @Override
  public void setOnInterceptTouchEventListener(OnInterceptTouchEventListener listener) {
    mOnInterceptTouchEventListener = listener;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (mOnInterceptTouchEventListener != null &&
        mOnInterceptTouchEventListener.onInterceptTouchEvent(this, ev)) {
      return true;
    }
    // We intercept the touch event if the children are not supposed to receive it.
    if (mPointerEvents == PointerEvents.NONE || mPointerEvents == PointerEvents.BOX_ONLY) {
      return true;
    }
    return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    // We do not accept the touch event if this view is not supposed to receive it.
    if (mPointerEvents == PointerEvents.NONE || mPointerEvents == PointerEvents.BOX_NONE) {
      return false;
    }
    // The root view always assumes any view that was tapped wants the touch
    // and sends the event to JS as such.
    // We don't need to do bubbling in native (it's already happening in JS).
    // For an explanation of bubbling and capturing, see
    // http://javascript.info/tutorial/bubbling-and-capturing#capturing
    return true;
  }

  /**
   * We override this to allow developers to determine whether they need offscreen alpha compositing
   * or not. See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  @Override
  public boolean hasOverlappingRendering() {
    return mNeedsOffscreenAlphaCompositing;
  }

  /**
   * See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  public void setNeedsOffscreenAlphaCompositing(boolean needsOffscreenAlphaCompositing) {
    mNeedsOffscreenAlphaCompositing = needsOffscreenAlphaCompositing;
  }

  public void setBorderWidth(int position, float width) {
    getOrCreateReactViewBackground().setBorderWidth(position, width);
  }

  public void setBorderColor(int position, float rgb, float alpha) {
    getOrCreateReactViewBackground().setBorderColor(position, rgb, alpha);
  }

  public void setBorderRadius(float borderRadius) {
    getOrCreateReactViewBackground().setRadius(borderRadius);
  }

  public void setBorderRadius(float borderRadius, int position) {
    getOrCreateReactViewBackground().setRadius(borderRadius, position);
  }

  public void setBorderStyle(@Nullable String style) {
    getOrCreateReactViewBackground().setBorderStyle(style);
  }

  @Override
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    if (removeClippedSubviews == mRemoveClippedSubviews) {
      return;
    }
    mRemoveClippedSubviews = removeClippedSubviews;
    if (removeClippedSubviews) {
      mClippingRect = new Rect();
      ReactClippingViewGroupHelper.calculateClippingRect(this, mClippingRect);
      mAllChildrenCount = getChildCount();
      int initialSize = Math.max(12, mAllChildrenCount);
      mAllChildren = new View[initialSize];
      mChildrenLayoutChangeListener = new ChildrenLayoutChangeListener(this);
      for (int i = 0; i < mAllChildrenCount; i++) {
        View child = getChildAt(i);
        mAllChildren[i] = child;
        child.addOnLayoutChangeListener(mChildrenLayoutChangeListener);
      }
      updateClippingRect();
    } else {
      // Add all clipped views back, deallocate additional arrays, remove layoutChangeListener
      Assertions.assertNotNull(mClippingRect);
      Assertions.assertNotNull(mAllChildren);
      Assertions.assertNotNull(mChildrenLayoutChangeListener);
      for (int i = 0; i < mAllChildrenCount; i++) {
        mAllChildren[i].removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
      }
      getDrawingRect(mClippingRect);
      updateClippingToRect(mClippingRect);
      mAllChildren = null;
      mClippingRect = null;
      mAllChildrenCount = 0;
      mChildrenLayoutChangeListener = null;
    }
  }

  @Override
  public boolean getRemoveClippedSubviews() {
    return mRemoveClippedSubviews;
  }

  @Override
  public void getClippingRect(Rect outClippingRect) {
    outClippingRect.set(mClippingRect);
  }

  @Override
  public void updateClippingRect() {
    if (!mRemoveClippedSubviews) {
      return;
    }

    Assertions.assertNotNull(mClippingRect);
    Assertions.assertNotNull(mAllChildren);

    ReactClippingViewGroupHelper.calculateClippingRect(this, mClippingRect);
    updateClippingToRect(mClippingRect);
  }

  private void updateClippingToRect(Rect clippingRect) {
    Assertions.assertNotNull(mAllChildren);
    int clippedSoFar = 0;
    for (int i = 0; i < mAllChildrenCount; i++) {
      updateSubviewClipStatus(clippingRect, i, clippedSoFar);
      if (mAllChildren[i].getParent() == null) {
        clippedSoFar++;
      }
    }
  }

  private void updateSubviewClipStatus(Rect clippingRect, int idx, int clippedSoFar) {
    View child = Assertions.assertNotNull(mAllChildren)[idx];
    sHelperRect.set(child.getLeft(), child.getTop(), child.getRight(), child.getBottom());
    boolean intersects = clippingRect
        .intersects(sHelperRect.left, sHelperRect.top, sHelperRect.right, sHelperRect.bottom);
    boolean needUpdateClippingRecursive = false;
    // We never want to clip children that are being animated, as this can easily break layout :
    // when layout animation changes size and/or position of views contained inside a listview that
    // clips offscreen children, we need to ensure that, when view exits the viewport, final size
    // and position is set prior to removing the view from its listview parent.
    // Otherwise, when view gets re-attached again, i.e when it re-enters the viewport after scroll,
    // it won't be size and located properly.
    Animation animation = child.getAnimation();
    boolean isAnimating = animation != null && !animation.hasEnded();
    if (!intersects && child.getParent() != null && !isAnimating) {
      // We can try saving on invalidate call here as the view that we remove is out of visible area
      // therefore invalidation is not necessary.
      super.removeViewsInLayout(idx - clippedSoFar, 1);
      needUpdateClippingRecursive = true;
    } else if (intersects && child.getParent() == null) {
      super.addViewInLayout(child, idx - clippedSoFar, sDefaultLayoutParam, true);
      invalidate();
      needUpdateClippingRecursive = true;
    } else if (intersects) {
      // If there is any intersection we need to inform the child to update its clipping rect
      needUpdateClippingRecursive = true;
    }
    if (needUpdateClippingRecursive) {
      if (child instanceof ReactClippingViewGroup) {
        // we don't use {@link sHelperRect} until the end of this loop, therefore it's safe
        // to call this method that may write to the same {@link sHelperRect} object.
        ReactClippingViewGroup clippingChild = (ReactClippingViewGroup) child;
        if (clippingChild.getRemoveClippedSubviews()) {
          clippingChild.updateClippingRect();
        }
      }
    }
  }

  private void updateSubviewClipStatus(View subview) {
    if (!mRemoveClippedSubviews || getParent() == null) {
      return;
    }

    Assertions.assertNotNull(mClippingRect);
    Assertions.assertNotNull(mAllChildren);

    // do fast check whether intersect state changed
    sHelperRect.set(subview.getLeft(), subview.getTop(), subview.getRight(), subview.getBottom());
    boolean intersects = mClippingRect
        .intersects(sHelperRect.left, sHelperRect.top, sHelperRect.right, sHelperRect.bottom);

    // If it was intersecting before, should be attached to the parent
    boolean oldIntersects = (subview.getParent() != null);

    if (intersects != oldIntersects) {
      int clippedSoFar = 0;
      for (int i = 0; i < mAllChildrenCount; i++) {
        if (mAllChildren[i] == subview) {
          updateSubviewClipStatus(mClippingRect, i, clippedSoFar);
          break;
        }
        if (mAllChildren[i].getParent() == null) {
          clippedSoFar++;
        }
      }
    }
  }

  @Override
  protected void onSizeChanged(int w, int h, int oldw, int oldh) {
    super.onSizeChanged(w, h, oldw, oldh);
    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  public void addView(View child, int index, LayoutParams params) {
    // This will get called for every overload of addView so there is not need to override every method.
    mDrawingOrderHelper.handleAddView(child);
    setChildrenDrawingOrderEnabled(mDrawingOrderHelper.shouldEnableCustomDrawingOrder());

    super.addView(child, index, params);
  }

  @Override
  public void removeView(View view) {
    mDrawingOrderHelper.handleRemoveView(view);
    setChildrenDrawingOrderEnabled(mDrawingOrderHelper.shouldEnableCustomDrawingOrder());

    super.removeView(view);
  }

  @Override
  public void removeViewAt(int index) {
    mDrawingOrderHelper.handleRemoveView(getChildAt(index));
    setChildrenDrawingOrderEnabled(mDrawingOrderHelper.shouldEnableCustomDrawingOrder());

    super.removeViewAt(index);
  }

  @Override
  protected int getChildDrawingOrder(int childCount, int index) {
    return mDrawingOrderHelper.getChildDrawingOrder(childCount, index);
  }

  @Override
  public int getZIndexMappedChildIndex(int index) {
    if (mDrawingOrderHelper.shouldEnableCustomDrawingOrder()) {
      return mDrawingOrderHelper.getChildDrawingOrder(getChildCount(), index);
    } else {
      return index;
    }
  }

  @Override
  public PointerEvents getPointerEvents() {
    return mPointerEvents;
  }

  @Override
  protected void dispatchSetPressed(boolean pressed) {
    // Prevents the ViewGroup from dispatching the pressed state
    // to it's children.
  }

  /*package*/ void setPointerEvents(PointerEvents pointerEvents) {
    mPointerEvents = pointerEvents;
  }

  /*package*/ int getAllChildrenCount() {
    return mAllChildrenCount;
  }

  /*package*/ View getChildAtWithSubviewClippingEnabled(int index) {
    return Assertions.assertNotNull(mAllChildren)[index];
  }

  /*package*/ void addViewWithSubviewClippingEnabled(View child, int index) {
    addViewWithSubviewClippingEnabled(child, index, sDefaultLayoutParam);
  }

  /*package*/ void addViewWithSubviewClippingEnabled(View child, int index, LayoutParams params) {
    Assertions.assertCondition(mRemoveClippedSubviews);
    Assertions.assertNotNull(mClippingRect);
    Assertions.assertNotNull(mAllChildren);
    addInArray(child, index);
    // we add view as "clipped" and then run {@link #updateSubviewClipStatus} to conditionally
    // attach it
    int clippedSoFar = 0;
    for (int i = 0; i < index; i++) {
      if (mAllChildren[i].getParent() == null) {
        clippedSoFar++;
      }
    }
    updateSubviewClipStatus(mClippingRect, index, clippedSoFar);
    child.addOnLayoutChangeListener(mChildrenLayoutChangeListener);
  }

  /*package*/ void removeViewWithSubviewClippingEnabled(View view) {
    Assertions.assertCondition(mRemoveClippedSubviews);
    Assertions.assertNotNull(mClippingRect);
    Assertions.assertNotNull(mAllChildren);
    view.removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
    int index = indexOfChildInAllChildren(view);
    if (mAllChildren[index].getParent() != null) {
      int clippedSoFar = 0;
      for (int i = 0; i < index; i++) {
        if (mAllChildren[i].getParent() == null) {
          clippedSoFar++;
        }
      }
      super.removeViewsInLayout(index - clippedSoFar, 1);
    }
    removeFromArray(index);
  }

  /*package*/ void removeAllViewsWithSubviewClippingEnabled() {
    Assertions.assertCondition(mRemoveClippedSubviews);
    Assertions.assertNotNull(mAllChildren);
    for (int i = 0; i < mAllChildrenCount; i++) {
      mAllChildren[i].removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
    }
    removeAllViewsInLayout();
    mAllChildrenCount = 0;
  }

  private int indexOfChildInAllChildren(View child) {
    final int count = mAllChildrenCount;
    final View[] children = Assertions.assertNotNull(mAllChildren);
    for (int i = 0; i < count; i++) {
      if (children[i] == child) {
        return i;
      }
    }
    return -1;
  }

  private void addInArray(View child, int index) {
    View[] children = Assertions.assertNotNull(mAllChildren);
    final int count = mAllChildrenCount;
    final int size = children.length;
    if (index == count) {
      if (size == count) {
        mAllChildren = new View[size + ARRAY_CAPACITY_INCREMENT];
        System.arraycopy(children, 0, mAllChildren, 0, size);
        children = mAllChildren;
      }
      children[mAllChildrenCount++] = child;
    } else if (index < count) {
      if (size == count) {
        mAllChildren = new View[size + ARRAY_CAPACITY_INCREMENT];
        System.arraycopy(children, 0, mAllChildren, 0, index);
        System.arraycopy(children, index, mAllChildren, index + 1, count - index);
        children = mAllChildren;
      } else {
        System.arraycopy(children, index, children, index + 1, count - index);
      }
      children[index] = child;
      mAllChildrenCount++;
    } else {
      throw new IndexOutOfBoundsException("index=" + index + " count=" + count);
    }
  }

  // This method also sets the child's mParent to null
  private void removeFromArray(int index) {
    final View[] children = Assertions.assertNotNull(mAllChildren);
    final int count = mAllChildrenCount;
    if (index == count - 1) {
      children[--mAllChildrenCount] = null;
    } else if (index >= 0 && index < count) {
      System.arraycopy(children, index + 1, children, index, count - index - 1);
      children[--mAllChildrenCount] = null;
    } else {
      throw new IndexOutOfBoundsException();
    }
  }

  @VisibleForTesting
  public int getBackgroundColor() {
    if (getBackground() != null) {
      return ((ReactViewBackgroundDrawable) getBackground()).getColor();
    }
    return DEFAULT_BACKGROUND_COLOR;
  }

  private ReactViewBackgroundDrawable getOrCreateReactViewBackground() {
    if (mReactBackgroundDrawable == null) {
      mReactBackgroundDrawable = new ReactViewBackgroundDrawable();
      Drawable backgroundDrawable = getBackground();
      super.setBackground(null);  // required so that drawable callback is cleared before we add the
                                  // drawable back as a part of LayerDrawable
      if (backgroundDrawable == null) {
        super.setBackground(mReactBackgroundDrawable);
      } else {
        LayerDrawable layerDrawable =
            new LayerDrawable(new Drawable[] {mReactBackgroundDrawable, backgroundDrawable});
        super.setBackground(layerDrawable);
      }
    }
    return mReactBackgroundDrawable;
  }

  @Override
  public @Nullable Rect getHitSlopRect() {
    return mHitSlopRect;
  }

  public void setHitSlopRect(@Nullable Rect rect) {
    mHitSlopRect = rect;
  }

}
