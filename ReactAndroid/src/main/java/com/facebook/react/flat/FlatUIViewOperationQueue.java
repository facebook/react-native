/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import com.facebook.react.uimanager.UIViewOperationQueue;
import android.util.SparseIntArray;
import android.view.View;
import android.view.ViewGroup;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NoSuchNativeViewException;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.TouchTargetHelper;
import com.facebook.react.uimanager.UIViewOperationQueue;
import java.util.ArrayList;
import javax.annotation.Nullable;

/**
 * FlatUIViewOperationQueue extends {@link UIViewOperationQueue} to add
 * FlatUIImplementation-specific methods that need to run in UI thread.
 */
/* package */ final class FlatUIViewOperationQueue extends UIViewOperationQueue {

  private static final int[] MEASURE_BUFFER = new int[4];

  private final FlatNativeViewHierarchyManager mNativeViewHierarchyManager;
  private final ProcessLayoutRequests mProcessLayoutRequests = new ProcessLayoutRequests();

  private final class ProcessLayoutRequests implements UIViewOperationQueue.UIOperation {
    @Override
    public void execute() {
      FlatViewGroup.processLayoutRequests();
    }
  }

  /**
   * UIOperation that updates DrawCommands for a View defined by reactTag.
   */
  private final class UpdateMountState implements UIViewOperationQueue.UIOperation {

    private final int mReactTag;
    private final @Nullable DrawCommand[] mDrawCommands;
    private final @Nullable AttachDetachListener[] mAttachDetachListeners;
    private final @Nullable NodeRegion[] mNodeRegions;

    private UpdateMountState(
        int reactTag,
        @Nullable DrawCommand[] drawCommands,
        @Nullable AttachDetachListener[] listeners,
        @Nullable NodeRegion[] nodeRegions) {
      mReactTag = reactTag;
      mDrawCommands = drawCommands;
      mAttachDetachListeners = listeners;
      mNodeRegions = nodeRegions;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateMountState(
          mReactTag,
          mDrawCommands,
          mAttachDetachListeners,
          mNodeRegions);
    }
  }

  /**
   * UIOperation that updates DrawCommands for a View defined by reactTag.
   */
  private final class UpdateClippingMountState implements UIViewOperationQueue.UIOperation {

    private final int mReactTag;
    private final @Nullable DrawCommand[] mDrawCommands;
    private final SparseIntArray mDrawViewIndexMap;
    private final float[] mCommandMaxBot;
    private final float[] mCommandMinTop;
    private final @Nullable AttachDetachListener[] mAttachDetachListeners;
    private final @Nullable NodeRegion[] mNodeRegions;
    private final float[] mRegionMaxBot;
    private final float[] mRegionMinTop;
    private final boolean mWillMountViews;

    private UpdateClippingMountState(
        int reactTag,
        @Nullable DrawCommand[] drawCommands,
        SparseIntArray drawViewIndexMap,
        float[] commandMaxBot,
        float[] commandMinTop,
        @Nullable AttachDetachListener[] listeners,
        @Nullable NodeRegion[] nodeRegions,
        float[] regionMaxBot,
        float[] regionMinTop,
        boolean willMountViews) {
      mReactTag = reactTag;
      mDrawCommands = drawCommands;
      mDrawViewIndexMap = drawViewIndexMap;
      mCommandMaxBot = commandMaxBot;
      mCommandMinTop = commandMinTop;
      mAttachDetachListeners = listeners;
      mNodeRegions = nodeRegions;
      mRegionMaxBot = regionMaxBot;
      mRegionMinTop = regionMinTop;
      mWillMountViews = willMountViews;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateClippingMountState(
          mReactTag,
          mDrawCommands,
          mDrawViewIndexMap,
          mCommandMaxBot,
          mCommandMinTop,
          mAttachDetachListeners,
          mNodeRegions,
          mRegionMaxBot,
          mRegionMinTop,
          mWillMountViews);
    }
  }

  private final class UpdateViewGroup implements UIViewOperationQueue.UIOperation {

    private final int mReactTag;
    private final int[] mViewsToAdd;
    private final int[] mViewsToDetach;

    private UpdateViewGroup(int reactTag, int[] viewsToAdd, int[] viewsToDetach) {
      mReactTag = reactTag;
      mViewsToAdd = viewsToAdd;
      mViewsToDetach = viewsToDetach;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateViewGroup(mReactTag, mViewsToAdd, mViewsToDetach);
    }
  }

  /**
   * UIOperation that updates View bounds for a View defined by reactTag.
   */
  public final class UpdateViewBounds implements UIViewOperationQueue.UIOperation {

    private final int mReactTag;
    private final int mLeft;
    private final int mTop;
    private final int mRight;
    private final int mBottom;

    private UpdateViewBounds(int reactTag, int left, int top, int right, int bottom) {
      mReactTag = reactTag;
      mLeft = left;
      mTop = top;
      mRight = right;
      mBottom = bottom;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateViewBounds(mReactTag, mLeft, mTop, mRight, mBottom);
    }
  }

  private final class SetPadding implements UIViewOperationQueue.UIOperation {

    private final int mReactTag;
    private final int mPaddingLeft;
    private final int mPaddingTop;
    private final int mPaddingRight;
    private final int mPaddingBottom;

    private SetPadding(
        int reactTag,
        int paddingLeft,
        int paddingTop,
        int paddingRight,
        int paddingBottom) {
      mReactTag = reactTag;
      mPaddingLeft = paddingLeft;
      mPaddingTop = paddingTop;
      mPaddingRight = paddingRight;
      mPaddingBottom = paddingBottom;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.setPadding(
          mReactTag,
          mPaddingLeft,
          mPaddingTop,
          mPaddingRight,
          mPaddingBottom);
    }
  }

  private final class DropViews implements UIViewOperationQueue.UIOperation {

    private final SparseIntArray mViewsToDrop;

    private DropViews(ArrayList<Integer> viewsToDrop, ArrayList<Integer> parentsForViewsToDrop) {
      SparseIntArray sparseIntArray = new SparseIntArray();
      for (int i = 0, count = viewsToDrop.size(); i < count; i++) {
        sparseIntArray.put(viewsToDrop.get(i), parentsForViewsToDrop.get(i));
      }
      mViewsToDrop = sparseIntArray;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.dropViews(mViewsToDrop);
    }
  }

  private final class MeasureVirtualView implements UIViewOperationQueue.UIOperation {

    private final int mReactTag;
    private final float mScaledX;
    private final float mScaledY;
    private final float mScaledWidth;
    private final float mScaledHeight;
    private final Callback mCallback;
    private final boolean mRelativeToWindow;

    private MeasureVirtualView(
        int reactTag,
        float scaledX,
        float scaledY,
        float scaledWidth,
        float scaledHeight,
        boolean relativeToWindow,
        Callback callback) {
      mReactTag = reactTag;
      mScaledX = scaledX;
      mScaledY = scaledY;
      mScaledWidth = scaledWidth;
      mScaledHeight = scaledHeight;
      mCallback = callback;
      mRelativeToWindow = relativeToWindow;
    }

    @Override
    public void execute() {
      try {
        // Measure native View
        if (mRelativeToWindow) {
          // relative to the window
          mNativeViewHierarchyManager.measureInWindow(mReactTag, MEASURE_BUFFER);
        } else {
          // relative to the root view
          mNativeViewHierarchyManager.measure(mReactTag, MEASURE_BUFFER);
        }
      } catch (NoSuchNativeViewException noSuchNativeViewException) {
        // Invoke with no args to signal failure and to allow JS to clean up the callback
        // handle.
        mCallback.invoke();
        return;
      }

      float nativeViewX = MEASURE_BUFFER[0];
      float nativeViewY = MEASURE_BUFFER[1];
      float nativeViewWidth = MEASURE_BUFFER[2];
      float nativeViewHeight = MEASURE_BUFFER[3];

      // Calculate size of the virtual child inside native View.
      float x = PixelUtil.toDIPFromPixel(mScaledX * nativeViewWidth + nativeViewX);
      float y = PixelUtil.toDIPFromPixel(mScaledY * nativeViewHeight + nativeViewY);
      float width = PixelUtil.toDIPFromPixel(mScaledWidth * nativeViewWidth);
      float height = PixelUtil.toDIPFromPixel(mScaledHeight * nativeViewHeight);

      if (mRelativeToWindow) {
        mCallback.invoke(x, y, width, height);
      } else {
        mCallback.invoke(0, 0, width, height, x, y);
      }
    }
  }

  public final class DetachAllChildrenFromViews implements UIViewOperationQueue.UIOperation {
    private @Nullable int[] mViewsToDetachAllChildrenFrom;

    public void setViewsToDetachAllChildrenFrom(int[] viewsToDetachAllChildrenFrom) {
      mViewsToDetachAllChildrenFrom = viewsToDetachAllChildrenFrom;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.detachAllChildrenFromViews(mViewsToDetachAllChildrenFrom);
    }
  }

  private final class FindTargetForTouchOperation implements UIViewOperationQueue.UIOperation {

    private final int mReactTag;
    private final float mTargetX;
    private final float mTargetY;
    private final Callback mCallback;
    private final int[] NATIVE_VIEW_BUFFER = new int[1];

    private FindTargetForTouchOperation(
        final int reactTag,
        final float targetX,
        final float targetY,
        final Callback callback) {
      super();
      mReactTag = reactTag;
      mTargetX = targetX;
      mTargetY = targetY;
      mCallback = callback;
    }

    @Override
    public void execute() {
      try {
        mNativeViewHierarchyManager.measure(mReactTag, MEASURE_BUFFER);
      } catch (IllegalViewOperationException e) {
        mCallback.invoke();
        return;
      }

      // Because React coordinates are relative to root container, and measure() operates
      // on screen coordinates, we need to offset values using root container location.
      final float containerX = (float) MEASURE_BUFFER[0];
      final float containerY = (float) MEASURE_BUFFER[1];

      View view = mNativeViewHierarchyManager.getView(mReactTag);
      final int touchTargetReactTag = TouchTargetHelper.findTargetTagForTouch(
          mTargetX,
          mTargetY,
          (ViewGroup) view,
          NATIVE_VIEW_BUFFER);

      try {
        mNativeViewHierarchyManager.measure(
            NATIVE_VIEW_BUFFER[0],
            MEASURE_BUFFER);
      } catch (IllegalViewOperationException e) {
        mCallback.invoke();
        return;
      }

      NodeRegion region = NodeRegion.EMPTY;
      boolean isNativeView = NATIVE_VIEW_BUFFER[0] == touchTargetReactTag;
      if (!isNativeView) {
        // NATIVE_VIEW_BUFFER[0] is a FlatViewGroup, touchTargetReactTag is the touch target and
        // isn't an Android View - try to get its NodeRegion
        view = mNativeViewHierarchyManager.getView(NATIVE_VIEW_BUFFER[0]);
        if (view instanceof FlatViewGroup) {
          region = ((FlatViewGroup) view).getNodeRegionForTag(mReactTag);
        }
      }

      int resultTag = region == NodeRegion.EMPTY ? touchTargetReactTag : region.mTag;
      float x = PixelUtil.toDIPFromPixel(region.getLeft() + MEASURE_BUFFER[0] - containerX);
      float y = PixelUtil.toDIPFromPixel(region.getTop() + MEASURE_BUFFER[1] - containerY);
      float width = PixelUtil.toDIPFromPixel(isNativeView ?
          MEASURE_BUFFER[2] : region.getRight() - region.getLeft());
      float height = PixelUtil.toDIPFromPixel(isNativeView ?
          MEASURE_BUFFER[3] : region.getBottom() - region.getTop());
      mCallback.invoke(resultTag, x, y, width, height);
    }
  }

  /**
   * Used to delay view manager command dispatch until after the view hierarchy is updated.
   * Mirrors command operation dispatch, but is only used in Nodes for view manager commands.
   */
  public final class ViewManagerCommand implements UIViewOperationQueue.UIOperation {

    private final int mReactTag;
    private final int mCommand;
    private final @Nullable ReadableArray mArgs;

    public ViewManagerCommand(
        int reactTag,
        int command,
        @Nullable ReadableArray args) {
      mReactTag = reactTag;
      mCommand = command;
      mArgs = args;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.dispatchCommand(mReactTag, mCommand, mArgs);
    }
  }

  public FlatUIViewOperationQueue(
      ReactApplicationContext reactContext,
      FlatNativeViewHierarchyManager nativeViewHierarchyManager,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    super(reactContext, nativeViewHierarchyManager, minTimeLeftInFrameForNonBatchedOperationMs);

    mNativeViewHierarchyManager = nativeViewHierarchyManager;
  }

  /**
   * Enqueues a new UIOperation that will update DrawCommands for a View defined by reactTag.
   */
  public void enqueueUpdateMountState(
      int reactTag,
      @Nullable DrawCommand[] drawCommands,
      @Nullable AttachDetachListener[] listeners,
      @Nullable NodeRegion[] nodeRegions) {
    enqueueUIOperation(new UpdateMountState(
        reactTag,
        drawCommands,
        listeners,
        nodeRegions));
  }

  /**
   * Enqueues a new UIOperation that will update DrawCommands for a View defined by reactTag.
   */
  public void enqueueUpdateClippingMountState(
      int reactTag,
      @Nullable DrawCommand[] drawCommands,
      SparseIntArray drawViewIndexMap,
      float[] commandMaxBot,
      float[] commandMinTop,
      @Nullable AttachDetachListener[] listeners,
      @Nullable NodeRegion[] nodeRegions,
      float[] regionMaxBot,
      float[] regionMinTop,
      boolean willMountViews) {
    enqueueUIOperation(new UpdateClippingMountState(
        reactTag,
        drawCommands,
        drawViewIndexMap,
        commandMaxBot,
        commandMinTop,
        listeners,
        nodeRegions,
        regionMaxBot,
        regionMinTop,
        willMountViews));
  }

  public void enqueueUpdateViewGroup(int reactTag, int[] viewsToAdd, int[] viewsToDetach) {
    enqueueUIOperation(new UpdateViewGroup(reactTag, viewsToAdd, viewsToDetach));
  }

  /**
   * Creates a new UIOperation that will update View bounds for a View defined by reactTag.
   */
  public UpdateViewBounds createUpdateViewBounds(
      int reactTag,
      int left,
      int top,
      int right,
      int bottom) {
    return new UpdateViewBounds(reactTag, left, top, right, bottom);
  }

  public ViewManagerCommand createViewManagerCommand(
      int reactTag,
      int command,
      @Nullable ReadableArray args) {
    return new ViewManagerCommand(reactTag, command, args);
  }

  /* package */ void enqueueFlatUIOperation(UIViewOperationQueue.UIOperation operation) {
    enqueueUIOperation(operation);
  }

  public void enqueueSetPadding(
      int reactTag,
      int paddingLeft,
      int paddingTop,
      int paddingRight,
      int paddingBottom) {
    enqueueUIOperation(
        new SetPadding(reactTag, paddingLeft, paddingTop, paddingRight, paddingBottom));
  }

  public void enqueueDropViews(
      ArrayList<Integer> viewsToDrop,
      ArrayList<Integer> parentsOfViewsToDrop) {
    enqueueUIOperation(new DropViews(viewsToDrop, parentsOfViewsToDrop));
  }

  public void enqueueMeasureVirtualView(
      int reactTag,
      float scaledX,
      float scaledY,
      float scaledWidth,
      float scaledHeight,
      boolean relativeToWindow,
      Callback callback) {
    enqueueUIOperation(new MeasureVirtualView(
        reactTag,
        scaledX,
        scaledY,
        scaledWidth,
        scaledHeight,
        relativeToWindow,
        callback));
  }

  public void enqueueProcessLayoutRequests() {
    enqueueUIOperation(mProcessLayoutRequests);
  }

  public DetachAllChildrenFromViews enqueueDetachAllChildrenFromViews() {
    DetachAllChildrenFromViews op = new DetachAllChildrenFromViews();
    enqueueUIOperation(op);
    return op;
  }

  @Override
  public void enqueueFindTargetForTouch(
      final int reactTag,
      final float targetX,
      final float targetY,
      final Callback callback) {
    enqueueUIOperation(
        new FindTargetForTouchOperation(reactTag, targetX, targetY, callback));
  }
}
