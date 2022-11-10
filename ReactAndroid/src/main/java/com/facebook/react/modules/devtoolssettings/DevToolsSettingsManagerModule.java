/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.devtoolssettings;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.NativeDevToolsSettingsManagerSpec;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = DevToolsSettingsManagerModule.NAME)
public class DevToolsSettingsManagerModule extends NativeDevToolsSettingsManagerSpec {
  public static final String NAME = "DevToolsSettingsManager";

  private static final String SHARED_PREFERENCES_PREFIX = "ReactNative__DevToolsSettings";
  private static final String KEY_CONSOLE_PATCH_SETTINGS = "ConsolePatchSettings";

  private final SharedPreferences mSharedPreferences;

  public DevToolsSettingsManagerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mSharedPreferences =
        reactContext.getSharedPreferences(SHARED_PREFERENCES_PREFIX, Context.MODE_PRIVATE);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public @Nullable String getConsolePatchSettings() {
    return mSharedPreferences.getString(KEY_CONSOLE_PATCH_SETTINGS, null);
  }

  @Override
  public void setConsolePatchSettings(String newSettings) {
    Editor editor = mSharedPreferences.edit();
    editor.putString(KEY_CONSOLE_PATCH_SETTINGS, newSettings);
    editor.apply();
  }
}
