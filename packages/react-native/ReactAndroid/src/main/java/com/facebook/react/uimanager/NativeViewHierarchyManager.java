/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.annotations.internal.LegacyArchitecture;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger;

/**
 * @deprecated This class is part of Legacy Architecture and has been stubbed out. It will be
 *     removed in a future release.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    since = "This class is part of Legacy Architecture and will be removed in a future release")
public class NativeViewHierarchyManager {

  static {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "NativeViewHierarchyManager", LegacyArchitectureLogLevel.ERROR);
  }

  /**
   * @deprecated Use new architecture instead.
   */
  public NativeViewHierarchyManager(ViewManagerRegistry viewManagers) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public NativeViewHierarchyManager(ViewManagerRegistry viewManagers, RootViewManager manager) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public final synchronized @Nullable View resolveView(int tag) {
    return null;
  }

  /**
   * @deprecated Use new architecture instead.
   */
  public final synchronized @Nullable ViewManager resolveViewManager(int tag) {
    return null;
  }

  /**
   * @deprecated Use new architecture instead.
   */
  public void setLayoutAnimationEnabled(boolean enabled) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void updateInstanceHandle(int tag, long instanceHandle) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void updateProperties(int tag, ReactStylesDiffMap props) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void updateViewExtraData(int tag, Object extraData) {}

  /**
   * @deprecated Please use {@link #updateLayout(int tag, int x, int y, int width, int height,
   *     YogaDirection layoutDirection)} instead.
   */
  @Deprecated
  public void updateLayout(int tag, int x, int y, int width, int height) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void updateLayout(
      int parentTag,
      int tag,
      int x,
      int y,
      int width,
      int height,
      com.facebook.yoga.YogaDirection layoutDirection) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized long getInstanceHandle(int reactTag) {
    return 0;
  }

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void createView(
      ThemedReactContext themedContext,
      int tag,
      String className,
      @Nullable ReactStylesDiffMap initialProps) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void manageChildren(
      int tag,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void setChildren(int tag, ReadableArray childrenTags) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void addRootView(int tag, View view) {}

  /**
   * @deprecated Use new architecture instead.
   */
  protected final synchronized void addRootViewGroup(int tag, View view) {}

  /**
   * @deprecated Use new architecture instead.
   */
  protected synchronized void dropView(View view) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void removeRootView(int rootViewTag) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized int getRootViewNum() {
    return 0;
  }

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void measure(int tag, int[] outputBuffer) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void measureInWindow(int tag, int[] outputBuffer) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized int findTargetTagForTouch(int reactTag, float touchX, float touchY) {
    return 0;
  }

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void setJSResponder(
      int reactTag, int initialReactTag, boolean blockNativeResponder) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void clearJSResponder() {}

  /**
   * @deprecated Use new architecture instead.
   */
  @Deprecated
  public synchronized void dispatchCommand(
      int reactTag, int commandId, @Nullable ReadableArray args) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void dispatchCommand(
      int reactTag, String commandId, @Nullable ReadableArray args) {}

  /**
   * @deprecated Use new architecture instead.
   */
  public synchronized void sendAccessibilityEvent(int tag, int eventType) {}
}
