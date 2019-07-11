/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import android.view.View;
import androidx.annotation.Nullable;

public interface UIManager extends JSIModule, PerformanceCounter {

  /** Registers a new root view. */
  <T extends View> int addRootView(
      final T rootView, WritableMap initialProps, @Nullable String initialUITemplate);

  /** Unregisters a new root view. */
  void removeRootView(int reactRootTag);

  /**
   * Updates the layout specs of the RootShadowNode based on the Measure specs received by
   * parameters.
   */
  void updateRootLayoutSpecs(int rootTag, int widthMeasureSpec, int heightMeasureSpec);

  /**
   * Dispatches the commandId received by parameter to the view associated with the reactTag. The
   * command will be processed in the UIThread.
   *
   * <p>Receiving commands as ints is deprecated and will be removed in a future release.
   *
   * @param reactTag {@link int} that identifies the view that will receive this command
   * @param commandId {@link int} command id
   * @param commandArgs {@link ReadableArray} parameters associated with the command
   */
  void dispatchCommand(int reactTag, int commandId, @Nullable ReadableArray commandArgs);

  /**
   * Dispatches the commandId received by parameter to the view associated with the reactTag. The
   * command will be processed in the UIThread.
   *
   * @param reactTag {@link int} that identifies the view that will receive this command
   * @param commandId {@link String} command id
   * @param commandArgs {@link ReadableArray} parameters associated with the command
   */
  void dispatchCommand(int reactTag, String commandId, @Nullable ReadableArray commandArgs);

  void setJSResponder(int reactTag, boolean blockNativeResponder);

  void clearJSResponder();

  /**
   * Used by native animated module to bypass the process of updating the values through the shadow
   * view hierarchy. This method will directly update native views, which means that updates for
   * layout-related propertied won't be handled properly. Make sure you know what you're doing
   * before calling this method :)
   *
   * @param tag {@link int} that identifies the view that will be updated
   * @param props {@link ReadableMap} props that should be immediately updated in view
   */
  void synchronouslyUpdateViewOnUIThread(int reactTag, ReadableMap props);
}
