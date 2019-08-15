/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.os.Bundle;
import android.view.ViewGroup;
import com.facebook.react.uimanager.common.UIManagerType;
import javax.annotation.Nullable;


/**
 * Interface for the root native view of a React native application
 */
public interface ReactRoot {

  /**
   * Return cached launch properties for app
   */
  @Nullable Bundle getAppProperties();
  @Nullable String getInitialUITemplate();

  /**
   * Fabric or Default UI Manager, see {@link UIManagerType}
   */
  @UIManagerType int getUIManagerType();

  int getRootViewTag();

  void setRootViewTag(int rootViewTag);

  /**
   * Calls into JS to start the React application.
   */
  void runApplication();

  /**
   * Handler for stages {@link com.facebook.react.surface.ReactStage}
   */
  void onStage(int stage);

  /**
   * Return native view for root
   */
  ViewGroup getRootViewGroup();
}
