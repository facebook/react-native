/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.annotations.internal.LegacyArchitecture;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger;
import com.facebook.yoga.YogaDirection;
import java.util.HashMap;
import java.util.Map;

/**
 * This class acts as a buffer for command executed on {@link NativeViewHierarchyManager}. It expose
 * similar methods as mentioned classes but instead of executing commands immediately it enqueues
 * those operations in a queue that is then flushed from {@link UIManagerModule} once JS batch of ui
 * operations is finished. This is to make sure that we execute all the JS operation coming from a
 * single batch a single loop of the main (UI) android looper.
 *
 * <p>TODO(7135923): Pooling of operation objects TODO(5694019): Consider a better data structure
 * for operations queue to save on allocations
 *
 * @deprecated This class is stubbed out and will be removed in a future release.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    since = "This class is part of Legacy Architecture and will be removed in a future release")
public class UIViewOperationQueue {

  static {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "UIViewOperationQueue", LegacyArchitectureLogLevel.ERROR);
  }

  public static final int DEFAULT_MIN_TIME_LEFT_IN_FRAME_FOR_NONBATCHED_OPERATION_MS = 8;

  /** A mutation or animation operation on the view hierarchy. */
  public interface UIOperation {

    void execute();
  }

  public UIViewOperationQueue(
      ReactApplicationContext reactContext, int minTimeLeftInFrameForNonBatchedOperationMs) {}

  public void profileNextBatch() {}

  public Map<String, Long> getProfiledBatchPerfCounters() {
    return new HashMap<>();
  }

  public boolean isEmpty() {
    return true;
  }

  public void addRootView(final int tag, final View rootView) {}

  protected void enqueueUIOperation(UIOperation operation) {}

  public void enqueueRemoveRootView(int rootViewTag) {}

  public void enqueueSetJSResponder(int tag, int initialTag, boolean blockNativeResponder) {}

  public void enqueueClearJSResponder() {}

  @Deprecated
  public void enqueueDispatchCommand(
      int reactTag, int commandId, @Nullable ReadableArray commandArgs) {}

  public void enqueueDispatchCommand(
      int reactTag, String commandId, @Nullable ReadableArray commandArgs) {}

  public void enqueueUpdateExtraData(int reactTag, Object extraData) {}

  public void enqueueCreateView(
      ThemedReactContext themedContext,
      int viewReactTag,
      String viewClassName,
      @Nullable ReactStylesDiffMap initialProps) {}

  public void enqueueUpdateInstanceHandle(int reactTag, long instanceHandle) {}

  public void enqueueUpdateProperties(int reactTag, String className, ReactStylesDiffMap props) {}

  /**
   * @deprecated Use {@link #enqueueUpdateLayout(int, int, int, int, int, int, YogaDirection)}
   *     instead.
   */
  @Deprecated
  public void enqueueUpdateLayout(
      int parentTag, int reactTag, int x, int y, int width, int height) {}

  public void enqueueUpdateLayout(
      int parentTag,
      int reactTag,
      int x,
      int y,
      int width,
      int height,
      YogaDirection layoutDirection) {}

  public void enqueueManageChildren(
      int reactTag,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {}

  public void enqueueSetChildren(int reactTag, ReadableArray childrenTags) {}

  public void enqueueSetLayoutAnimationEnabled(final boolean enabled) {}

  public void enqueueConfigureLayoutAnimation(
      final ReadableMap config, final Callback onAnimationComplete) {}

  public void enqueueMeasure(final int reactTag, final Callback callback) {}

  public void enqueueMeasureInWindow(final int reactTag, final Callback callback) {}

  public void enqueueFindTargetForTouch(
      final int reactTag, final float targetX, final float targetY, final Callback callback) {}

  public void enqueueSendAccessibilityEvent(int tag, int eventType) {}

  public void enqueueLayoutUpdateFinished(
      ReactShadowNode node, UIImplementation.LayoutUpdateListener listener) {}

  public void enqueueUIBlock(UIBlock block) {}

  public void prependUIBlock(UIBlock block) {}

  public void dispatchViewUpdates(
      final int batchId, final long commitStartTime, final long layoutTime) {}

  /* package */ void resumeFrameCallback() {}

  /* package */ void pauseFrameCallback() {}
}
