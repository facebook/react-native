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

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Module that exposes the URL to the source code map (used for exception stack trace parsing) to JS
 */
@ReactModule(name = "RCTSourceCode")
public class SourceCodeModule extends BaseJavaModule {

  private final ReactContext mReactContext;
  private @Nullable String mSourceUrl;

  public SourceCodeModule(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  public void initialize() {
    super.initialize();

    mSourceUrl =
      Assertions.assertNotNull(
        mReactContext.getCatalystInstance().getSourceURL(),
        "No source URL loaded, have you initialised the instance?");
  }

  @Override
  public String getName() {
    return "RCTSourceCode";
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put("scriptURL", mSourceUrl);
    return constants;
  }
}
