/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import static com.facebook.infer.annotation.Assertions.nullsafeFIXME;
import static com.facebook.react.common.ReactConstants.TAG;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.BlendMode;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.ViewStructure;
import android.view.animation.Animation;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.R;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.touch.OnInterceptTouchEventListener;
import com.facebook.react.touch.ReactHitSlopView;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.uimanager.BackgroundStyleApplicator;
import com.facebook.react.uimanager.BlendModeHelper;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.MeasureSpecAssertions;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactClippingProhibitedView;
import com.facebook.react.uimanager.ReactClippingViewGroup;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.ReactOverflowViewWithInset;
import com.facebook.react.uimanager.ReactPointerEventsView;
import com.facebook.react.uimanager.ReactZIndexedViewGroup;
import com.facebook.react.uimanager.ViewGroupDrawingOrderHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.LogicalEdge;
import com.facebook.react.uimanager.style.Overflow;
import java.util.HashSet;
import java.util.Set;

/**
 * Backing for a React View. Has support for borders, but since borders aren't common, lazy
 * initializes most of the storage needed for them.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactViewGroup extends ViewGroup
    implements ReactInterceptingViewGroup,
        ReactClippingViewGroup,
        ReactPointerEventsView,
        ReactHitSlopView,
        ReactZIndexedViewGroup,
        ReactOverflowViewWithInset {

  private static final int ARRAY_CAPACITY_INCREMENT = 12;
  private static final LayoutParams sDefaultLayoutParam = new ViewGroup.LayoutParams(0, 0);
  private final Rect mOverflowInset = new Rect();

  /**
   * This listener will be set for child views when removeClippedSubview property is enabled. When
   * children layout is updated, it will call {@link #updateSubviewClipStatus} to notify parent view
   * about that fact so that view can be attached/detached if necessary.
   *
   * <p>TODO(7728005): Attach/detach views in batch - once per frame in case when multiple children
   * update their layout.
   */
  private static final class ChildrenLayoutChangeListener implements View.OnLayoutChangeListener {

    @Nullable private ReactViewGroup mParent;

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
      if (mParent != null && mParent.getRemoveClippedSubviews()) {
        mParent.updateSubviewClipStatus(v);
      }
    }

    public void shutdown() {
      mParent = null;
    }
  }

  private int mRecycleCount = 0;

  // Following properties are here to support the option {@code removeClippedSubviews}. This is a
  // temporary optimization/hack that is mainly applicable to the large list of images. The way
  // it's implemented is that we store an additional array of children in view node. We selectively
  // remove some of the views (detach) from it while still storing them in that additional array.
  // We override all possible add methods for {@link ViewGroup} so that we can control this process
  // whenever the option is set. We also override {@link ViewGroup#getChildAt} and
  // {@link ViewGroup#getChildCount} so those methods may return views that are not attached.
  // This is risky but allows us to perform a correct cleanup in {@link NativeViewHierarchyManager}.
  private boolean mRemoveClippedSubviews;
  private volatile boolean mInSubviewClippingLoop;
  private @Nullable View[] mAllChildren;
  private int mAllChildrenCount;
  private @Nullable Rect mClippingRect;
  private @Nullable Rect mHitSlopRect;
  private Overflow mOverflow;
  private PointerEvents mPointerEvents = PointerEvents.AUTO;
  private @Nullable ChildrenLayoutChangeListener mChildrenLayoutChangeListener;
  private @Nullable OnInterceptTouchEventListener mOnInterceptTouchEventListener;
  private boolean mNeedsOffscreenAlphaCompositing;
  private @Nullable ViewGroupDrawingOrderHelper mDrawingOrderHelper;
  private float mBackfaceOpacity;
  private boolean mBackfaceVisible;
  private @Nullable Set<Integer> mChildrenRemovedWhileTransitioning;

  /**
   * Creates a new `ReactViewGroup` instance.
   *
   * @param context A {@link Context} instance. It's Nullable to not break compatibility with OSS
   *     users (could be made non-null in the future but requires proper comms).
   */
  public ReactViewGroup(@Nullable Context context) {
    super(context);
    initView();
  }

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactViewGroup is recycled.
   */
  private void initView() {
    setClipChildren(false);

    mRemoveClippedSubviews = false;
    mInSubviewClippingLoop = false;
    mAllChildren = null;
    mAllChildrenCount = 0;
    mClippingRect = null;
    mHitSlopRect = null;
    mOverflow = Overflow.VISIBLE;
    mPointerEvents = PointerEvents.AUTO;
    mChildrenLayoutChangeListener = null;
    mOnInterceptTouchEventListener = null;
    mNeedsOffscreenAlphaCompositing = false;
    mDrawingOrderHelper = null;
    mBackfaceOpacity = 1.f;
    mBackfaceVisible = true;
    mChildrenRemovedWhileTransitioning = null;
  }

  /* package */ void recycleView() {
    mRecycleCount++;
    // Remove dangling listeners
    if (mAllChildren != null && mChildrenLayoutChangeListener != null) {
      mChildrenLayoutChangeListener.shutdown();
      for (int i = 0; i < mAllChildrenCount; i++) {
        mAllChildren[i].removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
      }
    }

    // Set default field values
    initView();
    mOverflowInset.setEmpty();

    // Remove any children
    removeAllViews();

    // Reset background, borders
    updateBackgroundDrawable(null);

    resetPointerEvents();
  }

  private ViewGroupDrawingOrderHelper getDrawingOrderHelper() {
    if (mDrawingOrderHelper == null) {
      mDrawingOrderHelper = new ViewGroupDrawingOrderHelper(this);
    }
    return mDrawingOrderHelper;
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec);

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec));
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    // No-op since UIManagerModule handles actually laying out children.
  }

  @Override
  @SuppressLint("MissingSuperCall")
  public void requestLayout() {
    // No-op, terminate `requestLayout` here, UIManagerModule handles laying out children and
    // `layout` is called on all RN-managed views by `NativeViewHierarchyManager`
  }

  @TargetApi(23)
  @Override
  public void dispatchProvideStructure(ViewStructure structure) {
    try {
      super.dispatchProvideStructure(structure);
    } catch (NullPointerException e) {
      FLog.e(TAG, "NullPointerException when executing dispatchProvideStructure", e);
    }
  }

  @Override
  public void setBackgroundColor(int color) {
    BackgroundStyleApplicator.setBackgroundColor(this, color);
  }

  @Deprecated(since = "0.76.0", forRemoval = true)
  public void setTranslucentBackgroundDrawable(@Nullable Drawable background) {
    BackgroundStyleApplicator.setFeedbackUnderlay(this, background);
  }

  @Override
  public void setOnInterceptTouchEventListener(OnInterceptTouchEventListener listener) {
    mOnInterceptTouchEventListener = listener;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (mOnInterceptTouchEventListener != null
        && mOnInterceptTouchEventListener.onInterceptTouchEvent(this, ev)) {
      return true;
    }
    // We intercept the touch event if the children are not supposed to receive it.
    if (!PointerEvents.canChildrenBeTouchTarget(mPointerEvents)) {
      return true;
    }
    return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent event) {
    // We do not accept the touch event if this view is not supposed to receive it.
    if (!PointerEvents.canBeTouchTarget(mPointerEvents)) {
      return false;
    }
    // The root view always assumes any view that was tapped wants the touch
    // and sends the event to JS as such.
    // We don't need to do bubbling in native (it's already happening in JS).
    // For an explanation of bubbling and capturing, see
    // http://javascript.info/tutorial/bubbling-and-capturing#capturing
    return true;
  }

  @Override
  public boolean onHoverEvent(MotionEvent event) {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      // Match the logic from onTouchEvent if pointer events are enabled
      return PointerEvents.canBeTouchTarget(mPointerEvents);
    }
    return super.onHoverEvent(event);
  }

  @Override
  public boolean dispatchGenericMotionEvent(MotionEvent ev) {
    // We do not dispatch the motion event if its children are not supposed to receive it
    if (!PointerEvents.canChildrenBeTouchTarget(mPointerEvents)) {
      return false;
    }

    return super.dispatchGenericMotionEvent(ev);
  }

  /**
   * We override this to allow developers to determine whether they need offscreen alpha compositing
   * or not. See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  @Override
  public boolean hasOverlappingRendering() {
    return mNeedsOffscreenAlphaCompositing;
  }

  /** See the documentation of needsOffscreenAlphaCompositing in View.js. */
  public void setNeedsOffscreenAlphaCompositing(boolean needsOffscreenAlphaCompositing) {
    mNeedsOffscreenAlphaCompositing = needsOffscreenAlphaCompositing;
  }

  public void setBorderWidth(int position, float width) {
    BackgroundStyleApplicator.setBorderWidth(
        this, LogicalEdge.values()[position], PixelUtil.toDIPFromPixel(width));
  }

  public void setBorderColor(int position, @Nullable Integer color) {
    BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.values()[position], color);
  }

  /**
   * @deprecated Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.
   */
  @Deprecated(since = "0.75.0", forRemoval = true)
  public void setBorderRadius(float borderRadius) {
    setBorderRadius(borderRadius, BorderRadiusProp.BORDER_RADIUS.ordinal());
  }

  /**
   * @deprecated Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.
   */
  @Deprecated(since = "0.75.0", forRemoval = true)
  public void setBorderRadius(float borderRadius, int position) {
    @Nullable
    LengthPercentage radius =
        Float.isNaN(borderRadius)
            ? null
            : new LengthPercentage(borderRadius, LengthPercentageType.POINT);
    BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.values()[position], radius);
  }

  public void setBorderRadius(BorderRadiusProp property, @Nullable LengthPercentage borderRadius) {
    BackgroundStyleApplicator.setBorderRadius(this, property, borderRadius);
  }

  public void setBorderStyle(@Nullable String style) {
    BackgroundStyleApplicator.setBorderStyle(
        this, style == null ? null : BorderStyle.fromString(style));
  }

  @Override
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    if (removeClippedSubviews == mRemoveClippedSubviews) {
      return;
    }
    mRemoveClippedSubviews = removeClippedSubviews;
    mChildrenRemovedWhileTransitioning = null;
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
        setViewClipped(child, false);
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
    outClippingRect.set(nullsafeFIXME(mClippingRect, "Fix in Kotlin"));
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

  @Override
  public void endViewTransition(View view) {
    super.endViewTransition(view);
    if (mChildrenRemovedWhileTransitioning != null) {
      mChildrenRemovedWhileTransitioning.remove(view.getId());
    }
  }

  private void trackChildViewTransition(int childId) {
    if (mChildrenRemovedWhileTransitioning == null) {
      mChildrenRemovedWhileTransitioning = new HashSet<>();
    }
    mChildrenRemovedWhileTransitioning.add(childId);
  }

  private boolean isChildRemovedWhileTransitioning(View child) {
    return mChildrenRemovedWhileTransitioning != null
        && mChildrenRemovedWhileTransitioning.contains(child.getId());
  }

  private void updateClippingToRect(Rect clippingRect) {
    Assertions.assertNotNull(mAllChildren);
    mInSubviewClippingLoop = true;
    int clippedSoFar = 0;
    for (int i = 0; i < mAllChildrenCount; i++) {
      try {
        updateSubviewClipStatus(clippingRect, i, clippedSoFar);
      } catch (IndexOutOfBoundsException e) {
        int realClippedSoFar = 0;
        Set<View> uniqueViews = new HashSet<>();
        for (int j = 0; j < i; j++) {
          realClippedSoFar += isViewClipped(mAllChildren[j], null) ? 1 : 0;
          uniqueViews.add(mAllChildren[j]);
        }

        throw new IllegalStateException(
            "Invalid clipping state. i="
                + i
                + " clippedSoFar="
                + clippedSoFar
                + " count="
                + getChildCount()
                + " allChildrenCount="
                + mAllChildrenCount
                + " recycleCount="
                + mRecycleCount
                + " realClippedSoFar="
                + realClippedSoFar
                + " uniqueViewsCount="
                + uniqueViews.size(),
            e);
      }
      if (isViewClipped(mAllChildren[i], i)) {
        clippedSoFar++;
      }
    }
    mInSubviewClippingLoop = false;
  }

  private void updateSubviewClipStatus(Rect clippingRect, int idx, int clippedSoFar) {
    UiThreadUtil.assertOnUiThread();

    View child = Assertions.assertNotNull(mAllChildren)[idx];
    boolean intersects =
        clippingRect.intersects(
            child.getLeft(), child.getTop(), child.getRight(), child.getBottom());
    boolean needUpdateClippingRecursive = false;
    // We never want to clip children that are being animated, as this can easily break layout :
    // when layout animation changes size and/or position of views contained inside a listview that
    // clips offscreen children, we need to ensure that, when view exits the viewport, final size
    // and position is set prior to removing the view from its listview parent.
    // Otherwise, when view gets re-attached again, i.e when it re-enters the viewport after scroll,
    // it won't be size and located properly.
    Animation animation = child.getAnimation();
    boolean isAnimating = animation != null && !animation.hasEnded();
    if (!intersects && !isViewClipped(child, idx) && !isAnimating) {
      setViewClipped(child, true);
      // We can try saving on invalidate call here as the view that we remove is out of visible area
      // therefore invalidation is not necessary.
      removeViewInLayout(child);
      needUpdateClippingRecursive = true;
    } else if (intersects && isViewClipped(child, idx)) {
      int adjustedIdx = idx - clippedSoFar;
      Assertions.assertCondition(adjustedIdx >= 0);
      setViewClipped(child, false);
      addViewInLayout(child, adjustedIdx, sDefaultLayoutParam, true);
      invalidate();
      needUpdateClippingRecursive = true;
    } else if (intersects) {
      // If there is any intersection we need to inform the child to update its clipping rect
      needUpdateClippingRecursive = true;
    }
    if (needUpdateClippingRecursive) {
      if (child instanceof ReactClippingViewGroup) {
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
    boolean intersects =
        mClippingRect.intersects(
            subview.getLeft(), subview.getTop(), subview.getRight(), subview.getBottom());

    // If it was intersecting before, should be attached to the parent
    boolean oldIntersects = !isViewClipped(subview, null);

    if (intersects != oldIntersects) {
      mInSubviewClippingLoop = true;
      int clippedSoFar = 0;
      for (int i = 0; i < mAllChildrenCount; i++) {
        if (mAllChildren[i] == subview) {
          updateSubviewClipStatus(mClippingRect, i, clippedSoFar);
          break;
        }
        if (isViewClipped(mAllChildren[i], i)) {
          clippedSoFar++;
        }
      }
      mInSubviewClippingLoop = false;
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

  private boolean customDrawOrderDisabled() {
    if (getId() == NO_ID) {
      return false;
    }

    // Custom draw order is disabled for Fabric.
    return ViewUtil.getUIManagerType(getId()) == UIManagerType.FABRIC;
  }

  @Override
  public void onViewAdded(View child) {
    UiThreadUtil.assertOnUiThread();
    checkViewClippingTag(child, Boolean.FALSE);
    if (!customDrawOrderDisabled()) {
      getDrawingOrderHelper().handleAddView(child);
      setChildrenDrawingOrderEnabled(getDrawingOrderHelper().shouldEnableCustomDrawingOrder());
    } else {
      setChildrenDrawingOrderEnabled(false);
    }
    super.onViewAdded(child);
  }

  @Override
  public void onViewRemoved(View child) {
    UiThreadUtil.assertOnUiThread();
    checkViewClippingTag(child, Boolean.TRUE);
    if (!customDrawOrderDisabled()) {
      if (indexOfChild(child) == -1) {
        return;
      }
      getDrawingOrderHelper().handleRemoveView(child);
      setChildrenDrawingOrderEnabled(getDrawingOrderHelper().shouldEnableCustomDrawingOrder());
    } else {
      setChildrenDrawingOrderEnabled(false);
    }

    // The parent might not be null in case the child is transitioning.
    if (child.getParent() != null) {
      trackChildViewTransition(child.getId());
    }

    super.onViewRemoved(child);
  }

  private void checkViewClippingTag(View child, Boolean expectedTag) {
    if (mInSubviewClippingLoop) {
      Object tag = child.getTag(R.id.view_clipped);
      if (!expectedTag.equals(tag)) {
        ReactSoftExceptionLogger.logSoftException(
            ReactSoftExceptionLogger.Categories.RVG_ON_VIEW_REMOVED,
            new ReactNoCrashSoftException(
                "View clipping tag mismatch: tag=" + tag + " expected=" + expectedTag));
      }
    }
    if (mRemoveClippedSubviews) {
      child.setTag(R.id.view_clipped, expectedTag);
    }
  }

  @Override
  protected int getChildDrawingOrder(int childCount, int index) {
    UiThreadUtil.assertOnUiThread();

    if (!customDrawOrderDisabled()) {
      return getDrawingOrderHelper().getChildDrawingOrder(childCount, index);
    } else {
      return index;
    }
  }

  @Override
  public int getZIndexMappedChildIndex(int index) {
    UiThreadUtil.assertOnUiThread();

    if (!customDrawOrderDisabled() && getDrawingOrderHelper().shouldEnableCustomDrawingOrder()) {
      return getDrawingOrderHelper().getChildDrawingOrder(getChildCount(), index);
    }

    // Fabric behavior
    return index;
  }

  @Override
  public void updateDrawingOrder() {
    if (customDrawOrderDisabled()) {
      return;
    }

    getDrawingOrderHelper().update();
    setChildrenDrawingOrderEnabled(getDrawingOrderHelper().shouldEnableCustomDrawingOrder());
    invalidate();
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

  public void setPointerEvents(PointerEvents pointerEvents) {
    mPointerEvents = pointerEvents;
  }

  /*package*/ void resetPointerEvents() {
    mPointerEvents = PointerEvents.AUTO;
  }

  /*package*/ int getAllChildrenCount() {
    return mAllChildrenCount;
  }

  /*package*/ @Nullable
  View getChildAtWithSubviewClippingEnabled(int index) {
    return index >= 0 && index < mAllChildrenCount
        ? Assertions.assertNotNull(mAllChildren)[index]
        : null;
  }

  /*package*/ void addViewWithSubviewClippingEnabled(View child, int index) {
    addViewWithSubviewClippingEnabled(child, index, sDefaultLayoutParam);
  }

  /*package*/ void addViewWithSubviewClippingEnabled(
      final View child, int index, ViewGroup.LayoutParams params) {
    Assertions.assertCondition(mRemoveClippedSubviews);
    setViewClipped(child, true); // the view has not been added, so it is "clipped"
    addInArray(child, index);

    // we add view as "clipped" and then run {@link #updateSubviewClipStatus} to conditionally
    // attach it
    Rect clippingRect = Assertions.assertNotNull(mClippingRect);
    View[] childArray = Assertions.assertNotNull(mAllChildren);
    mInSubviewClippingLoop = true;
    int clippedSoFar = 0;
    for (int i = 0; i < index; i++) {
      if (isViewClipped(childArray[i], i)) {
        clippedSoFar++;
      }
    }
    updateSubviewClipStatus(clippingRect, index, clippedSoFar);
    mInSubviewClippingLoop = false;
    child.addOnLayoutChangeListener(mChildrenLayoutChangeListener);

    if (child instanceof ReactClippingProhibitedView) {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              if (!child.isShown()) {
                ReactSoftExceptionLogger.logSoftException(
                    TAG,
                    new ReactNoCrashSoftException(
                        "Child view has been added to Parent view in which it is clipped and not"
                            + " visible. This is not legal for this particular child view. Child: ["
                            + child.getId()
                            + "] "
                            + child.toString()
                            + " Parent: ["
                            + getId()
                            + "] "
                            + toString()));
              }
            }
          });
    }
  }

  /*package*/ void removeViewWithSubviewClippingEnabled(View view) {
    UiThreadUtil.assertOnUiThread();

    Assertions.assertCondition(mRemoveClippedSubviews);
    Assertions.assertNotNull(mClippingRect);
    View[] childArray = Assertions.assertNotNull(mAllChildren);
    view.removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
    int index = indexOfChildInAllChildren(view);
    if (!isViewClipped(childArray[index], index)) {
      int clippedSoFar = 0;
      for (int i = 0; i < index; i++) {
        if (isViewClipped(childArray[i], i)) {
          clippedSoFar++;
        }
      }
      removeViewsInLayout(index - clippedSoFar, 1);
      invalidate();
    }
    removeFromArray(index);
  }

  /*package*/ void removeAllViewsWithSubviewClippingEnabled() {
    Assertions.assertCondition(mRemoveClippedSubviews);
    View[] childArray = Assertions.assertNotNull(mAllChildren);
    for (int i = 0; i < mAllChildrenCount; i++) {
      childArray[i].removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
    }
    removeAllViewsInLayout();
    mAllChildrenCount = 0;
  }

  /**
   * @return {@code true} if the view has been removed from the ViewGroup.
   * @param index For logging - index of the view in {@code mAllChildren}, or {@code null} to skip
   *     logging.
   */
  private boolean isViewClipped(View view, @Nullable Integer index) {
    Object tag = view.getTag(R.id.view_clipped);
    if (tag != null) {
      return (boolean) tag;
    }
    ViewParent parent = view.getParent();
    boolean transitioning = isChildRemovedWhileTransitioning(view);
    if (index != null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.RVG_IS_VIEW_CLIPPED,
          new ReactNoCrashSoftException(
              "View missing clipping tag: index="
                  + index
                  + " parentNull="
                  + (parent == null)
                  + " parentThis="
                  + (parent == this)
                  + " transitioning="
                  + transitioning));
    }
    // fallback - should be transitioning or have no parent if the view was removed
    if (parent == null || transitioning) {
      return true;
    } else {
      Assertions.assertCondition(parent == this);
      return false;
    }
  }

  private static void setViewClipped(View view, boolean clipped) {
    view.setTag(R.id.view_clipped, clipped);
  }

  private int indexOfChildInAllChildren(View child) {
    final int count = mAllChildrenCount;
    final View[] childArray = Assertions.assertNotNull(mAllChildren);
    for (int i = 0; i < count; i++) {
      if (childArray[i] == child) {
        return i;
      }
    }
    return -1;
  }

  private void addInArray(View child, int index) {
    View[] childArray = Assertions.assertNotNull(mAllChildren);
    final int count = mAllChildrenCount;
    final int size = childArray.length;
    if (index == count) {
      if (size == count) {
        mAllChildren = new View[size + ARRAY_CAPACITY_INCREMENT];
        System.arraycopy(childArray, 0, mAllChildren, 0, size);
        childArray = mAllChildren;
      }
      childArray[mAllChildrenCount++] = child;
    } else if (index < count) {
      if (size == count) {
        mAllChildren = new View[size + ARRAY_CAPACITY_INCREMENT];
        System.arraycopy(childArray, 0, mAllChildren, 0, index);
        System.arraycopy(childArray, index, mAllChildren, index + 1, count - index);
        childArray = mAllChildren;
      } else {
        System.arraycopy(childArray, index, childArray, index + 1, count - index);
      }
      childArray[index] = child;
      mAllChildrenCount++;
    } else {
      throw new IndexOutOfBoundsException("index=" + index + " count=" + count);
    }
  }

  private void removeFromArray(int index) {
    final View[] childArray = Assertions.assertNotNull(mAllChildren);
    final int count = mAllChildrenCount;
    if (index == count - 1) {
      childArray[--mAllChildrenCount] = null;
    } else if (index >= 0 && index < count) {
      System.arraycopy(childArray, index + 1, childArray, index, count - index - 1);
      childArray[--mAllChildrenCount] = null;
    } else {
      throw new IndexOutOfBoundsException();
    }
  }

  @Override
  public @Nullable Rect getHitSlopRect() {
    return mHitSlopRect;
  }

  public void setHitSlopRect(@Nullable Rect rect) {
    mHitSlopRect = rect;
  }

  public void setOverflow(@Nullable String overflow) {
    if (overflow == null) {
      mOverflow = Overflow.VISIBLE;
    } else {
      @Nullable Overflow parsedOverflow = Overflow.fromString(overflow);
      mOverflow = parsedOverflow == null ? Overflow.VISIBLE : parsedOverflow;
    }

    invalidate();
  }

  @Override
  public @Nullable String getOverflow() {
    switch (mOverflow) {
      case HIDDEN:
        return "hidden";
      case SCROLL:
        return "scroll";
      case VISIBLE:
        return "visible";
    }

    return null;
  }

  @Override
  public void setOverflowInset(int left, int top, int right, int bottom) {
    if (BlendModeHelper.needsIsolatedLayer(this)
        && (mOverflowInset.left != left
            || mOverflowInset.top != top
            || mOverflowInset.right != right
            || mOverflowInset.bottom != bottom)) {
      invalidate();
    }
    mOverflowInset.set(left, top, right, bottom);
  }

  @Override
  public Rect getOverflowInset() {
    return mOverflowInset;
  }

  /**
   * Set the background for the view or remove the background. It calls {@link
   * #setBackground(Drawable)} or {@link #setBackgroundDrawable(Drawable)} based on the sdk version.
   *
   * @param drawable {@link Drawable} The Drawable to use as the background, or null to remove the
   *     background
   */
  /* package */ void updateBackgroundDrawable(@Nullable Drawable drawable) {
    super.setBackground(drawable);
  }

  @Override
  public void draw(Canvas canvas) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
        && ViewUtil.getUIManagerType(this) == UIManagerType.FABRIC
        && BlendModeHelper.needsIsolatedLayer(this)) {

      // Check if the view is a stacking context and has children, if it does, do the rendering
      // offscreen and then composite back. This follows the idea of group isolation on blending
      // https://www.w3.org/TR/compositing-1/#isolationblending
      Rect overflowInset = getOverflowInset();
      canvas.saveLayer(
          overflowInset.left,
          overflowInset.top,
          getWidth() + -overflowInset.right,
          getHeight() + -overflowInset.bottom,
          null);
      super.draw(canvas);
      canvas.restore();
    } else {
      super.draw(canvas);
    }
  }

  @Override
  protected void dispatchDraw(Canvas canvas) {
    if (mOverflow != Overflow.VISIBLE || getTag(R.id.filter) != null) {
      BackgroundStyleApplicator.clipToPaddingBox(this, canvas);
    }
    super.dispatchDraw(canvas);
  }

  @Override
  protected boolean drawChild(Canvas canvas, View child, long drawingTime) {
    boolean drawWithZ = child.getElevation() > 0;

    if (drawWithZ) {
      CanvasUtil.enableZ(canvas, true);
    }

    BlendMode mixBlendMode = null;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
        && ViewUtil.getUIManagerType(this) == UIManagerType.FABRIC
        && BlendModeHelper.needsIsolatedLayer(this)) {
      mixBlendMode = (BlendMode) child.getTag(R.id.mix_blend_mode);
      if (mixBlendMode != null) {
        Paint p = new Paint();
        p.setBlendMode(mixBlendMode);
        Rect overflowInset = getOverflowInset();
        canvas.saveLayer(
            overflowInset.left,
            overflowInset.top,
            getWidth() + -overflowInset.right,
            getHeight() + -overflowInset.bottom,
            p);
      }
    }

    boolean result = super.drawChild(canvas, child, drawingTime);

    if (mixBlendMode != null) {
      canvas.restore();
    }

    if (drawWithZ) {
      CanvasUtil.enableZ(canvas, false);
    }
    return result;
  }

  public void setOpacityIfPossible(float opacity) {
    mBackfaceOpacity = opacity;
    setBackfaceVisibilityDependantOpacity();
  }

  public void setBackfaceVisibility(String backfaceVisibility) {
    mBackfaceVisible = "visible".equals(backfaceVisibility);
    setBackfaceVisibilityDependantOpacity();
  }

  public void setBackfaceVisibilityDependantOpacity() {
    if (mBackfaceVisible) {
      setAlpha(mBackfaceOpacity);
      return;
    }

    float rotationX = getRotationX();
    float rotationY = getRotationY();

    boolean isFrontfaceVisible =
        (rotationX >= -90.f && rotationX < 90.f) && (rotationY >= -90.f && rotationY < 90.f);

    if (isFrontfaceVisible) {
      setAlpha(mBackfaceOpacity);
      return;
    }

    setAlpha(0);
  }
}
