/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

/**
 * Module that exposes the URL to the source code map (used for exception stack trace parsing) to JS
 */
@ReactModule(name = DevSettingsModule.NAME)
public class DevSettingsModule extends ReactContextBaseJavaModule {

  public static final String NAME = "DevSettings";

  private final DevSupportManager mDevSupportManager;

  public DevSettingsModule(
      ReactApplicationContext reactContext, DevSupportManager devSupportManager) {
    super(reactContext);

    mDevSupportManager = devSupportManager;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void reload() {
    if (mDevSupportManager.getDevSupportEnabled()) {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              mDevSupportManager.handleReloadJS();
            }
          });
    }
  }

  @ReactMethod
  public void reloadWithReason(String reason) {
    this.reload();
  }

  @ReactMethod
  public void onFastRefresh() {
    // noop
  }

  @ReactMethod
  public void setHotLoadingEnabled(boolean isHotLoadingEnabled) {
    mDevSupportManager.setHotModuleReplacementEnabled(isHotLoadingEnabled);
  }

  @ReactMethod
  public void setIsDebuggingRemotely(boolean isDebugginRemotelyEnabled) {
    mDevSupportManager.setRemoteJSDebugEnabled(isDebugginRemotelyEnabled);
  }

  @ReactMethod
  public void setProfilingEnabled(boolean isProfilingEnabled) {
    mDevSupportManager.setFpsDebugEnabled(isProfilingEnabled);
  }

  @ReactMethod
  public void toggleElementInspector() {
    mDevSupportManager.toggleElementInspector();
  }

  @ReactMethod
  public void addMenuItem(final String title) {
    mDevSupportManager.addCustomDevOption(
        title,
        new DevOptionHandler() {
          @Override
          public void onOptionSelected() {
            WritableMap data = Arguments.createMap();
            data.putString("title", title);

            ReactApplicationContext reactApplicationContext =
                getReactApplicationContextIfActiveOrWarn();

            if (reactApplicationContext != null) {
              reactApplicationContext
                  .getJSModule(RCTDeviceEventEmitter.class)
                  .emit("didPressMenuItem", data);
            }
          }
        });
  }
}
