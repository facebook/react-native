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

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.UIViewOperationQueue;

/**
 * FlatUIViewOperationQueue extends {@link UIViewOperationQueue} to add
 * FlatUIImplementation-specific methods that need to run in UI thread.
 */
/* package */ final class FlatUIViewOperationQueue extends UIViewOperationQueue {

  private final FlatNativeViewHierarchyManager mNativeViewHierarchyManager;

  /**
   * UIOperation that updates DrawCommands for a View defined by reactTag.
   */
  private final class UpdateMountState implements UIOperation {

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
  private final class UpdateViewBounds implements UIOperation {

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
      @Nullable NodeRegion[] nodeRegions) {
    enqueueUIOperation(new UpdateMountState(reactTag, drawCommands, listeners, nodeRegions));
  }

  public void enqueueUpdateViewGroup(int reactTag, int[] viewsToAdd, int[] viewsToDetach) {
    enqueueUIOperation(new UpdateViewGroup(reactTag, viewsToAdd, viewsToDetach));
  }

  /**
   * Enqueues a new UIOperation that will update View bounds for a View defined by reactTag.
   */
  public void enqueueUpdateViewBounds(int reactTag, int left, int top, int right, int bottom) {
    enqueueUIOperation(new UpdateViewBounds(reactTag, left, top, right, bottom));
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

  public DetachAllChildrenFromViews enqueueDetachAllChildrenFromViews() {
    DetachAllChildrenFromViews op = new DetachAllChildrenFromViews();
    enqueueUIOperation(op);
    return op;
  }
}
