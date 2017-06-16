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

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Module that exposes Android Constants to JS.
 */
@ReactModule(name = "Languages")
public class LanguagesModule extends ReactContextBaseJavaModule {

  public LanguagesModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "Languages";
  }

  private String getLanguage() {
    Locale locale = getReactApplicationContext()
      .getResources().getConfiguration().locale;
    StringBuilder builder = new StringBuilder();

    builder.append(locale.getLanguage());

    if (locale.getCountry() != null) {
      builder.append("-");
      builder.append(locale.getCountry());
    }

    return builder.toString();
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    String language = this.getLanguage();
    WritableArray languages = Arguments.createArray();
    languages.pushString(language);

    constants.put("language", language);
    constants.put("languages", languages);

    return constants;
  }

  @ReactMethod
  public void getAsync(Promise promise) {
    try {
      promise.resolve(this.getLanguage());
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
