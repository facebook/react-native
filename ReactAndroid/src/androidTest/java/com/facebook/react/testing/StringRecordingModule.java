/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import java.util.ArrayList;
import java.util.List;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Native module provides single method {@link #record} which records its single string argument
 * in calls array
 */
public class StringRecordingModule extends BaseJavaModule {

  private final List<String> mCalls = new ArrayList<String>();

  @Override
  public String getName() {
    return "Recording";
  }

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
