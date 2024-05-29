/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.os.Bundle;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.uimanager.common.UIManagerType;
import java.util.concurrent.atomic.AtomicInteger;

/** Interface for the root native view of a React native application */
@Nullsafe(Nullsafe.Mode.LOCAL)
public interface ReactRoot {

  /** This constant represents that ReactRoot hasn't started yet or it has been destroyed. */
  int STATE_STOPPED = 0;

  /** This constant represents that ReactRoot has started. */
  int STATE_STARTED = 1;

  /** Return cached launch properties for app */
  @Nullable
  Bundle getAppProperties();

  String getJSModuleName();

  /** Fabric or Default UI Manager, see {@link UIManagerType} */
  @UIManagerType
  int getUIManagerType();

  int getRootViewTag();

  void setRootViewTag(int rootViewTag);

  /** Calls into JS to start the React application. */
  void runApplication();

  /** Handler for stages {@link com.facebook.react.surface.ReactStage} */
  void onStage(@ReactStage int stage);

  /** Return native view for root */
  ViewGroup getRootViewGroup();

  /**
   * @return Cached values for widthMeasureSpec.
   */
  int getWidthMeasureSpec();

  /**
   * @return Cached values for and heightMeasureSpec.
   */
  int getHeightMeasureSpec();

  /** Sets a flag that determines whether to log that content appeared on next view added. */
  void setShouldLogContentAppeared(boolean shouldLogContentAppeared);

  /**
   * @return a {@link String} that represents the root js application that is being rendered with
   *     this {@link ReactRoot}
   * @deprecated We recommend to not use this method as it is will be replaced in the near future.
   */
  @Deprecated
  @Nullable
  String getSurfaceID();

  /**
   * @return an {@link AtomicInteger} that represents the state of the ReactRoot object.
   */
  AtomicInteger getState();
}
