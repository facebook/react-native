/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.util.SparseArray;
import android.util.SparseIntArray;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.touch.OnInterceptTouchEventListener;
import com.facebook.react.touch.ReactHitSlopView;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactCompoundViewGroup;
import com.facebook.react.uimanager.ReactPointerEventsView;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.views.image.ImageLoadEvent;
import com.facebook.react.uimanager.ReactClippingViewGroup;

/**
 * A view that the {@link FlatShadowNode} hierarchy maps to.  Can mount and draw native views as
 * well as draw commands.  We reuse some of Android's ViewGroup logic, but in Nodes we try to
 * minimize the amount of shadow nodes that map to native children, so we have a lot of logic
 * specific to draw commands.
 *
 * In a very simple case with no Android children, the FlatViewGroup will receive:
 *
 *   flatViewGroup.mountDrawCommands(...);
 *   flatViewGroup.dispatchDraw(...);
 *
 * The draw commands are mounted, then draw iterates through and draws them one by one.
 *
 * In a simple case where there are native children:
 *
 *   flatViewGroup.mountDrawCommands(...);
 *   flatViewGroup.detachAllViewsFromParent(...);
 *   flatViewGroup.mountViews(...);
 *   flatViewGroup.dispatchDraw(...);
 *
 * Draw commands are mounted, with a draw view command for each mounted view.  As an optimization
 * we then detach all views from the FlatViewGroup, then allow mountViews to selectively reattach
 * and add views in order.  We do this as adding a single view is a O(n) operation (On average you
 * have to move all the views in the array to the right one position), as is dropping and re-adding
 * all views (One pass to clear the array and one pass to re-attach detached children and add new
 * children).
 *
 * FlatViewGroups also have arrays of node regions, which are little more than a rects that
 * represents a touch target.  Native views contain their own touch logic, but not all react tags
 * map to native views.  We use node regions to find touch targets among commands as well as nodes
 * which map to native views.
 *
 * In the case of clipping, much of the underlying logic for is handled by
 * {@link DrawCommandManager}.  This lets us separate logic, while also allowing us to save on
 * memory for data structures only used in clipping.  In a case of a clipping FlatViewGroup which
 * is scrolling:
 *
 *   flatViewGroup.setRemoveClippedSubviews(true);
 *   flatViewGroup.mountClippingDrawCommands(...);
 *   flatViewGroup.detachAllViewsFromParent(...);
 *   flatViewGroup.mountViews(...);
 *   flatViewGroup.updateClippingRect(...);
 *   flatViewGroup.dispatchDraw(...);
 *   flatViewGroup.updateClippingRect(...);
 *   flatViewGroup.dispatchDraw(...);
 *   flatViewGroup.updateClippingRect(...);
 *   flatViewGroup.dispatchDraw(...);
 *
 * Setting remove clipped subviews creates a {@link DrawCommandManager} to handle clipping, which
 * allows the rest of the methods to simply call in to draw command manager to handle the clipping
 * logic.
 */
