/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.modules;

import androidx.annotation.NonNull;
import com.facebook.fbreact.specs.NativeDoublerSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;

public class DoublerModule extends NativeDoublerSpec {
  public static final String NAME = "Doubler";

  public DoublerModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @Override
  public void doubleTheValueNumber(double value, Promise promise) {
    promise.resolve(value * 2);
  }

  @Override
  public void doubleTheValueString(String value, Promise promise) {
    promise.resolve(value + value);
  }

  @Override
  public void doubleTheValueObject(ReadableMap value, Promise promise) {
    final String numberKey = "aNumber";
    if (value.hasKey(numberKey)) {
      double d = value.getDouble(numberKey);
      promise.resolve(d * 2);
    } else {
      promise.reject("Unknown type received");
    }
  }

  @Override
  public void doubleTheValueBoxedString(ReadableMap value, Promise promise) {
    final String stringKey = "aString";
    if (value.hasKey(stringKey)) {
      String s = value.getString(stringKey);
      promise.resolve(s + s);
    } else {
      promise.reject("Unknown type received");
    }
  }
}
