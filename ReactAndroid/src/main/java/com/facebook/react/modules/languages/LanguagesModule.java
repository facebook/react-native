/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.languages;

import javax.annotation.Nullable;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

/**
 * Native module that exposes devices languages to JS.
 */
@ReactModule(name = "Languages")
public class LanguagesModule extends ReactContextBaseJavaModule {

  private final LanguagesBroadcastReceiver mLanguagesBroadcastReceiver;

  public LanguagesModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mLanguagesBroadcastReceiver = new LanguagesBroadcastReceiver();
    registerReceiver();
  }

  @Override
  public String getName() {
    return "Languages";
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    String language = getLanguage();
    WritableArray languages = Arguments.createArray();

    languages.pushString(language);

    constants.put("language", language);
    constants.put("languages", languages);

    return constants;
  }

  private String getLanguage() {
    return toLanguageTag(getReactApplicationContext()
        .getResources().getConfiguration().locale);
  }

  private String toLanguageTag(Locale locale) {
    StringBuilder builder = new StringBuilder();
    builder.append(locale.getLanguage());

    if (locale.getCountry() != null) {
      builder.append("-");
      builder.append(locale.getCountry());
    }

    return builder.toString();
  }

  private void registerReceiver() {
    IntentFilter filter = new IntentFilter(Intent.ACTION_LOCALE_CHANGED);
    getReactApplicationContext().registerReceiver(mLanguagesBroadcastReceiver, filter);
  }

  private void sendLanguagesChangedEvent() {
    WritableMap languagesMap = Arguments.createMap();
    String language = getLanguage();
    WritableArray languages = Arguments.createArray();

    languages.pushString(language);
    
    languagesMap.putString("language", language);
    languagesMap.putArray("languages", languages);

    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
        .emit("languagesDidChange", languagesMap);
  }

  /**
   * Class that receives intents whenever the languages changes.
   */
  private class LanguagesBroadcastReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
      if (intent.getAction().equals(Intent.ACTION_LOCALE_CHANGED)) {
        sendLanguagesChangedEvent();
      }
    }
  }
}
