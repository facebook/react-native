/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.deviceinfo;

import android.bluetooth.BluetoothAdapter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings.Secure;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.common.ReactConstants;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import javax.annotation.Nullable;

/**
 * DeviceInfo module. Get Android device information from JS.
 */
public class DeviceInfoModule extends ReactContextBaseJavaModule {

  public DeviceInfoModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "DeviceInfoModule";
  }

  /**
   * Return the current language
   */
  private String getCurrentLanguage() {
    Locale current = getReactApplicationContext().getResources().getConfiguration().locale;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      return current.toLanguageTag();
    } else {
      StringBuilder builder = new StringBuilder();
      builder.append(current.getLanguage());
      if (current.getCountry() != null) {
        builder.append("-");
        builder.append(current.getCountry());
      }
      return builder.toString();
    }
  }

  /**
   * Return the current locale
   */
  private String getCurrentCountry() {
    Locale current = getReactApplicationContext().getResources().getConfiguration().locale;
    return current.getCountry();
  }

  /**
   * Expose constants to Javascript
   */
  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<String, Object>();

    PackageManager packageManager = getReactApplicationContext().getPackageManager();
    String packageName = getReactApplicationContext().getPackageName();

    try {
      PackageInfo info = packageManager.getPackageInfo(packageName, 0);
      constants.put("appVersion", info.versionName);
      constants.put("buildNumber", info.versionCode);
    } catch (PackageManager.NameNotFoundException e) {
      constants.put("appVersion", "Not Available");
      constants.put("buildNumber", 0);
      FLog.e(ReactConstants.TAG, e.getMessage(), e);
    }

    try {
      BluetoothAdapter myDevice = BluetoothAdapter.getDefaultAdapter();
      constants.put("deviceName", myDevice.getName());
    } catch(Exception e) {
      constants.put("deviceName", "Unknown");
      FLog.e(ReactConstants.TAG, e.getMessage(), e);
    }

    constants.put("SystemName", "Android");
    constants.put("SystemVersion", Build.VERSION.RELEASE);
    constants.put("Model", Build.MODEL);
    constants.put("DeviceID", Build.BOARD);
    constants.put("DeviceLocale", this.getCurrentLanguage());
    constants.put("DeviceCountry", this.getCurrentCountry());
    constants.put("UniqueID", Secure.getString(getReactApplicationContext().getContentResolver(), Secure.ANDROID_ID));
    constants.put("Manufacturer", Build.MANUFACTURER);
    constants.put("PackageName", packageName);
    constants.put("UserAgent", System.getProperty("http.agent"));
    return constants;
  }
}
