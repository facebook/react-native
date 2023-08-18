/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.ArrayList;
import java.util.List;

/**
 * Native module provides single method {@link #record} which records its single string argument in
 * calls array
 */
public class StringRecordingModule extends BaseJavaModule {

  public static final String NAME = "Recording";

  private final List<String> mCalls = new ArrayList<String>();

  @Override
  public String getName() {
    return NAME;
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
