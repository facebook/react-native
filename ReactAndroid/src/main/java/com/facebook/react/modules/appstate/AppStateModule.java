/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.appstate;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

public class AppStateModule extends ReactContextBaseJavaModule
        implements LifecycleEventListener {

  public static final String APP_STATE_ACTIVE = "active";
  public static final String APP_STATE_BACKGROUND = "background";

  private String mAppState = "uninitialized";

  public AppStateModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "AppState";
  }

  @Override
  public void initialize() {
    getReactApplicationContext().addLifecycleEventListener(this);
  }

  @ReactMethod
  public void getCurrentAppState(Callback success, Callback error) {
    success.invoke(createAppStateEventMap());
  }

  @Override
  public void onHostResume() {
    mAppState = APP_STATE_ACTIVE;
    sendAppStateChangeEvent();
  }

  @Override
  public void onHostPause() {
    mAppState = APP_STATE_BACKGROUND;
    sendAppStateChangeEvent();
  }

  @Override
  public void onHostDestroy() {
    // do not set state to destroyed, do not send an event. By the current implementation, the
    // catalyst instance is going to be immediately dropped, and all JS calls with it.
  }

  private WritableMap createAppStateEventMap() {
    WritableMap appState = Arguments.createMap();
    appState.putString("app_state", mAppState);
    return appState;
  }

  private void sendAppStateChangeEvent() {
    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
            .emit("appStateDidChange", createAppStateEventMap());
  }
}
