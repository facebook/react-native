/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

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
    private final DrawCommand[] mDrawCommands;

    private UpdateMountState(int reactTag, DrawCommand[] drawCommands) {
      mReactTag = reactTag;
      mDrawCommands = drawCommands;
    }

    @Override
    public void execute() {
      mNativeViewHierarchyManager.updateMountState(mReactTag, mDrawCommands);
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

  public FlatUIViewOperationQueue(
      ReactApplicationContext reactContext,
      FlatNativeViewHierarchyManager nativeViewHierarchyManager) {
    super(reactContext, nativeViewHierarchyManager);

    mNativeViewHierarchyManager = nativeViewHierarchyManager;
  }

  /**
   * Enqueues a new UIOperation that will update DrawCommands for a View defined by reactTag.
   */
  public void enqueueUpdateMountState(int reactTag, DrawCommand[] drawCommands) {
    enqueueUIOperation(new UpdateMountState(reactTag, drawCommands));
  }

  /**
   * Enqueues a new UIOperation that will update View bounds for a View defined by reactTag.
   */
  public void enqueueUpdateViewBounds(int reactTag, int left, int top, int right, int bottom) {
    enqueueUIOperation(new UpdateViewBounds(reactTag, left, top, right, bottom));
  }
}
