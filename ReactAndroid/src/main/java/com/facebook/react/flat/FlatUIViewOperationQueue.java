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

import android.graphics.Rect;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.NoSuchNativeViewException;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIViewOperationQueue;

/**
 * FlatUIViewOperationQueue extends {@link UIViewOperationQueue} to add
 * FlatUIImplementation-specific methods that need to run in UI thread.
 */
/* package */ final class FlatUIViewOperationQueue extends UIViewOperationQueue {

  private static final int[] MEASURE_BUFFER = new int[4];

  private final FlatNativeViewHierarchyManager mNativeViewHierarchyManager;
  private final ProcessLayoutRequests mProcessLayoutRequests = new ProcessLayoutRequests();

  private final class ProcessLayoutRequests implements UIOperation {
    @Override
    public void execute() {
      FlatViewGroup.processLayoutRequests();
    }
  }

  /**
   * UIOperation that updates DrawCommands for a View defined by reactTag.
   */
  private final class UpdateMountState implements UIOperation {

    private final int mReactTag;
    private final @Nullable DrawCommand[] mDrawCommands;
    private final @Nullable AttachDetachListener[] mAttachDetachListeners;
    private final @Nullable NodeRegion[] mNodeRegions;
    private final Rect mLogicalAdjustment;

    private UpdateMountState(
        int reactTag,
        @Nullable DrawCommand[] drawCommands,
        @Nullable AttachDetachListener[] listeners,
        @Nullable NodeRegion[] nodeRegions,
        Rect logicalAdjustment) {
      mReactTag = reactTag;
      mDrawCommands = drawCommands;
      mAttachDetachListeners = listeners;
      mNodeRegions = nodeRegions;
      mLogicalAdjustment = logicalAdjustment;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateMountState(
          mReactTag,
          mDrawCommands,
          mAttachDetachListeners,
          mNodeRegions,
          mLogicalAdjustment);
    }
  }

  private final class UpdateViewGroup implements UIOperation {

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
  public final class UpdateViewBounds implements UIOperation {

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

  private final class SetPadding implements UIOperation {

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

  private final class DropViews implements UIOperation {

    private final int[] mViewsToDrop;

    private DropViews(int[] viewsToDrop) {
      mViewsToDrop = viewsToDrop;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.dropViews(mViewsToDrop);
    }
  }

  private final class MeasureVirtualView implements UIOperation {

    private final int mReactTag;
    private final float mScaledX;
    private final float mScaledY;
    private final float mScaledWidth;
    private final float mScaledHeight;
    private final Callback mCallback;

    private MeasureVirtualView(
        int reactTag,
        float scaledX,
        float scaledY,
        float scaledWidth,
        float scaledHeight,
        Callback callback) {
      mReactTag = reactTag;
      mScaledX = scaledX;
      mScaledY = scaledY;
      mScaledWidth = scaledWidth;
      mScaledHeight = scaledHeight;
      mCallback = callback;
    }

    @Override
    public void execute() {
      try {
        // Measure native View
        mNativeViewHierarchyManager.measure(mReactTag, MEASURE_BUFFER);
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

      mCallback.invoke(0, 0, width, height, x, y);
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

  public FlatUIViewOperationQueue(
      ReactApplicationContext reactContext,
      FlatNativeViewHierarchyManager nativeViewHierarchyManager) {
    super(reactContext, nativeViewHierarchyManager);

    mNativeViewHierarchyManager = nativeViewHierarchyManager;
  }

  /**
   * Enqueues a new UIOperation that will update DrawCommands for a View defined by reactTag.
   */
  public void enqueueUpdateMountState(
      int reactTag,
      @Nullable DrawCommand[] drawCommands,
      @Nullable AttachDetachListener[] listeners,
      @Nullable NodeRegion[] nodeRegions,
      Rect logicalOffset) {
    enqueueUIOperation(new UpdateMountState(
        reactTag,
        drawCommands,
        listeners,
        nodeRegions,
        logicalOffset));
  }

  public void enqueueUpdateViewGroup(int reactTag, int[] viewsToAdd, int[] viewsToDetach) {
    enqueueUIOperation(new UpdateViewGroup(reactTag, viewsToAdd, viewsToDetach));
  }

  public UpdateViewBounds createUpdateViewBounds(
      int reactTag,
      int left,
      int top,
      int right,
      int bottom) {
    return new UpdateViewBounds(reactTag, left, top, right, bottom);
  }

  /**
   * Enqueues a new UIOperation that will update View bounds for a View defined by reactTag.
   */
  public void enqueueUpdateViewBounds(UpdateViewBounds updateViewBounds) {
    enqueueUIOperation(updateViewBounds);
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

  public void enqueueDropViews(int[] viewsToDrop) {
    enqueueUIOperation(new DropViews(viewsToDrop));
  }

  public void enqueueMeasureVirtualView(
      int reactTag,
      float scaledX,
      float scaledY,
      float scaledWidth,
      float scaledHeight,
      Callback callback) {
    enqueueUIOperation(new MeasureVirtualView(
        reactTag,
        scaledX,
        scaledY,
        scaledWidth,
        scaledHeight,
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
}
