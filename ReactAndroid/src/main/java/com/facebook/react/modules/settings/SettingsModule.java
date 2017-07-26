/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.settings;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

@ReactModule(name = SettingsModule.NAME)
public class SettingsModule extends ReactContextBaseJavaModule implements SharedPreferences.OnSharedPreferenceChangeListener{

  @SuppressWarnings("WeakerAccess")
  static final String NAME = "SettingsManager";
  static final String DEFAULT_FILE_NAME = "ReactNative";
  static final String TAG = "SettingsMmodule";

  private static boolean sSettingsModuleInstantiated = false;

  static private String sFilename = "";
  private Boolean ignoringUpdates = false;
  private SharedPreferences mPreferences;

  public SettingsModule(ReactApplicationContext context) {
    super(context);

  }

  @Override
  public String getName() {
    return SettingsModule.NAME;
  }

  private SharedPreferences ensurePreferences() {
    if (mPreferences == null) {
      if (SettingsModule.sFilename.length() > 0) {
        mPreferences = getReactApplicationContext().getSharedPreferences(SettingsModule.sFilename, Context.MODE_PRIVATE);
      } else if (getCurrentActivity() != null) {
        mPreferences = getCurrentActivity().getPreferences(Context.MODE_PRIVATE);
      } else {
        mPreferences = getReactApplicationContext().getSharedPreferences(DEFAULT_FILE_NAME, Context.MODE_PRIVATE);
      }
      sSettingsModuleInstantiated = true;
      mPreferences.registerOnSharedPreferenceChangeListener(this);
    }

    return mPreferences;
  }

  /***
   * Configure the Settings Module to use a SharedPreferences file with a specific name as its backing store.
   * Useful if the Settings Module needs to use an existing SharedPreferences file or to ensure that Settings Modules
   * belonging to different ReactPackages will all share the same SharedPreferences file for their backing store.
   * <p></p>
   * <b>Note:</b>this method may only be called before a Settings Module initialization (i.e. before a ReactMainPackage is instantiated)
   * An app would typically invoke this function in the app's main activity before setting up the React Native environment
   * @param filename the name of the SharedPreferences file to use or create for the backing store
   * @throws IllegalStateException if called after instantiation of a Settings module
   */
  static public void setSharedPreferencesFilename(String filename) {
    if (sSettingsModuleInstantiated) {
      throw new IllegalStateException("Attempt to set Settings Module SharedPreferences file name after a Settings Module instantiation");
    }
    sFilename = filename;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    ensurePreferences().unregisterOnSharedPreferenceChangeListener(this);
  }

  @ReactMethod
  public void setValues(ReadableMap values) {
    this.ignoringUpdates = true;

    ReadableMapKeySetIterator iterator = values.keySetIterator();
    SharedPreferences.Editor editor = mPreferences.edit();

    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      ReadableType type = values.getType(key);

      switch (type) {
        case Null:
          editor.remove(key);
          break;
        case Boolean:
          editor.putBoolean(key, values.getBoolean(key));
          break;
        case Number:
          editor.putFloat(key, (float) values.getDouble(key));
          break;
        case String:
          editor.putString(key, values.getString(key));
          break;
        case Map: // Not supported
          throw new IllegalArgumentException(TAG + ": Cannot not store Map as value in Settings");
        case Array: // Not supported
          throw new IllegalArgumentException(TAG + ": Cannot not store Array as value in Settings");
      }
    }
    editor.apply();

    this.ignoringUpdates = false;
  }

  public Map<String, Object> getConstants() {
    Map<String, Object> exportedValuePairs = new HashMap<String, Object>();
    Map<String, ?> prefsMap = ensurePreferences().getAll();

    for (String key : prefsMap.keySet()) {
      Object value = prefsMap.get(key);
      if (value instanceof String || value.getClass().isPrimitive()) {
        exportedValuePairs.put(key, value);
      } else {
        // StringSets are not exported - could be used in the future to store JSON encoded arrays and maps
        Log.d(TAG, "unexported setting: " + key);
      }
    }

    HashMap<String, Object> constants = new HashMap<>();

    constants.put("settings", exportedValuePairs);
    return constants;
  }

  @Override
  public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String prefKey) {
    if (ignoringUpdates) {
      return;
    }
    Map<String, ?> prefsMap = ensurePreferences().getAll();

    WritableMap map = Arguments.createMap();

    for (String key: prefsMap.keySet()) {
      Object value = prefsMap.get(key);

      if (value == null) {
        map.putNull(key);
      } else if (value instanceof String) {
        map.putString(key, (String) value);
      } else if (value instanceof Number) {
        if (value instanceof Integer) {
          map.putInt(key, (Integer) value);
        } else {
          map.putDouble(key, ((Number) value).doubleValue());
        }
      } else if (value instanceof Boolean) {
        map.putBoolean(key, (Boolean) value);
      } else {
        Log.d(TAG, "ignoring setting: " + key);
      }
    }
    if (getReactApplicationContext().hasActiveCatalystInstance()) {
      getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("settingsUpdated", map);
    }
  }
}
