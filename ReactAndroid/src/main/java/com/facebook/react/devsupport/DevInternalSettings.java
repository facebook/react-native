/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.devsupport;

import android.annotation.SuppressLint;
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
  private static final String PREFS_JS_BUNDLE_DELTAS_KEY = "js_bundle_deltas";
  private static final String PREFS_JS_BUNDLE_DELTAS_CPP_KEY = "js_bundle_deltas_cpp";
  private static final String PREFS_ANIMATIONS_DEBUG_KEY = "animations_debug";
  // This option is no longer exposed in the dev menu UI.
  // It was renamed in D15958697 so it doesn't get stuck with no way to turn it off:
  private static final String PREFS_RELOAD_ON_JS_CHANGE_KEY = "reload_on_js_change_LEGACY";
  private static final String PREFS_INSPECTOR_DEBUG_KEY = "inspector_debug";
  private static final String PREFS_HOT_MODULE_REPLACEMENT_KEY = "hot_module_replacement";
  private static final String PREFS_REMOTE_JS_DEBUG_KEY = "remote_js_debug";
  private static final String PREFS_SAMPLING_PROFILER_ENABLED = "sampling_profiler_enabled";

  private final SharedPreferences mPreferences;
  private final Listener mListener;
  private final PackagerConnectionSettings mPackagerConnectionSettings;
  private final boolean mSupportsNativeDeltaClients;

  public static DevInternalSettings withoutNativeDeltaClient(
      Context applicationContext, Listener listener) {
    return new DevInternalSettings(applicationContext, listener, false);
  }

  public DevInternalSettings(Context applicationContext, Listener listener) {
    this(applicationContext, listener, true);
  }

  private DevInternalSettings(
      Context applicationContext, Listener listener, boolean supportsNativeDeltaClients) {
    mListener = listener;
    mPreferences = PreferenceManager.getDefaultSharedPreferences(applicationContext);
    mPreferences.registerOnSharedPreferenceChangeListener(this);
    mPackagerConnectionSettings = new PackagerConnectionSettings(applicationContext);
    mSupportsNativeDeltaClients = supportsNativeDeltaClients;
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
          || PREFS_RELOAD_ON_JS_CHANGE_KEY.equals(key)
          || PREFS_JS_DEV_MODE_DEBUG_KEY.equals(key)
          || PREFS_JS_BUNDLE_DELTAS_KEY.equals(key)
          || PREFS_JS_BUNDLE_DELTAS_CPP_KEY.equals(key)
          || PREFS_JS_MINIFY_DEBUG_KEY.equals(key)) {
        mListener.onInternalSettingsChanged();
      }
    }
  }

  public boolean isHotModuleReplacementEnabled() {
    return mPreferences.getBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, false);
  }

  public void setHotModuleReplacementEnabled(boolean enabled) {
    mPreferences.edit().putBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, enabled).apply();
  }

  public boolean isReloadOnJSChangeEnabled() {
    return mPreferences.getBoolean(PREFS_RELOAD_ON_JS_CHANGE_KEY, false);
  }

  public void setReloadOnJSChangeEnabled(boolean enabled) {
    mPreferences.edit().putBoolean(PREFS_RELOAD_ON_JS_CHANGE_KEY, enabled).apply();
  }

  public boolean isElementInspectorEnabled() {
    return mPreferences.getBoolean(PREFS_INSPECTOR_DEBUG_KEY, false);
  }

  public void setElementInspectorEnabled(boolean enabled) {
    mPreferences.edit().putBoolean(PREFS_INSPECTOR_DEBUG_KEY, enabled).apply();
  }

  @SuppressLint("SharedPreferencesUse")
  public boolean isBundleDeltasEnabled() {
    return mPreferences.getBoolean(PREFS_JS_BUNDLE_DELTAS_KEY, false);
  }

  @SuppressLint("SharedPreferencesUse")
  public void setBundleDeltasEnabled(boolean enabled) {
    mPreferences.edit().putBoolean(PREFS_JS_BUNDLE_DELTAS_KEY, enabled).apply();
  }

  @SuppressLint("SharedPreferencesUse")
  public boolean isBundleDeltasCppEnabled() {
    return mSupportsNativeDeltaClients
        && mPreferences.getBoolean(PREFS_JS_BUNDLE_DELTAS_CPP_KEY, false);
  }

  @SuppressLint("SharedPreferencesUse")
  public void setBundleDeltasCppEnabled(boolean enabled) {
    mPreferences.edit().putBoolean(PREFS_JS_BUNDLE_DELTAS_CPP_KEY, enabled).apply();
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

  public interface Listener {
    void onInternalSettingsChanged();
  }
}
