/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.Animation;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.common.SystemClock;
import com.facebook.react.touch.OnInterceptTouchEventListener;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactCompoundViewGroup;
import com.facebook.react.uimanager.ReactPointerEventsView;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.views.image.ImageLoadEvent;
import com.facebook.react.views.view.ReactClippingViewGroup;
import com.facebook.react.views.view.ReactClippingViewGroupHelper;

/**
 * A view that FlatShadowNode hierarchy maps to. Performs drawing by iterating over
 * array of DrawCommands, executing them one by one.
 */
/* package */ final class FlatViewGroup extends ViewGroup
    implements ReactInterceptingViewGroup, ReactClippingViewGroup,
    ReactCompoundViewGroup, ReactPointerEventsView, FlatMeasuredViewGroup {
  /**
   * Helper class that allows AttachDetachListener to invalidate the hosting View.
   */
  static final class InvalidateCallback extends WeakReference<FlatViewGroup> {

    private InvalidateCallback(FlatViewGroup view) {
      super(view);
    }

    /**
     * Propagates invalidate() call up to the hosting View (if it's still alive)
     */
    public void invalidate() {
      FlatViewGroup view = get();
      if (view != null) {
        view.invalidate();
      }
    }

    public void dispatchImageLoadEvent(int reactTag, int imageLoadEvent) {
      FlatViewGroup view = get();
      if (view == null) {
        return;
      }

      ReactContext reactContext = ((ReactContext) view.getContext());
      UIManagerModule uiManagerModule = reactContext.getNativeModule(UIManagerModule.class);
      uiManagerModule.getEventDispatcher().dispatchEvent(
          new ImageLoadEvent(reactTag, SystemClock.nanoTime(), imageLoadEvent));
    }
  }

  private static final boolean DEBUG_DRAW = false;
  private static final boolean DEBUG_DRAW_TEXT = false;
  private boolean mAndroidDebugDraw;
  private static Paint sDebugTextPaint;
  private static Paint sDebugTextBackgroundPaint;
  private static Paint sDebugRectPaint;
  private static Paint sDebugCornerPaint;
  private static Rect sDebugRect;

  private static final ArrayList<FlatViewGroup> LAYOUT_REQUESTS = new ArrayList<>();
  private static final Rect VIEW_BOUNDS = new Rect();
  private static final Rect EMPTY_RECT = new Rect();

  private @Nullable InvalidateCallback mInvalidateCallback;
  private DrawCommand[] mDrawCommands = DrawCommand.EMPTY_ARRAY;
  private AttachDetachListener[] mAttachDetachListeners = AttachDetachListener.EMPTY_ARRAY;
  private NodeRegion[] mNodeRegions = NodeRegion.EMPTY_ARRAY;
  private int mDrawChildIndex = 0;
  private boolean mIsAttached = false;
  private boolean mIsLayoutRequested = false;
  private boolean mNeedsOffscreenAlphaCompositing = false;
  private Drawable mHotspot;
  private PointerEvents mPointerEvents = PointerEvents.AUTO;
  private long mLastTouchDownTime;
  private @Nullable OnInterceptTouchEventListener mOnInterceptTouchEventListener;

  private boolean mRemoveClippedSubviews;
  private @Nullable Rect mClippingRect;
  // lookups in o(1) instead of o(log n) - trade space for time
  private final Map<Integer, DrawView> mDrawViewMap = new HashMap<>();
  // When grandchildren are promoted, these can only be FlatViewGroups, but we need to handle the
  // case that we clip subviews and don't promote grandchildren.
  private final Map<Integer, View> mClippedSubviews = new HashMap<>();
  // for overflow visible, these adjustments are what we can apply to know the actual bounds of
  // a ViewGroup while taking overflowing elements into account.
  private Rect mLogicalAdjustments = EMPTY_RECT;

  /* package */ FlatViewGroup(Context context) {
    super(context);
    setClipChildren(false);
  }

  @Override
  protected void detachAllViewsFromParent() {
    super.detachAllViewsFromParent();
  }

  @Override
  @SuppressLint("MissingSuperCall")
  public void requestLayout() {
    if (mIsLayoutRequested) {
      return;
    }

    mIsLayoutRequested = true;
    LAYOUT_REQUESTS.add(this);
  }

  @Override
  public int reactTagForTouch(float touchX, float touchY) {
    /**
     * Make sure we don't find any children if the pointer events are set to BOX_ONLY.
     * There is no need to special-case any other modes, because if PointerEvents are set to:
     * a) PointerEvents.AUTO - all children are included, nothing to exclude
     * b) PointerEvents.NONE - this method will NOT be executed, because the View will be filtered
     *    out by TouchTargetHelper.
     * c) PointerEvents.BOX_NONE - TouchTargetHelper will make sure that {@link #reactTagForTouch()}
    *     doesn't return getId().
     */
    SoftAssertions.assertCondition(
        mPointerEvents != PointerEvents.NONE,
        "TouchTargetHelper should not allow calling this method when pointer events are NONE");

    if (mPointerEvents != PointerEvents.BOX_ONLY) {
      NodeRegion nodeRegion = virtualNodeRegionWithinBounds(touchX, touchY);
      if (nodeRegion != null) {
        return nodeRegion.getReactTag(touchX, touchY);
      }
    }

    // no children found
    return getId();
  }

  @Override
  public boolean interceptsTouchEvent(float touchX, float touchY) {
    NodeRegion nodeRegion = anyNodeRegionWithinBounds(touchX, touchY);
    return nodeRegion != null && nodeRegion.mIsVirtual;
  }

  // This is hidden in the Android ViewGroup, but still gets called in super.dispatchDraw.
  protected void onDebugDraw(Canvas canvas) {
    // Android is drawing layout bounds, so we should as well.
    mAndroidDebugDraw = true;
  }

  @Override
  public void dispatchDraw(Canvas canvas) {
    mAndroidDebugDraw = false;
    super.dispatchDraw(canvas);

    if (mRemoveClippedSubviews) {
      for (DrawCommand drawCommand : mDrawCommands) {
        if (drawCommand instanceof DrawView) {
          if (!((DrawView) drawCommand).isViewGroupClipped) {
            drawCommand.draw(this, canvas);
          }
          // else, don't draw, and don't increment index
        } else {
          drawCommand.draw(this, canvas);
        }
      }
    } else {
      for (DrawCommand drawCommand : mDrawCommands) {
        drawCommand.draw(this, canvas);
      }
    }

    if (mDrawChildIndex != getChildCount()) {
      throw new RuntimeException(
          "Did not draw all children: " + mDrawChildIndex + " / " + getChildCount());
    }
    mDrawChildIndex = 0;

    if (DEBUG_DRAW || mAndroidDebugDraw) {
      initDebugDrawResources();
      debugDraw(canvas);
    }

    if (mHotspot != null) {
      mHotspot.draw(canvas);
    }
  }

  private void debugDraw(Canvas canvas) {
    for (DrawCommand drawCommand : mDrawCommands) {
      if (drawCommand instanceof DrawView) {
        if (!((DrawView) drawCommand).isViewGroupClipped) {
          drawCommand.debugDraw(this, canvas);
        }
        // else, don't draw, and don't increment index
      } else {
        drawCommand.debugDraw(this, canvas);
      }
    }
    mDrawChildIndex = 0;
  }

  @Override
  protected boolean drawChild(Canvas canvas, View child, long drawingTime) {
    // suppress
    // no drawing -> no invalidate -> return false
    return false;
  }

  /* package */ void debugDrawNextChild(Canvas canvas) {
    View child = getChildAt(mDrawChildIndex);
    // Draw FlatViewGroups a different color than regular child views.
    int color = child instanceof FlatViewGroup ? Color.DKGRAY : Color.RED;
    debugDrawRect(
        canvas,
        color,
        child.getLeft(),
        child.getTop(),
        child.getRight(),
        child.getBottom());
    ++mDrawChildIndex;
  }

  // Used in debug drawing.
  private int dipsToPixels(int dips) {
    float scale = getResources().getDisplayMetrics().density;
    return (int) (dips * scale + 0.5f);
  }

  // Used in debug drawing.
  private static void fillRect(Canvas canvas, Paint paint, float x1, float y1, float x2, float y2) {
    if (x1 != x2 && y1 != y2) {
      if (x1 > x2) {
        float tmp = x1; x1 = x2; x2 = tmp;
      }
      if (y1 > y2) {
        float tmp = y1; y1 = y2; y2 = tmp;
      }
      canvas.drawRect(x1, y1, x2, y2, paint);
    }
  }

  // Used in debug drawing.
  private static int sign(float x) {
    return (x >= 0) ? 1 : -1;
  }

  // Used in debug drawing.
  private static void drawCorner(
      Canvas c,
      Paint paint,
      float x1,
      float y1,
      float dx,
      float dy,
      float lw) {
    fillRect(c, paint, x1, y1, x1 + dx, y1 + lw * sign(dy));
    fillRect(c, paint, x1, y1, x1 + lw * sign(dx), y1 + dy);
  }

  // Used in debug drawing.
  private static void drawRectCorners(
      Canvas canvas,
      float x1,
      float y1,
      float x2,
      float y2,
      Paint paint,
      int lineLength,
      int lineWidth) {
    drawCorner(canvas, paint, x1, y1, lineLength, lineLength, lineWidth);
    drawCorner(canvas, paint, x1, y2, lineLength, -lineLength, lineWidth);
    drawCorner(canvas, paint, x2, y1, -lineLength, lineLength, lineWidth);
    drawCorner(canvas, paint, x2, y2, -lineLength, -lineLength, lineWidth);
  }

  private void initDebugDrawResources() {
    if (sDebugTextPaint == null) {
      sDebugTextPaint = new Paint();
      sDebugTextPaint.setTextAlign(Paint.Align.RIGHT);
      sDebugTextPaint.setTextSize(dipsToPixels(9));
      sDebugTextPaint.setColor(Color.RED);
    }
    if (sDebugTextBackgroundPaint == null) {
      sDebugTextBackgroundPaint = new Paint();
      sDebugTextBackgroundPaint.setColor(Color.WHITE);
      sDebugTextBackgroundPaint.setAlpha(200);
      sDebugTextBackgroundPaint.setStyle(Paint.Style.FILL);
    }
    if (sDebugRectPaint == null) {
      sDebugRectPaint = new Paint();
      sDebugRectPaint.setAlpha(100);
      sDebugRectPaint.setStyle(Paint.Style.STROKE);
    }
    if (sDebugCornerPaint == null) {
      sDebugCornerPaint = new Paint();
      sDebugCornerPaint.setAlpha(200);
      sDebugCornerPaint.setColor(Color.rgb(63, 127, 255));
      sDebugCornerPaint.setStyle(Paint.Style.FILL);
    }
    if (sDebugRect == null) {
      sDebugRect = new Rect();
    }
  }

  private void debugDrawRect(
      Canvas canvas,
      int color,
      float left,
      float top,
      float right,
      float bottom) {
    debugDrawNamedRect(canvas, color, "", left, top, right, bottom);
  }

  /* package */ void debugDrawNamedRect(
      Canvas canvas,
      int color,
      String name,
      float left,
      float top,
      float right,
      float bottom) {
    if (DEBUG_DRAW_TEXT && !name.isEmpty()) {
      sDebugTextPaint.getTextBounds(name, 0, name.length(), sDebugRect);
      int inset = dipsToPixels(2);
      float textRight = right - inset - 1;
      float textBottom = bottom - inset - 1;
      canvas.drawRect(
          textRight - sDebugRect.right - inset,
          textBottom + sDebugRect.top - inset,
          textRight + inset,
          textBottom + inset,
          sDebugTextBackgroundPaint);
      canvas.drawText(name, textRight, textBottom, sDebugTextPaint);
    }
    // Retain the alpha component.
    sDebugRectPaint.setColor((sDebugRectPaint.getColor() & 0xFF000000) | (color & 0x00FFFFFF));
    sDebugRectPaint.setAlpha(100);
    canvas.drawRect(
        left,
        top,
        right - 1,
        bottom - 1,
        sDebugRectPaint);
    drawRectCorners(
        canvas,
        left,
        top,
        right,
        bottom,
        sDebugCornerPaint,
        dipsToPixels(8),
        dipsToPixels(1));
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // nothing to do here
  }

  @Override
  @SuppressLint("MissingSuperCall")
  protected boolean verifyDrawable(Drawable who) {
    return true;
  }

  @Override
  protected void onAttachedToWindow() {
    if (mIsAttached) {
      // this is possible, unfortunately.
      return;
    }

    mIsAttached = true;

    super.onAttachedToWindow();
    dispatchOnAttached(mAttachDetachListeners);

    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    if (!mIsAttached) {
      throw new RuntimeException("Double detach");
    }

    mIsAttached = false;

    super.onDetachedFromWindow();
    dispatchOnDetached(mAttachDetachListeners);
  }

  @Override
  protected void onSizeChanged(int w, int h, int oldw, int oldh) {
    if (mHotspot != null) {
      mHotspot.setBounds(0, 0, w, h);
      invalidate();
    }

    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  public void dispatchDrawableHotspotChanged(float x, float y) {
    if (mHotspot != null) {
      mHotspot.setHotspot(x, y);
      invalidate();
    }
  }

  @Override
  protected void drawableStateChanged() {
    super.drawableStateChanged();

    if (mHotspot != null && mHotspot.isStateful()) {
        mHotspot.setState(getDrawableState());
    }
  }

  @Override
  public void jumpDrawablesToCurrentState() {
    super.jumpDrawablesToCurrentState();
    if (mHotspot != null) {
        mHotspot.jumpToCurrentState();
    }
  }

  @Override
  public void invalidate() {
    // By default, invalidate() only invalidates the View's boundaries, which works great in most
    // cases but may fail with overflow: visible (i.e. View clipping disabled) when View width or
    // height is 0. This is because invalidate() has an optimization where it will not invalidate
    // empty Views at all. A quick fix is to invalidate a slightly larger region to make sure we
    // never hit that optimization.
    //
    // Another thing to note is that this may not work correctly with software rendering because
    // in software, Android tracks dirty regions to redraw. We would need to collect information
    // about all children boundaries (recursively) to track dirty region precisely.
    invalidate(0, 0, getWidth() + 1, getHeight() + 1);
  }

  /**
   * We override this to allow developers to determine whether they need offscreen alpha compositing
   * or not. See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  @Override
  public boolean hasOverlappingRendering() {
    return mNeedsOffscreenAlphaCompositing;
  }

  @Override
  public void setOnInterceptTouchEventListener(OnInterceptTouchEventListener listener) {
    mOnInterceptTouchEventListener = listener;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    final long downTime = ev.getDownTime();
    if (downTime != mLastTouchDownTime) {
      mLastTouchDownTime = downTime;
      if (interceptsTouchEvent(ev.getX(), ev.getY())) {
        return true;
      }
    }

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
    if (mPointerEvents == PointerEvents.NONE) {
      return false;
    }

    if (mPointerEvents == PointerEvents.BOX_NONE) {
      // We cannot always return false here because some child nodes could be flatten into this View
      NodeRegion nodeRegion = virtualNodeRegionWithinBounds(ev.getX(), ev.getY());
      if (nodeRegion == null) {
        // no child to handle this touch event, bailing out.
        return false;
      }
    }

    // The root view always assumes any view that was tapped wants the touch
    // and sends the event to JS as such.
    // We don't need to do bubbling in native (it's already happening in JS).
    // For an explanation of bubbling and capturing, see
    // http://javascript.info/tutorial/bubbling-and-capturing#capturing
    return true;
  }

  @Override
  public PointerEvents getPointerEvents() {
    return mPointerEvents;
  }

  /*package*/ void setPointerEvents(PointerEvents pointerEvents) {
    mPointerEvents = pointerEvents;
  }

  /**
   * See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  /* package */ void setNeedsOffscreenAlphaCompositing(boolean needsOffscreenAlphaCompositing) {
    mNeedsOffscreenAlphaCompositing = needsOffscreenAlphaCompositing;
  }

  /* package */ void setHotspot(Drawable hotspot) {
    if (mHotspot != null) {
      mHotspot.setCallback(null);
      unscheduleDrawable(mHotspot);
    }

    if (hotspot != null) {
      hotspot.setCallback(this);
      if (hotspot.isStateful()) {
        hotspot.setState(getDrawableState());
      }
    }

    mHotspot = hotspot;
    invalidate();
  }

  /* package */ void drawNextChild(Canvas canvas) {
    View child = getChildAt(mDrawChildIndex);
    if (child instanceof FlatViewGroup) {
      super.drawChild(canvas, child, getDrawingTime());
    } else {
      // Make sure non-React Views clip properly.
      canvas.save(Canvas.CLIP_SAVE_FLAG);
      child.getHitRect(VIEW_BOUNDS);
      canvas.clipRect(VIEW_BOUNDS);
      super.drawChild(canvas, child, getDrawingTime());
      canvas.restore();
    }

    ++mDrawChildIndex;
  }

  /* package */ void mountDrawCommands(DrawCommand[] drawCommands, Rect logicalAdjustments) {
    mDrawCommands = drawCommands;
    mLogicalAdjustments = logicalAdjustments;
    if (mRemoveClippedSubviews) {
      mDrawViewMap.clear();
      for (DrawCommand drawCommand : mDrawCommands) {
        if (drawCommand instanceof DrawView) {
          DrawView drawView = (DrawView) drawCommand;
          mDrawViewMap.put(drawView.reactTag, drawView);
        }
      }
    }
    invalidate();
  }

  /**
   * Finds a NodeRegion which matches the said reactTag
   * @param reactTag the reactTag to look for
   * @return the NodeRegion, or NodeRegion.EMPTY
   */
  /* package */ NodeRegion getNodeRegionForTag(int reactTag) {
    for (NodeRegion region : mNodeRegions) {
      if (region.matchesTag(reactTag)) {
        return region;
      }
    }
    return NodeRegion.EMPTY;
  }

  /**
   * Return a list of FlatViewGroups that are detached (due to being clipped) but that we have a
   * strong reference to. This is used by the FlatNativeViewHierarchyManager to explicitly clean up
   * those views when removing this parent.
   *
   * @return a Collection of FlatViewGroups to clean up
   */
  Collection<View> getDetachedViews() {
    return mClippedSubviews.values();
  }

  /**
   * Remove the detached view from the parent
   * This is used during cleanup to trigger onDetachedFromWindow on any views that were in a
   * temporary detached state due to them being clipped. This is called for cleanup of said views
   * by FlatNativeViewHierarchyManager.
   * @param view the detached View to remove
   */
  void removeDetachedView(View view) {
    removeDetachedView(view, false);
  }

  @Override
  public void removeAllViewsInLayout() {
    // whenever we want to remove all views in a layout, we also want to remove all the
    // DrawCommands, otherwise, we can have a mismatch between the DrawView DrawCommands
    // and the Views to draw (note that because removeAllViewsInLayout doesn't call invalidate,
    // we don't actually need to modify mDrawCommands, but we do it just in case).
    mDrawCommands = DrawCommand.EMPTY_ARRAY;
    super.removeAllViewsInLayout();
  }

  /* package */ void mountAttachDetachListeners(AttachDetachListener[] listeners) {
    if (mIsAttached) {
      // Ordering of the following 2 statements is very important. While logically it makes sense to
      // detach old listeners first, and only then attach new listeners, this is not very efficient,
      // because a listener can be in both lists. In this case, it will be detached first and then
      // re-attached immediately. This is undesirable for a couple of reasons:
      // 1) performance. Detaching is slow because it may cancel an ongoing network request
      // 2) it may cause flicker: an image that was already loaded may get unloaded.
      //
      // For this reason, we are attaching new listeners first. What this means is that listeners
      // that are in both lists need to gracefully handle a secondary attach and detach events,
      // (i.e. onAttach() being called when already attached, followed by a detach that should be
      // ignored) turning them into no-ops. This will result in no performance loss and no flicker,
      // because ongoing network requests don't get cancelled.
      dispatchOnAttached(listeners);
      dispatchOnDetached(mAttachDetachListeners);
    }
    mAttachDetachListeners = listeners;
  }

  /* package */ void mountNodeRegions(NodeRegion[] nodeRegions) {
    mNodeRegions = nodeRegions;
  }

  /* package */ void mountViews(ViewResolver viewResolver, int[] viewsToAdd, int[] viewsToDetach) {
    for (int viewToAdd : viewsToAdd) {
      if (viewToAdd > 0) {
        View view = ensureViewHasNoParent(viewResolver.getView(viewToAdd));
        addViewInLayout(view, -1, ensureLayoutParams(view.getLayoutParams()), true);
      } else {
        View view = ensureViewHasNoParent(viewResolver.getView(-viewToAdd));
        if (mRemoveClippedSubviews) {
          DrawView drawView = Assertions.assertNotNull(mDrawViewMap.get(-viewToAdd));
          // If the view is clipped, we don't need to attach it.
          if (!drawView.isViewGroupClipped) {
            attachViewToParent(view, -1, ensureLayoutParams(view.getLayoutParams()));
          }
        } else {
          attachViewToParent(view, -1, ensureLayoutParams(view.getLayoutParams()));
        }
      }
    }

    for (int viewToDetach : viewsToDetach) {
      View view = viewResolver.getView(viewToDetach);
      if (view.getParent() != null) {
        removeViewInLayout(view);
      } else {
        removeDetachedView(view, false);
      }

      if (mRemoveClippedSubviews) {
        mClippedSubviews.remove(viewToDetach);
      }
    }

    invalidate();
  }

  private void processLayoutRequest() {
    mIsLayoutRequested = false;
    for (int i = 0, childCount = getChildCount(); i != childCount; ++i) {
      View child = getChildAt(i);
      if (!child.isLayoutRequested()) {
        continue;
      }

      child.measure(
        MeasureSpec.makeMeasureSpec(child.getWidth(), MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(child.getHeight(), MeasureSpec.EXACTLY));
      child.layout(child.getLeft(), child.getTop(), child.getRight(), child.getBottom());
    }
  }

  /* package */ static void processLayoutRequests() {
    for (int i = 0, numLayoutRequests = LAYOUT_REQUESTS.size(); i != numLayoutRequests; ++i) {
      FlatViewGroup flatViewGroup = LAYOUT_REQUESTS.get(i);
      flatViewGroup.processLayoutRequest();
    }
    LAYOUT_REQUESTS.clear();
  }

  // Helper method for measure functionality provided by MeasuredViewGroup.
  @Override
  public Rect measureWithCommands() {
    int childCount = getChildCount();
    if (childCount == 0 && mDrawCommands.length == 0) {
      return new Rect(0, 0, 0, 0);
    }
    int left = Integer.MAX_VALUE;
    int top = Integer.MAX_VALUE;
    int right = Integer.MIN_VALUE;
    int bottom = Integer.MIN_VALUE;
    for (int i = 0; i < childCount; i++) {
      View child = getChildAt(i);
      left = Math.min(left, child.getLeft());
      top = Math.min(top, child.getTop());
      right = Math.max(right, child.getRight());
      bottom = Math.max(bottom, child.getBottom());
    }
    for (int i = 0; i < mDrawCommands.length; i++) {
      if (!(mDrawCommands[i] instanceof AbstractDrawCommand)) {
        continue;
      }
      AbstractDrawCommand drawCommand = (AbstractDrawCommand) mDrawCommands[i];
      left = Math.min(left, Math.round(drawCommand.getLeft()));
      top = Math.min(top, Math.round(drawCommand.getTop()));
      right = Math.max(right, Math.round(drawCommand.getRight()));
      bottom = Math.max(bottom, Math.round(drawCommand.getBottom()));
    }
    return new Rect(left, top, right, bottom);
  }

  private @Nullable NodeRegion virtualNodeRegionWithinBounds(float touchX, float touchY) {
    for (int i = mNodeRegions.length - 1; i >= 0; --i) {
      NodeRegion nodeRegion = mNodeRegions[i];
      if (!nodeRegion.mIsVirtual) {
        // only interested in virtual nodes
        continue;
      }
      if (nodeRegion.withinBounds(touchX, touchY)) {
        return nodeRegion;
      }
    }

    return null;
  }

  private @Nullable NodeRegion anyNodeRegionWithinBounds(float touchX, float touchY) {
    for (int i = mNodeRegions.length - 1; i >= 0; --i) {
      NodeRegion nodeRegion = mNodeRegions[i];
      if (nodeRegion.withinBounds(touchX, touchY)) {
        return nodeRegion;
      }
    }

    return null;
  }

  private View ensureViewHasNoParent(View view) {
    ViewParent oldParent = view.getParent();
    if (oldParent != null) {
      throw new RuntimeException(
          "Cannot add view " + view + " to " + this + " while it has a parent " + oldParent);
    }

    return view;
  }

  private void dispatchOnAttached(AttachDetachListener[] listeners) {
    int numListeners = listeners.length;
    if (numListeners == 0) {
      return;
    }

    InvalidateCallback callback = getInvalidateCallback();
    for (AttachDetachListener listener : listeners) {
      listener.onAttached(callback);
    }
  }

  private InvalidateCallback getInvalidateCallback() {
    if (mInvalidateCallback == null) {
      mInvalidateCallback = new InvalidateCallback(this);
    }
    return mInvalidateCallback;
  }

  private static void dispatchOnDetached(AttachDetachListener[] listeners) {
    for (AttachDetachListener listener : listeners) {
      listener.onDetached();
    }
  }

  private ViewGroup.LayoutParams ensureLayoutParams(ViewGroup.LayoutParams lp) {
    if (checkLayoutParams(lp)) {
      return lp;
    }
    return generateDefaultLayoutParams();
  }

  // Returns true if a view is currently animating.
  static boolean animating(View view, Rect clippingRect) {
    Animation animation = view.getAnimation();
    return animation != null && !animation.hasEnded();
  }

  // Return true if a view is currently onscreen.
  static boolean withinBounds(View view, Rect clippingRect) {
    if (view instanceof FlatViewGroup) {
      FlatViewGroup flatChildView = (FlatViewGroup) view;
      return clippingRect.intersects(
          flatChildView.getLeft() + flatChildView.mLogicalAdjustments.left,
          flatChildView.getTop() + flatChildView.mLogicalAdjustments.top,
          flatChildView.getRight() + flatChildView.mLogicalAdjustments.right,
          flatChildView.getBottom() + flatChildView.mLogicalAdjustments.bottom);
    } else {
      return clippingRect.intersects(
          view.getLeft(),
          view.getTop(),
          view.getRight(),
          view.getBottom());
    }
  }

  @Override
  public void updateClippingRect() {
    if (!mRemoveClippedSubviews) {
      return;
    }

    Assertions.assertNotNull(mClippingRect);
    ReactClippingViewGroupHelper.calculateClippingRect(this, mClippingRect);
    if (getParent() != null && mClippingRect.top != mClippingRect.bottom) {
      updateClippingToRect(mClippingRect);
    }
  }

  private void updateClippingToRect(Rect clippingRect) {
    int index = 0;
    boolean needsInvalidate = false;
    for (DrawCommand drawCommand : mDrawCommands) {
      if (drawCommand instanceof DrawView) {
        DrawView drawView = (DrawView) drawCommand;
        View view = mClippedSubviews.get(drawView.reactTag);
        if (view == null) {
          // Not clipped, visible
          view = getChildAt(index++);
          if (!animating(view, clippingRect) && !withinBounds(view, clippingRect)) {
            // Now off the screen.  Don't invalidate in this case, as the canvas should not be
            // redrawn unless new elements are coming onscreen.
            mClippedSubviews.put(view.getId(), view);
            removeViewsInLayout(--index, 1);
            drawView.isViewGroupClipped = true;
          }
        } else {
          // Clipped, invisible.
          if (withinBounds(view, clippingRect)) {
            // Now on the screen.  Invalidate as we have a new element to draw.
            addViewInLayout(
                view,
                index++,
                ensureLayoutParams(view.getLayoutParams()),
                true);
            mClippedSubviews.remove(view.getId());
            drawView.isViewGroupClipped = false;
            needsInvalidate = true;
          }
        }
      }
    }

    if (needsInvalidate) {
      invalidate();
    }
  }

  @Override
  public void getClippingRect(Rect outClippingRect) {
    outClippingRect.set(mClippingRect);
  }

  @Override
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    if (removeClippedSubviews == mRemoveClippedSubviews) {
      return;
    }
    mRemoveClippedSubviews = removeClippedSubviews;
    if (removeClippedSubviews) {
      mClippingRect = new Rect();
      updateClippingRect();
    } else {
      // Add all clipped views back, deallocate additional arrays, remove layoutChangeListener
      Assertions.assertNotNull(mClippingRect);
      getDrawingRect(mClippingRect);
      updateClippingToRect(mClippingRect);
      mClippingRect = null;
    }
  }

  @Override
  public boolean getRemoveClippedSubviews() {
    return mRemoveClippedSubviews;
  }
}
