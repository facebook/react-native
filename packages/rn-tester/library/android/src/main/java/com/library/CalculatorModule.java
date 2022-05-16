/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.library;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;

public class CalculatorModule extends NativeCalculatorSpec {
  public static final String NAME = "Calculator";

  CalculatorModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void add(double a, double b, Promise promise) {
    promise.resolve(a + b);
  }
}
