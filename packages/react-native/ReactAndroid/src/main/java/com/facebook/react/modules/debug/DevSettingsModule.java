/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug;

import com.facebook.fbreact.specs.NativeDevSettingsSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Module that exposes the URL to the source code map (used for exception stack trace parsing) to JS
 */
@ReactModule(name = NativeDevSettingsSpec.NAME)
public class DevSettingsModule extends NativeDevSettingsSpec {

  private final DevSupportManager mDevSupportManager;

  public DevSettingsModule(
      ReactApplicationContext reactContext, DevSupportManager devSupportManager) {
    super(reactContext);

    mDevSupportManager = devSupportManager;
  }

  @Override
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

  @Override
  public void reloadWithReason(String reason) {
    this.reload();
  }

  @Override
  public void onFastRefresh() {
    // noop
  }

  @Override
  public void setHotLoadingEnabled(boolean isHotLoadingEnabled) {
    mDevSupportManager.setHotModuleReplacementEnabled(isHotLoadingEnabled);
  }

  @Override
  public void setIsDebuggingRemotely(boolean isDebugginRemotelyEnabled) {
    mDevSupportManager.setRemoteJSDebugEnabled(isDebugginRemotelyEnabled);
  }

  @Override
  public void setProfilingEnabled(boolean isProfilingEnabled) {
    mDevSupportManager.setFpsDebugEnabled(isProfilingEnabled);
  }

  @Override
  public void toggleElementInspector() {
    mDevSupportManager.toggleElementInspector();
  }

  @Override
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
              reactApplicationContext.emitDeviceEvent("didPressMenuItem", data);
            }
          }
        });
  }

  @Override
  public void setIsShakeToShowDevMenuEnabled(boolean enabled) {
    // iOS only
  }

  @Override
  public void addListener(String eventName) {
    // iOS only
  }

  @Override
  public void removeListeners(double count) {
    // iOS only
  }
}
