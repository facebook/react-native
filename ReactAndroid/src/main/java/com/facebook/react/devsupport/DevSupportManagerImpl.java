/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.packagerconnection.RequestHandler;
import java.util.Map;

/**
 * Interface for accessing and interacting with development features. Following features
 * are supported through this manager class:
 * 1) Displaying JS errors (aka RedBox)
 * 2) Displaying developers menu (Reload JS, Debug JS)
 * 3) Communication with developer server in order to download updated JS bundle
 * 4) Starting/stopping broadcast receiver for js reload signals
 * 5) Starting/stopping motion sensor listener that recognize shake gestures which in turn may
 *    trigger developers menu.
 * 6) Launching developers settings view
 *
 * This class automatically monitors the state of registered views and activities to which they are
 * bound to make sure that we don't display overlay or that we we don't listen for sensor events
 * when app is backgrounded.
 *
 * {@link com.facebook.react.ReactInstanceManager} implementation is responsible for instantiating
 * this class as well as for populating with a reference to {@link CatalystInstance} whenever
 * instance manager recreates it (through {@link #onNewReactContextCreated). Also, instance manager
 * is responsible for enabling/disabling dev support in case when app is backgrounded or when all
 * the views has been detached from the instance (through {@link #setDevSupportEnabled} method).
 *
 * IMPORTANT: In order for developer support to work correctly it is required that the
 * manifest of your application contain the following entries:
 * {@code <activity android:name="com.facebook.react.devsupport.DevSettingsActivity"/>}
 * {@code <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>}
 */
public final class DevSupportManagerImpl extends DevSupportManagerBase {

  public DevSupportManagerImpl(
      Context applicationContext,
      ReactInstanceManagerDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      int minNumShakes) {

    super(
        applicationContext,
        reactInstanceManagerHelper,
        packagerPathForJSBundleName,
        enableOnCreate,
        null,
        null,
        minNumShakes,
        null);
  }

  public DevSupportManagerImpl(
      Context applicationContext,
      ReactInstanceManagerDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      @Nullable RedBoxHandler redBoxHandler,
      @Nullable DevBundleDownloadListener devBundleDownloadListener,
      int minNumShakes,
      @Nullable Map<String, RequestHandler> customPackagerCommandHandlers) {
    super(
        applicationContext,
        reactInstanceManagerHelper,
        packagerPathForJSBundleName,
        enableOnCreate,
        redBoxHandler,
        devBundleDownloadListener,
        minNumShakes,
        customPackagerCommandHandlers);
  }
}
