/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.systeminfo;

import javax.annotation.Nullable;

import java.util.HashMap;
import java.util.Map;

import android.os.Build;

import com.facebook.react.bridge.BaseJavaModule;

/**
 * Module that exposes Android Constants to JS.
 */
public class AndroidInfoModule extends BaseJavaModule {

  @Override
  public String getName() {
    return "AndroidConstants";
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<String, Object>();
    constants.put("Version", Build.VERSION.SDK_INT);
    return constants;
  }
}
