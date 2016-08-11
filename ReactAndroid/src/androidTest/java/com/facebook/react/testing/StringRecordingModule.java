/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import java.util.ArrayList;
import java.util.List;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.annotations.ReactModule;

/**
 * Native module provides single method {@link #record} which records its single string argument
 * in calls array
 */
@ReactModule(name = "Recording")
public class StringRecordingModule extends BaseJavaModule {

  private final List<String> mCalls = new ArrayList<String>();

  @ReactMethod
  public void record(String text) {
    mCalls.add(text);
  }

  public void reset() {
    mCalls.clear();
  }

  public List<String> getCalls() {
    return mCalls;
  }
}
