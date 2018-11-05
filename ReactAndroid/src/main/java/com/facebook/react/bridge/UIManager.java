/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.MeasureSpecProvider;
import com.facebook.react.uimanager.common.SizeMonitoringFrameLayout;

import javax.annotation.Nullable;

public interface UIManager extends JSIModule, PerformanceCounter {

  /**
   * Registers a new root view.
   */
  <T extends SizeMonitoringFrameLayout & MeasureSpecProvider> int addRootView(final T rootView, WritableMap initialProps, @Nullable String initialUITemplate);

  /**
   * Unregisters a new root view.
   */
  void removeRootView(int reactRootTag);

  /**
   * Updates the layout specs of the RootShadowNode based on the Measure specs received by
   * parameters.
   */
  void updateRootLayoutSpecs(int rootTag, int widthMeasureSpec, int heightMeasureSpec);

  /**
   * Dispatches the commandId received by parameter to the view associated with the reactTag.
   * The command will be processed in the UIThread.
   *
   * @param reactTag {@link int} that identifies the view that will receive this command
   * @param commandId {@link int} command id
   * @param commandArgs {@link ReadableArray} parameters associated with the command
   */
  void dispatchCommand(int reactTag, int commandId, @Nullable ReadableArray commandArgs);

  void setJSResponder(int reactTag, boolean blockNativeResponder);

  void clearJSResponder();

}
