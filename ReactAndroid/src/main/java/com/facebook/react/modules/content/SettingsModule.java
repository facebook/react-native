/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.content;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * {@link NativeModule} that allows JS to access and manage
 * {@link android.content.SharedPreferences}
 */
@ReactModule(name = "Settings")
public class SettingsModule extends ReactContextBaseJavaModule
  implements SharedPreferences.OnSharedPreferenceChangeListener {
  public static final String TAG = SettingsModule.class.getCanonicalName();
  private Context mContext;
  private static Map<String, SettingsListenerDetails> listeners = new HashMap<>();

  public SettingsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mContext = reactContext;
  }

  @Override
  public String getName() {
    return "Settings";
  }

  /**
   * Get the values in {@link SharedPreferences}
   *
   * @param key name of key to resolve to
   * @param name name of desired {@link SharedPreferences} file
   * @param promise {@link Promise} to resolve to
   */
  @ReactMethod
  public void get(String key, String name, Promise promise) {
    SharedPreferences preferences = getSharedPreferences(name);
    if (preferences != null) {
      try {
        promise.resolve(SettingsUtil.getValue(preferences, key));
      } catch (IllegalArgumentException e) {
        String code = SettingsError.KEY_NOT_FOUND.toString();
        promise.reject(code, e);
      }
    } else {
      String code = SettingsError.COULD_NOT_RESOLVE_PREFERENCES.toString();
      promise.reject(code, new IllegalArgumentException());
    }
  }

  /**
   * Set the values in {@link SharedPreferences}
   * <p>
   * Values must be of {@link com.facebook.react.bridge.ReadableType}.
   * {@link Double} value will be narrowed to {@link Float}
   * </p>
   *
   * @param map values to set in {@link SharedPreferences} file
   * @param name name of desired {@link SharedPreferences} file
   */
  @ReactMethod
  public void set(ReadableMap map, String name) {
    SharedPreferences preferences = getSharedPreferences(name);
    if (preferences != null) {
      SettingsUtil.setValues(preferences, map);
    }
  }

  /**
   * Register listeners for keys that changes it's state in the preference
   *
   * @param keys keys of the shared preference file to watch
   * @param id unique token to pair with client request
   * @param name name of the shared preference file to watch
   */
  @ReactMethod
  public void watchKeys(ReadableArray keys, String id, String name) {
    final SharedPreferences preferences = getSharedPreferences(name);
    if (preferences != null) {
      registerListener(keys, id, preferences);
    }
  }

  /**
   * Unregister the listeners
   *
   * @param id unique token to pair with client request
   */
  @ReactMethod
  public void clearWatch(String id) {
    SettingsListenerDetails listenerDetails = listeners.remove(id);
    if (listenerDetails != null) {
      SharedPreferences preferences = listenerDetails.preferences;
      for (SettingsListenerDetails details : listeners.values()) {
        //SharedPreference may have multiple listeners
        if (details.preferences == preferences) {
          return;
        }
      }
      preferences.unregisterOnSharedPreferenceChangeListener(this);
    }
  }

  @Override
  public void onSharedPreferenceChanged(SharedPreferences preferences, String key) {
    for (SettingsListenerDetails details : listeners.values()) {
      if (details.preferences == preferences && details.keysToWatch.contains(key)) {
        try {
          //Will send the updated key to the js module.
          getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(details.uniqueId, key);
        } catch (Exception e) {
          FLog.e(TAG, e.getMessage());
        }
      }
    }
  }

  private class SettingsListenerDetails {
    String uniqueId;
    List<String> keysToWatch;
    SharedPreferences preferences;

    SettingsListenerDetails(
      String uniqueId,
      List<String> keysToWatch,
      SharedPreferences preferences) {
      this.uniqueId = uniqueId;
      this.keysToWatch = keysToWatch;
      this.preferences = preferences;
    }
  }

  private void registerListener(
    ReadableArray keys,
    String id,
    final SharedPreferences preferences) {
    final SettingsListenerDetails listenerDetails = getListenerDetails(keys, id, preferences);
    if (!getRegisteredPreferences().contains(preferences)) {
      preferences.registerOnSharedPreferenceChangeListener(this);
    }
    listeners.put(id, listenerDetails);
  }

  private SettingsListenerDetails getListenerDetails(
    ReadableArray keys,
    String id,
    SharedPreferences preferences) {
    List<String> keysArr = SettingsUtil.convertReadableArrToList(keys);
    return new SettingsListenerDetails(id, keysArr, preferences);
  }

  private List<SharedPreferences> getRegisteredPreferences() {
    List<SharedPreferences> preferencesList = new ArrayList<>();
    for (Map.Entry<String, SettingsListenerDetails> entry : listeners.entrySet()) {
      preferencesList.add(entry.getValue().preferences);
    }
    return preferencesList;
  }

  private SharedPreferences getSharedPreferences(final String name) {
    if (TextUtils.isEmpty(name)) {
      return (getCurrentActivity() == null)
        ? null
        : getCurrentActivity().getPreferences(Activity.MODE_PRIVATE);
    } else {
      return mContext.getSharedPreferences(name, Activity.MODE_PRIVATE);
    }
  }
}
