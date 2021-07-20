/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import android.net.Uri;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.NativeDeviceEventManagerSpec;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

/** Native module that handles device hardware events like hardware back presses. */
@ReactModule(name = DeviceEventManagerModule.NAME)
public class DeviceEventManagerModule extends NativeDeviceEventManagerSpec {
  public static final String NAME = "DeviceEventManager";

  @DoNotStrip
  public interface RCTDeviceEventEmitter extends JavaScriptModule {
    void emit(@NonNull String eventName, @Nullable Object data);
  }

  private final Runnable mInvokeDefaultBackPressRunnable;

  public DeviceEventManagerModule(
      ReactApplicationContext reactContext, final DefaultHardwareBackBtnHandler backBtnHandler) {
    super(reactContext);
    mInvokeDefaultBackPressRunnable =
        new Runnable() {
          @Override
          public void run() {
            UiThreadUtil.assertOnUiThread();
            backBtnHandler.invokeDefaultOnBackPressed();
          }
        };
  }

  /** Sends an event to the JS instance that the hardware back has been pressed. */
  public void emitHardwareBackPressed() {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      reactApplicationContext
          .getJSModule(RCTDeviceEventEmitter.class)
          .emit("hardwareBackPress", null);
    }
  }

  /** Sends an event to the JS instance that a new intent was received. */
  public void emitNewIntentReceived(Uri uri) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      WritableMap map = Arguments.createMap();
      map.putString("url", uri.toString());
      reactApplicationContext.getJSModule(RCTDeviceEventEmitter.class).emit("url", map);
    }
  }

  /**
   * Invokes the default back handler for the host of this catalyst instance. This should be invoked
   * if JS does not want to handle the back press itself.
   */
  @Override
  public void invokeDefaultBackPressHandler() {
    // There should be no need to check if the catalyst instance is alive. After initialization
    // the thread instances cannot be null, and scheduling on a thread after ReactApplicationContext
    // teardown is a noop.
    getReactApplicationContext().runOnUiQueueThread(mInvokeDefaultBackPressRunnable);
  }

  @Override
  public String getName() {
    return "DeviceEventManager";
  }
}
