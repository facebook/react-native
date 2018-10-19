/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.app.Activity;
import com.facebook.react.bridge.JavaJSExecutor;

import com.facebook.react.bridge.NativeDeltaClient;
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
  void onJSBundleLoadedFromServer(@Nullable NativeDeltaClient nativeDeltaClient);

  /**
   * Request to toggle the react element inspector.
   */
  void toggleElementInspector();

  /**
   * Get reference to top level #{link Activity} attached to react context
   */
  @Nullable Activity getCurrentActivity();
}
