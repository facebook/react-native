/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.testing;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;

/** Dummy implementation of storage module, used for testing */
public final class FakeAsyncLocalStorage extends BaseJavaModule {

  private static WritableMap errorMessage;

  static {
    errorMessage = Arguments.createMap();
    errorMessage.putString("message", "Fake Async Local Storage");
  }

  @Override
  public String getName() {
    return "AsyncSQLiteDBStorage";
  }

  @ReactMethod
  public void multiGet(final ReadableArray keys, final Callback callback) {
    callback.invoke(errorMessage, null);
  }

  @ReactMethod
  public void multiSet(final ReadableArray keyValueArray, final Callback callback) {
    callback.invoke(errorMessage);
  }

  @ReactMethod
  public void multiRemove(final ReadableArray keys, final Callback callback) {
    callback.invoke(errorMessage);
  }

  @ReactMethod
  public void clear(Callback callback) {
    callback.invoke(errorMessage);
  }

  @ReactMethod
  public void getAllKeys(final Callback callback) {
    callback.invoke(errorMessage, null);
  }
}
