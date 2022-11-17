/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.appstate;

import com.facebook.fbreact.specs.NativeAppStateSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WindowFocusChangeListener;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nullable;

@ReactModule(name = AppStateModule.NAME)
public class AppStateModule extends NativeAppStateSpec
    implements LifecycleEventListener, WindowFocusChangeListener {
  public static final String TAG = AppStateModule.class.getSimpleName();

  public static final String NAME = "AppState";

  public static final String APP_STATE_ACTIVE = "active";
  public static final String APP_STATE_BACKGROUND = "background";

  private static final String INITIAL_STATE = "initialAppState";

  private String mAppState;

  public AppStateModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
    reactContext.addWindowFocusChangeListener(this);
    mAppState =
        (reactContext.getLifecycleState() == LifecycleState.RESUMED
            ? APP_STATE_ACTIVE
            : APP_STATE_BACKGROUND);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public Map<String, Object> getTypedExportedConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put(INITIAL_STATE, mAppState);
    return constants;
  }

  @Override
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

  @Override
  public void onWindowFocusChange(boolean hasFocus) {
    sendEvent("appStateFocusChange", hasFocus);
  }

  private WritableMap createAppStateEventMap() {
    WritableMap appState = Arguments.createMap();
    appState.putString("app_state", mAppState);
    return appState;
  }

  private void sendEvent(String eventName, @Nullable Object data) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContext();

    if (reactApplicationContext == null) {
      return;
    }
    // We don't gain anything interesting from logging here, and it's an extremely common
    // race condition for an AppState event to be triggered as the Catalyst instance is being
    // set up or torn down. So, just fail silently here.
    if (!reactApplicationContext.hasActiveReactInstance()) {
      return;
    }
    reactApplicationContext.getJSModule(RCTDeviceEventEmitter.class).emit(eventName, data);
  }

  private void sendAppStateChangeEvent() {
    sendEvent("appStateDidChange", createAppStateEventMap());
  }

  @Override
  public void addListener(String eventName) {
    // iOS only
  }

  @Override
  public void removeListeners(double count) {
    // iOS only
  }

  @Override
  public void invalidate() {
    super.invalidate();

    ReactApplicationContext applicationContext = getReactApplicationContextIfActiveOrWarn();
    if (applicationContext != null) {
      applicationContext.removeLifecycleEventListener(this);
    }
  }
}
