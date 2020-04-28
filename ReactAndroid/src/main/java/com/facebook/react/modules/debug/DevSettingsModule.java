/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.debug;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Module that exposes the URL to the source code map (used for exception stack trace parsing) to JS
 */
@ReactModule(name = DevSettingsModule.NAME)
public class DevSettingsModule extends BaseJavaModule {

  public static final String NAME = "DevSettings";

  private final DevSupportManager mDevSupportManager;

  public DevSettingsModule(DevSupportManager devSupportManager) {
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
  public void setHotLoadingEnabled(boolean isHotLoadingEnabled) {
    mDevSupportManager.setHotModuleReplacementEnabled(isHotLoadingEnabled);
  }

  @ReactMethod
  public void setIsDebuggingRemotely(boolean isDebugginRemotelyEnabled) {
    mDevSupportManager.setRemoteJSDebugEnabled(isDebugginRemotelyEnabled);
  }

  @ReactMethod
  public void setLiveReloadEnabled(boolean isLiveReloadEnabled) {
    mDevSupportManager.setReloadOnJSChangeEnabled(isLiveReloadEnabled);
  }

  @ReactMethod
  public void setProfilingEnabled(boolean isProfilingEnabled) {
    mDevSupportManager.setFpsDebugEnabled(isProfilingEnabled);
  }

  @ReactMethod
  public void toggleElementInspector() {
    mDevSupportManager.toggleElementInspector();
  }
}
