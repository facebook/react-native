/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.modules.debug.interfaces.DeveloperSettings;
import com.facebook.react.packagerconnection.PackagerConnectionSettings;

/**
 * Helper class for accessing developers settings that should not be accessed outside of the package
 * {@link com.facebook.react.devsupport}. For accessing some of the settings by external modules
 * this class implements an external interface {@link DeveloperSettings}.
 */
@VisibleForTesting
public class DevInternalSettings
    implements DeveloperSettings, SharedPreferences.OnSharedPreferenceChangeListener {

  private static final String PREFS_FPS_DEBUG_KEY = "fps_debug";
  private static final String PREFS_JS_DEV_MODE_DEBUG_KEY = "js_dev_mode_debug";
  private static final String PREFS_JS_MINIFY_DEBUG_KEY = "js_minify_debug";
  private static final String PREFS_ANIMATIONS_DEBUG_KEY = "animations_debug";
  private static final String PREFS_INSPECTOR_DEBUG_KEY = "inspector_debug";
  private static final String PREFS_HOT_MODULE_REPLACEMENT_KEY = "hot_module_replacement";
  private static final String PREFS_REMOTE_JS_DEBUG_KEY = "remote_js_debug";
  private static final String PREFS_START_SAMPLING_PROFILER_ON_INIT =
      "start_sampling_profiler_on_init";

  private final SharedPreferences mPreferences;
  private final Listener mListener;
  private final PackagerConnectionSettings mPackagerConnectionSettings;

  public DevInternalSettings(Context applicationContext, Listener listener) {
    mListener = listener;
    mPreferences = PreferenceManager.getDefaultSharedPreferences(applicationContext);
    mPreferences.registerOnSharedPreferenceChangeListener(this);
    mPackagerConnectionSettings = new PackagerConnectionSettings(applicationContext);
  }

  public PackagerConnectionSettings getPackagerConnectionSettings() {
    return mPackagerConnectionSettings;
  }

  @Override
  public boolean isFpsDebugEnabled() {
    return mPreferences.getBoolean(PREFS_FPS_DEBUG_KEY, false);
  }

  public void setFpsDebugEnabled(boolean enabled) {
    mPreferences.edit().putBoolean(PREFS_FPS_DEBUG_KEY, enabled).apply();
  }

  @Override
  public boolean isAnimationFpsDebugEnabled() {
    return mPreferences.getBoolean(PREFS_ANIMATIONS_DEBUG_KEY, false);
  }

  @Override
  public boolean isJSDevModeEnabled() {
    return mPreferences.getBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, true);
  }

  public void setJSDevModeEnabled(boolean value) {
    mPreferences.edit().putBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, value).apply();
  }

  @Override
  public boolean isJSMinifyEnabled() {
    return mPreferences.getBoolean(PREFS_JS_MINIFY_DEBUG_KEY, false);
  }

  public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
    if (mListener != null) {
      if (PREFS_FPS_DEBUG_KEY.equals(key)
          || PREFS_JS_DEV_MODE_DEBUG_KEY.equals(key)
          || PREFS_START_SAMPLING_PROFILER_ON_INIT.equals(key)
          || PREFS_JS_MINIFY_DEBUG_KEY.equals(key)) {
        mListener.onInternalSettingsChanged();
      }
    }
  }

  public boolean isHotModuleReplacementEnabled() {
    return mPreferences.getBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, true);
  }

  public void setHotModuleReplacementEnabled(boolean enabled) {
    mPreferences.edit().putBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, enabled).apply();
  }

  public boolean isElementInspectorEnabled() {
    return mPreferences.getBoolean(PREFS_INSPECTOR_DEBUG_KEY, false);
  }

  public void setElementInspectorEnabled(boolean enabled) {
    mPreferences.edit().putBoolean(PREFS_INSPECTOR_DEBUG_KEY, enabled).apply();
  }

  @Override
  public boolean isNuclideJSDebugEnabled() {
    return ReactBuildConfig.IS_INTERNAL_BUILD && ReactBuildConfig.DEBUG;
  }

  @Override
  public boolean isRemoteJSDebugEnabled() {
    return mPreferences.getBoolean(PREFS_REMOTE_JS_DEBUG_KEY, false);
  }

  @Override
  public void setRemoteJSDebugEnabled(boolean remoteJSDebugEnabled) {
    mPreferences.edit().putBoolean(PREFS_REMOTE_JS_DEBUG_KEY, remoteJSDebugEnabled).apply();
  }

  @Override
  public boolean isStartSamplingProfilerOnInit() {
    return mPreferences.getBoolean(PREFS_START_SAMPLING_PROFILER_ON_INIT, false);
  }

  @Override
  public void addMenuItem(String title) {
    // Not supported.
  }

  public interface Listener {
    void onInternalSettingsChanged();
  }
}
