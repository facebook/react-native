/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import com.facebook.react.bridge.JavaJSExecutor;

/**
 * Interface used by {@link DevSupportManager} for requesting React instance recreation
 * based on the option that user select in developers menu.
 */
public interface ReactInstanceDevCommandsHandler {

  /**
   * Request react instance recreation with JS debugging enabled.
   */
  void onReloadWithJSDebugger(JavaJSExecutor.Factory proxyExecutorFactory);

  /**
   * Notify react instance manager about new JS bundle version downloaded from the server.
   */
  void onJSBundleLoadedFromServer();

  /**
   * Request to toggle the react element inspector.
   */
  void toggleElementInspector();
}
