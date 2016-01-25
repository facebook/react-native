/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.debug;

import javax.annotation.Nullable;

import java.util.HashMap;
import java.util.Map;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

/**
 * Module that exposes the URL to the source code map (used for exception stack trace parsing) to JS
 */
public class SourceCodeModule extends BaseJavaModule {

  private final String mSourceMapUrl;
  private final String mSourceUrl;

  public SourceCodeModule(String sourceUrl, String sourceMapUrl) {
    mSourceMapUrl = sourceMapUrl;
    mSourceUrl = sourceUrl;
  }

  @Override
  public String getName() {
    return "RCTSourceCode";
  }

  @ReactMethod
  public void getScriptText(final Promise promise) {
    WritableMap map = new WritableNativeMap();
    map.putString("fullSourceMappingURL", mSourceMapUrl);
    promise.resolve(map);
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<String, Object>();
    constants.put("scriptURL", mSourceUrl);
    return constants;
  }
}
