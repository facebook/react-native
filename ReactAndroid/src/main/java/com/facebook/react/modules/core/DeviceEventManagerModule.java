/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.core;

import android.net.Uri;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

/** Native module that handles device hardware events like hardware back presses. */
@ReactModule(name = DeviceEventManagerModule.NAME)
public class DeviceEventManagerModule extends ReactContextBaseJavaModule {
  public static final String NAME = "DeviceEventManager";

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
    getReactApplicationContext()
        .getJSModule(RCTDeviceEventEmitter.class)
        .emit("hardwareBackPress", null);
  }

  /** Sends an event to the JS instance that a new intent was received. */
  public void emitNewIntentReceived(Uri uri) {
    WritableMap map = Arguments.createMap();
    map.putString("url", uri.toString());
    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class).emit("url", map);
  }

  /**
   * Invokes the default back handler for the host of this catalyst instance. This should be invoked
   * if JS does not want to handle the back press itself.
   */
  @ReactMethod
  public void invokeDefaultBackPressHandler() {
    getReactApplicationContext().runOnUiQueueThread(mInvokeDefaultBackPressRunnable);
  }

  @Override
  public String getName() {
    return "DeviceEventManager";
  }
}
