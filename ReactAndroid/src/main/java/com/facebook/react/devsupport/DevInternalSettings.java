/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.debug.DeveloperSettings;

/**
 * Helper class for accessing developers settings that should not be accessed outside of the package
 * {@link com.facebook.react.devsupport}. For accessing some of the settings by external modules
 * this class implements an external interface {@link DeveloperSettings}.
 */
@VisibleForTesting
public class DevInternalSettings implements
    DeveloperSettings,
    SharedPreferences.OnSharedPreferenceChangeListener {

  private static final String PREFS_FPS_DEBUG_KEY = "fps_debug";
  private static final String PREFS_JS_DEV_MODE_DEBUG_KEY = "js_dev_mode_debug";
  private static final String PREFS_DEBUG_SERVER_HOST_KEY = "debug_http_host";
  private static final String PREFS_ANIMATIONS_DEBUG_KEY = "animations_debug";
  private static final String PREFS_RELOAD_ON_JS_CHANGE_KEY = "reload_on_js_change";

  private final SharedPreferences mPreferences;
  private final DevSupportManager mDebugManager;

  public DevInternalSettings(
      Context applicationContext,
      DevSupportManager debugManager) {
    mDebugManager = debugManager;
    mPreferences = PreferenceManager.getDefaultSharedPreferences(applicationContext);
    mPreferences.registerOnSharedPreferenceChangeListener(this);
  }

  @Override
  public boolean isFpsDebugEnabled() {
    return mPreferences.getBoolean(PREFS_FPS_DEBUG_KEY, false);
  }

  @Override
  public boolean isAnimationFpsDebugEnabled() {
    return mPreferences.getBoolean(PREFS_ANIMATIONS_DEBUG_KEY, false);
  }

  @Override
  public boolean isJSDevModeEnabled() {
    return mPreferences.getBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, true);
  }

  public @Nullable String getDebugServerHost() {
    return mPreferences.getString(PREFS_DEBUG_SERVER_HOST_KEY, null);
  }

  public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
    if (PREFS_FPS_DEBUG_KEY.equals(key) ||
        PREFS_RELOAD_ON_JS_CHANGE_KEY.equals(key) ||
        PREFS_JS_DEV_MODE_DEBUG_KEY.equals(key)) {
      mDebugManager.reloadSettings();
    }
  }

  public boolean isReloadOnJSChangeEnabled() {
    return mPreferences.getBoolean(PREFS_RELOAD_ON_JS_CHANGE_KEY, false);
  }
}