/* package */ final class FlatViewGroup extends ViewGroup
    implements ReactInterceptingViewGroup, ReactClippingViewGroup,
    ReactCompoundViewGroup, ReactHitSlopView, ReactPointerEventsView, FlatMeasuredViewGroup {
  /**
   * Helper class that allows our AttachDetachListeners to invalidate the hosting View.  When a
   * listener gets an attach it is passed an invalidate callback for the FlatViewGroup it is being
   * attached to.
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

    /**
     * Propagates image load events to javascript if the hosting view is still alive.
     *
     * @param reactTag The view id.
     * @param imageLoadEvent The event type.
     */
    public void dispatchImageLoadEvent(int reactTag, int imageLoadEvent) {
      FlatViewGroup view = get();
      if (view == null) {
        return;
      }

      ReactContext reactContext = ((ReactContext) view.getContext());
      UIManagerModule uiManagerModule = reactContext.getNativeModule(UIManagerModule.class);
      uiManagerModule.getEventDispatcher().dispatchEvent(
          new ImageLoadEvent(reactTag, imageLoadEvent));
    }
  }

  // Draws the name of the draw commands at the bottom right corner of it's bounds.
  private static final boolean DEBUG_DRAW_TEXT = false;
  // Draws colored rectangles over known performance issues.
  /* package */ static final boolean DEBUG_HIGHLIGHT_PERFORMANCE_ISSUES = false;
  // Force layout bounds drawing.  This can also be enabled by turning on layout bounds in Android.
  private static final boolean DEBUG_DRAW = DEBUG_DRAW_TEXT || DEBUG_HIGHLIGHT_PERFORMANCE_ISSUES;
  // Resources for debug drawing.
  private boolean mAndroidDebugDraw;
  private static Paint sDebugTextPaint;
  private static Paint sDebugTextBackgroundPaint;
  private static Paint sDebugRectPaint;
  private static Paint sDebugCornerPaint;
  private static Rect sDebugRect;

  private static final ArrayList<FlatViewGroup> LAYOUT_REQUESTS = new ArrayList<>();
  private static final Rect VIEW_BOUNDS = new Rect();

  // An invalidate callback singleton for this FlatViewGroup.
  private @Nullable InvalidateCallback mInvalidateCallback;
  private DrawCommand[] mDrawCommands = DrawCommand.EMPTY_ARRAY;
  private AttachDetachListener[] mAttachDetachListeners = AttachDetachListener.EMPTY_ARRAY;
  private NodeRegion[] mNodeRegions = NodeRegion.EMPTY_ARRAY;

  // The index of the next native child to draw.  This is used in dispatchDraw to check that we are
  // actually drawing all of our attached children, then is reset to 0.
  private int mDrawChildIndex = 0;
  private boolean mIsAttached = false;
  private boolean mIsLayoutRequested = false;
  private boolean mNeedsOffscreenAlphaCompositing = false;
  private Drawable mHotspot;
  private PointerEvents mPointerEvents = PointerEvents.AUTO;
  private long mLastTouchDownTime;
  private @Nullable OnInterceptTouchEventListener mOnInterceptTouchEventListener;

  private static final SparseArray<View> EMPTY_DETACHED_VIEWS = new SparseArray<>(0);
  // Provides clipping, drawing and node region finding logic if subview clipping is enabled.
  private @Nullable DrawCommandManager mDrawCommandManager;

  private @Nullable Rect mHitSlopRect;

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
    /*
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

  /**
   * Secretly Overrides the hidden ViewGroup.onDebugDraw method.  This is hidden in the Android
   * ViewGroup, but still gets called in super.dispatchDraw.  Overriding here allows us to draw
   * layout bounds for Nodes when android is drawing layout bounds.
   */
  protected void onDebugDraw(Canvas canvas) {
    // Android is drawing layout bounds, so we should as well.
    mAndroidDebugDraw = true;
  }

  /**
   * Draw FlatViewGroup on a canvas.  Also checks that all children are drawn, as a draw view calls
   * back to the FlatViewGroup to draw each child.
   *
   * @param canvas The canvas to draw on.
   */
  @Override
  public void dispatchDraw(Canvas canvas) {
    mAndroidDebugDraw = false;
    super.dispatchDraw(canvas);

    if (mDrawCommandManager != null) {
      mDrawCommandManager.draw(canvas);
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

  /**
   * Draws layout bounds for debug.  Optionally can draw the name of the DrawCommand so you can
   * distinguish commands easier.
   *
   * @param canvas The canvas to draw on.
   */
  private void debugDraw(Canvas canvas) {
    if (mDrawCommandManager != null) {
      mDrawCommandManager.debugDraw(canvas);
    } else {
      for (DrawCommand drawCommand : mDrawCommands) {
        drawCommand.debugDraw(this, canvas);
      }
    }
    mDrawChildIndex = 0;
  }

  /**
   * This override exists to suppress the default drawing behaviour of the ViewGroup.  dispatchDraw
   * calls super.dispatchDraw, which lets Android perform some of our child management logic.
   * super.dispatchDraw then calls our drawChild, which is suppressed.
   *
   * dispatchDraw within the FlatViewGroup then calls super.drawChild, which actually draws the
   * child.
   *
   *   // Pseudocode example.
   *   Class FlatViewGroup {
   *     void dispatchDraw() {
   *       super.dispatchDraw(); // Eventually calls our drawChild, which is a no op.
   *       super.drawChild();    // Calls the actual drawChild.
   *     }
   *
   *     boolean drawChild(...) {
   *       // No op.
   *     }
   *   }
   *
   *   Class ViewGroup {
   *     void dispatchDraw() {
   *       drawChild(); // No op.
   *     }
   *
   *     boolean drawChild(...) {
   *       getChildAt(...).draw();
   *     }
   *   }
   *
   * @return false, as we are suppressing drawChild.
   */
  @Override
  protected boolean drawChild(Canvas canvas, View child, long drawingTime) {
    // suppress
    // no drawing -> no invalidate -> return false
    return false;
  }

  /**
   * Draw layout bounds for the next child.
   *
   * @param canvas The canvas to draw on.
   */
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
  /* package */ int dipsToPixels(int dips) {
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

  /**
   * Makes sure that we only initialize one instance of each of our layout bounds drawing
   * resources.
   */
  private void initDebugDrawResources() {
    if (sDebugTextPaint == null) {
      sDebugTextPaint = new Paint();
      sDebugTextPaint.setTextAlign(Paint.Align.RIGHT);
      sDebugTextPaint.setTextSize(dipsToPixels(9));
      sDebugTextPaint.setTypeface(Typeface.MONOSPACE);
      sDebugTextPaint.setAntiAlias(true);
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

  /**
   * Used in drawing layout bounds, draws a layout bounds rectangle similar to the Android default
   * implementation, with a specifiable border color.
   *
   * @param canvas The canvas to draw on.
   * @param color The border color of the layout bounds.
   * @param left Left bound of the rectangle.
   * @param top Top bound of the rectangle.
   * @param right Right bound of the rectangle.
   * @param bottom Bottom bound of the rectangle.
   */
  private void debugDrawRect(
      Canvas canvas,
      int color,
      float left,
      float top,
      float right,
      float bottom) {
    debugDrawNamedRect(canvas, color, "", left, top, right, bottom);
  }

  /**
   * Used in drawing layout bounds, draws a layout bounds rectangle similar to the Android default
   * implementation, with a specifiable border color.  Also draws a name text in the bottom right
   * corner of the rectangle if DEBUG_DRAW_TEXT is set.
   *
   * @param canvas The canvas to draw on.
   * @param color The border color of the layout bounds.
   * @param name Name to be drawn on top of the rectangle if DEBUG_DRAW_TEXT is set.
   * @param left Left bound of the rectangle.
   * @param top Top bound of the rectangle.
   * @param right Right bound of the rectangle.
   * @param bottom Bottom bound of the rectangle.
   */
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
      // This is possible, unfortunately.
      return;
    }

    mIsAttached = true;

    super.onAttachedToWindow();
    dispatchOnAttached(mAttachDetachListeners);

    // This is a no op if we aren't clipping, so let updateClippingRect handle the check for us.
    updateClippingRect();
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

    // This is a no op if we aren't clipping, so let updateClippingRect handle the check for us.
    updateClippingRect();
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

  /**
   * Draws the next child of the FlatViewGroup.  Each draw view calls FlatViewGroup.drawNextChild,
   * which keeps track of the current child index to draw.
   *
   * @param canvas The canvas to draw on.
   */
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

  /**
   * Mount a list of draw commands to this FlatViewGroup.  Draw commands sometimes map to a view,
   * as in the case of {@link DrawView}, and sometimes to a simple canvas operation.  We only
   * receive a call to mount draw commands when our commands have changed, so we always invalidate.
   *
   * A call to mount draw commands will only be followed by a call to mount views if the draw view
   * commands within the draw command array have changed since last mount.
   *
   * @param drawCommands The draw commands to mount.
   */
  /* package */ void mountDrawCommands(DrawCommand[] drawCommands) {
    mDrawCommands = drawCommands;
    invalidate();
  }

  /**
   * Mount a list of draw commands to this FlatViewGroup, which is clipping subviews.  Clipping
   * logic is handled by a {@link DrawCommandManager}, which provides a better explanation of
   * these arguments and logic.
   *
   * A call to mount draw commands will only be followed by a call to mount views if the draw view
   * commands within the draw command array have changed since last mount, which is indicated here
   * by willMountViews.
   *
   * @param drawCommands The draw commands to mount.
   * @param drawViewIndexMap See {@link DrawCommandManager}.
   * @param maxBottom See {@link DrawCommandManager}.
   * @param minTop See {@link DrawCommandManager}.
   * @param willMountViews True if we will also receive a mountViews call.  If we are going to
   *   receive a call to mount views, that will take care of updating the commands that are
   *   currently onscreen, otherwise we need to update the onscreen commands.
   */
  /* package */ void mountClippingDrawCommands(
      DrawCommand[] drawCommands,
      SparseIntArray drawViewIndexMap,
      float[] maxBottom,
      float[] minTop,
      boolean willMountViews) {
    Assertions.assertNotNull(mDrawCommandManager).mountDrawCommands(
        drawCommands,
        drawViewIndexMap,
        maxBottom,
        minTop,
        willMountViews);
    invalidate();
  }

  /**
   * Handle a subview being dropped
   * In most cases, we are informed about a subview being dropped via mountViews, but in some
   * cases (such as when both the child and parent get explicit removes in the same frame),
   * we may not find out, so this is called when the child is dropped so the parent can clean up
   * strong references to the child.
   *
   * @param view the view being dropped
   */
  void onViewDropped(View view) {
    if (mDrawCommandManager != null) {
      // for now, we only care about clearing clipped subview references
      mDrawCommandManager.onClippedViewDropped(view);
    }
  }

  /**
   * Return the NodeRegion which matches a reactTag, or EMPTY if none match.
   *
   * @param reactTag The reactTag to look for
   * @return The matching NodeRegion, or NodeRegion.EMPTY if none match.
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
   * @return A Collection of Views to clean up.
   */
  /* package */ SparseArray<View> getDetachedViews() {
    if (mDrawCommandManager == null) {
      return EMPTY_DETACHED_VIEWS;
    }
    return mDrawCommandManager.getDetachedViews();
  }

  /**
   * Remove the detached view from the parent
   * This is used in the DrawCommandManagers and during cleanup to trigger onDetachedFromWindow on
   * any views that were in a temporary detached state due to them being clipped. This is called
   * for cleanup of said views by FlatNativeViewHierarchyManager.
   *
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

  /**
   * Mounts attach detach listeners to a FlatViewGroup.  The Nodes spec states that children and
   * commands deal gracefully with multiple attaches and detaches, and as long as:
   *
   *   attachCount - detachCount > 0
   *
   * Then children still consider themselves as attached.
   *
   * @param listeners The listeners to mount.
   */
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

  /**
   * Mount node regions to a FlatViewGroup.  A node region is a touch target for a react tag.  As
   * not all react tags map to a view, we use node regions to determine whether a non-native region
   * should receive a touch.
   *
   * @param nodeRegions The node regions to mount.
   */
  /* package */ void mountNodeRegions(NodeRegion[] nodeRegions) {
    mNodeRegions = nodeRegions;
  }

  /**
   * Mount node regions in clipping.  See {@link DrawCommandManager} for more complete
   * documentation.
   *
   * @param nodeRegions The node regions to mount.
   * @param maxBottom See {@link DrawCommandManager}.
   * @param minTop See {@link DrawCommandManager}.
   */
  /* package */ void mountClippingNodeRegions(
      NodeRegion[] nodeRegions,
      float[] maxBottom,
      float[] minTop) {
    mNodeRegions = nodeRegions;
    Assertions.assertNotNull(mDrawCommandManager).mountNodeRegions(nodeRegions, maxBottom, minTop);
  }

  /**
   * Mount a list of views to add, and dismount a list of views to detach.  Ids will not appear in
   * both lists, aka:
   *   Set(viewsToAdd + viewsToDetach).size() == viewsToAdd.length + viewsToDetach.length
   *
   * Every time we get any change in the views in a FlatViewGroup, we detach all views first, then
   * reattach / remove them as needed.  viewsToAdd is odd in that the ids also specify whether
   * the view is new to us, or if we were already the parent.  If it is new to us, then the id has
   * a positive value, otherwise we are already the parent, but it was previously detached, since
   * we detach everything when anything changes.
   *
   * The reason we detach everything is that a single detach is on the order of O(n), as in the
   * average case we have to move half of the views one position to the right, and a single add is
   * the same.  Removing all views is also on the order of O(n), as you delete everything backward
   * from the end, while adding a new set of views is also on the order of O(n), as you just add
   * them all back in order.  ArrayLists are weird.
   *
   * @param viewResolver Resolves the views from their id.
   * @param viewsToAdd id of views to add if they weren't just attached to us, or -id if they are
   *     just being reattached.
   * @param viewsToDetach id of views that we don't own anymore.  They either moved to a new parent,
   *     or are being removed entirely.
   */
  /* package */ void mountViews(ViewResolver viewResolver, int[] viewsToAdd, int[] viewsToDetach) {
    if (mDrawCommandManager != null) {
      mDrawCommandManager.mountViews(viewResolver, viewsToAdd, viewsToDetach);
    } else {
      for (int viewToAdd : viewsToAdd) {
        if (viewToAdd > 0) {
          View view = viewResolver.getView(viewToAdd);
          ensureViewHasNoParent(view);
          addViewInLayout(view);
        } else {
          View view = viewResolver.getView(-viewToAdd);
          ensureViewHasNoParent(view);
          // We aren't clipping, so attach all the things, clipping is handled by the draw command
          // manager, if we have one.
          attachViewToParent(view);
        }
      }

      for (int viewToDetach : viewsToDetach) {
        View view = viewResolver.getView(viewToDetach);
        if (view.getParent() != null) {
          throw new RuntimeException("Trying to remove view not owned by FlatViewGroup");
        } else {
          removeDetachedView(view, false);
        }
      }
    }

    invalidate();
  }

  /**
   * Exposes the protected addViewInLayout call for the {@link DrawCommandManager}.
   *
   * @param view The view to add.
   */
  /* package */ void addViewInLayout(View view) {
    addViewInLayout(view, -1, ensureLayoutParams(view.getLayoutParams()), true);
  }

  /**
   * Exposes the protected addViewInLayout call for the {@link DrawCommandManager}.
   *
   * @param view The view to add.
   * @param index The index position at which to add this child.
   */
  /* package */ void addViewInLayout(View view, int index) {
    addViewInLayout(view, index, ensureLayoutParams(view.getLayoutParams()), true);
  }

  /**
   * Exposes the protected attachViewToParent call for the {@link DrawCommandManager}.
   *
   * @param view The view to attach.
   */
  /* package */ void attachViewToParent(View view) {
    attachViewToParent(view, -1, ensureLayoutParams(view.getLayoutParams()));
  }

  /**
   * Exposes the protected attachViewToParent call for the {@link DrawCommandManager}.
   *
   * @param view The view to attach.
   * @param index The index position at which to attach this child.
   */
  /* package */ void attachViewToParent(View view, int index) {
    attachViewToParent(view, index, ensureLayoutParams(view.getLayoutParams()));
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

  /**
   * Called after the view hierarchy is updated in {@link StateBuilder}, to process all the
   * FlatViewGroups that have requested layout.
   */
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
      // This is technically a dupe, since the DrawView has its bounds, but leaving in to handle if
      // the View is animating or rebelling against the DrawView bounds for some reason.
      View child = getChildAt(i);
      left = Math.min(left, child.getLeft());
      top = Math.min(top, child.getTop());
      right = Math.max(right, child.getRight());
      bottom = Math.max(bottom, child.getBottom());
    }

    for (DrawCommand mDrawCommand : mDrawCommands) {
      if (!(mDrawCommand instanceof AbstractDrawCommand)) {
        continue;
      }
      AbstractDrawCommand drawCommand = (AbstractDrawCommand) mDrawCommand;
      left = Math.min(left, Math.round(drawCommand.getLeft()));
      top = Math.min(top, Math.round(drawCommand.getTop()));
      right = Math.max(right, Math.round(drawCommand.getRight()));
      bottom = Math.max(bottom, Math.round(drawCommand.getBottom()));
    }
    return new Rect(left, top, right, bottom);
  }

  /**
   * Searches for a virtual node region matching the specified x and y touch.  Virtual in this case
   * means simply that the node region represents a command, rather than a native view.
   *
   * @param touchX The touch x coordinate.
   * @param touchY The touch y coordinate.
   * @return A virtual node region matching the specified touch, or null if no regions match.
   */
  private @Nullable NodeRegion virtualNodeRegionWithinBounds(float touchX, float touchY) {
    if (mDrawCommandManager != null) {
      return mDrawCommandManager.virtualNodeRegionWithinBounds(touchX, touchY);
    }
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

  /**
   * Searches for a node region matching the specified x and y touch.  Will search regions which
   * representing both commands and native views.
   *
   * @param touchX The touch x coordinate.
   * @param touchY The touch y coordinate.
   * @return A node region matching the specified touch, or null if no regions match.
   */
  private @Nullable NodeRegion anyNodeRegionWithinBounds(float touchX, float touchY) {
    if (mDrawCommandManager != null) {
      return mDrawCommandManager.anyNodeRegionWithinBounds(touchX, touchY);
    }
    for (int i = mNodeRegions.length - 1; i >= 0; --i) {
      NodeRegion nodeRegion = mNodeRegions[i];
      if (nodeRegion.withinBounds(touchX, touchY)) {
        return nodeRegion;
      }
    }

    return null;
  }

  private static void ensureViewHasNoParent(View view) {
    ViewParent oldParent = view.getParent();
    if (oldParent != null) {
      throw new RuntimeException(
          "Cannot add view " + view + " to FlatViewGroup while it has a parent " + oldParent);
    }
  }

  /**
   * Propagate attach to a list of listeners, passing a callback by which they can invalidate.
   *
   * @param listeners List of listeners to attach.
   */
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

  /**
   * Get an invalidate callback singleton for this view instance.
   *
   * @return Invalidate callback singleton.
   */
  private InvalidateCallback getInvalidateCallback() {
    if (mInvalidateCallback == null) {
      mInvalidateCallback = new InvalidateCallback(this);
    }
    return mInvalidateCallback;
  }

  /**
   * Propagate detach to a list of listeners.
   *
   * @param listeners List of listeners to detach.
   */
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

  @Override
  public void updateClippingRect() {
    if (mDrawCommandManager == null) {
      // Don't update the clipping rect if we aren't clipping.
      return;
    }
    if (mDrawCommandManager.updateClippingRect()) {
      // Manager says something changed.
      invalidate();
    }
  }

  @Override
  public void getClippingRect(Rect outClippingRect) {
    if (mDrawCommandManager == null) {
      // We could call outClippingRect.set(null) here, but throw in case the underlying React Native
      // behaviour changes without us knowing.
      throw new RuntimeException(
          "Trying to get the clipping rect for a non-clipping FlatViewGroup");
    }
     mDrawCommandManager.getClippingRect(outClippingRect);
  }

  @Override
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    boolean currentlyClipping = getRemoveClippedSubviews();
    if (removeClippedSubviews == currentlyClipping) {
      // We aren't changing state, so don't do anything.
      return;
    }
    if (currentlyClipping) {
      // Trying to go from a clipping to a non-clipping state, not currently supported by Nodes.
      // If this is an issue, let us know, but currently there does not seem to be a good case for
      // supporting this.
      throw new RuntimeException(
          "Trying to transition FlatViewGroup from clipping to non-clipping state");
    }
    mDrawCommandManager = DrawCommandManager.getVerticalClippingInstance(this, mDrawCommands);
    mDrawCommands = DrawCommand.EMPTY_ARRAY;
    // We don't need an invalidate here because this can't cause new views to come onscreen, since
    // everything was unclipped.
  }

  @Override
  public boolean getRemoveClippedSubviews() {
    return mDrawCommandManager != null;
  }

  @Override
  public @Nullable Rect getHitSlopRect() {
    return mHitSlopRect;
  }

  /* package */ void setHitSlopRect(@Nullable Rect rect) {
    mHitSlopRect = rect;
  }
}
