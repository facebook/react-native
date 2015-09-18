/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

import javax.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.UiThreadUtil;

/**
 * Native module that handles device hardware events like hardware back presses.
 */
public class DeviceEventManagerModule extends ReactContextBaseJavaModule {

  public static interface RCTDeviceEventEmitter extends JavaScriptModule {
    void emit(String eventName, @Nullable Object data);
  }

  private final Runnable mInvokeDefaultBackPressRunnable;

  public DeviceEventManagerModule(
      ReactApplicationContext reactContext,
      final DefaultHardwareBackBtnHandler backBtnHandler) {
    super(reactContext);
    mInvokeDefaultBackPressRunnable = new Runnable() {
      @Override
      public void run() {
        UiThreadUtil.assertOnUiThread();
        backBtnHandler.invokeDefaultOnBackPressed();
      }
    };
  }

  /**
   * Sends an event to the JS instance that the hardware back has been pressed.
   */
  public void emitHardwareBackPressed() {
    getReactApplicationContext()
        .getJSModule(RCTDeviceEventEmitter.class)
        .emit("hardwareBackPress", null);
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
