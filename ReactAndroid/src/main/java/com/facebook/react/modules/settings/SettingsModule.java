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
public class SettingsModule extends ReactContextBaseJavaModule  implements SharedPreferences.OnSharedPreferenceChangeListener{

  @SuppressWarnings("WeakerAccess")
  static final String NAME = "SettingsManager";
  static final String DEFAULT_FILE_NAME = "ReactNative";

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

  private SharedPreferences getPreferences() {
    if (mPreferences == null) {
      if (SettingsModule.sFilename.length() > 0) {
        mPreferences = getReactApplicationContext().getSharedPreferences(SettingsModule.sFilename, Context.MODE_PRIVATE);
      } else if (getCurrentActivity() != null) {
        mPreferences = getCurrentActivity().getPreferences(Context.MODE_PRIVATE);
      } else {
        mPreferences = getReactApplicationContext().getSharedPreferences(DEFAULT_FILE_NAME, Context.MODE_PRIVATE);
      }
      mPreferences.registerOnSharedPreferenceChangeListener(this);
    }

    return mPreferences;
  }

  static public void setFilename(String filename) {
    sFilename = filename;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    getPreferences().unregisterOnSharedPreferenceChangeListener(this);
  }

  @ReactMethod
  public void setValues(ReadableMap values) {
    this.ignoringUpdates = true;

    ReadableMapKeySetIterator iterator = values.keySetIterator();

    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      ReadableType type = values.getType(key);

      switch (type) {
        case Null:
          mPreferences.edit().remove(key).apply();
          break;

        case Boolean:
          mPreferences.edit().putBoolean(key, values.getBoolean(key)).apply();
          break;

        case Number:
          mPreferences.edit().putFloat(key, (float) values.getDouble(key)).apply();
          break;

        case String:
          mPreferences.edit().putString(key, values.getString(key)).apply();
          break;

        case Map: // Not supported
          throw new IllegalArgumentException("Could not store Map in Settings");

        case Array: // Not supported
          throw new IllegalArgumentException("Could not store Array in Settings");
      }
    }

    this.ignoringUpdates = false;
  }

  public Map<String, Object> getConstants() {
    Map<String, Object> exportedValuePairs = new HashMap<String, Object>();
    Map<String, ?> prefsMap = getPreferences().getAll();

    for (String key : prefsMap.keySet()) {
      Object value = prefsMap.get(key);
      if (value instanceof String || value.getClass().isPrimitive()) {
        exportedValuePairs.put(key, value);
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
    Map<String, ?> prefsMap = getPreferences().getAll();

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
          throw new IllegalArgumentException("Could not convert " + value.getClass());
      }
    }
    if (getReactApplicationContext().hasActiveCatalystInstance()) {
      getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("settingsUpdated", map);
    }
  }
}
