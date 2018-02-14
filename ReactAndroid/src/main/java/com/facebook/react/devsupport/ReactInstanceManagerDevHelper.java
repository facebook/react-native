/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import android.app.Activity;

import com.facebook.react.bridge.JavaJSExecutor;

import javax.annotation.Nullable;

/**
 * Interface used by {@link DevSupportManager} for accessing some fields and methods of
 * {@link ReactInstanceManager} for the purpose of displaying and handling developer menu options.
 */
public interface ReactInstanceManagerDevHelper {

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

  /**
   * Get reference to top level #{link Activity} attached to react context
   */
  @Nullable Activity getCurrentActivity();
}
