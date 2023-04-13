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
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import java.util.Map;

public class DoublerModule extends NativeDoublerSpec {
  public static String NAME = "Doubler";

  DoublerModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @Override
  public void doubleTheValue(Object value, Promise promise) {
    if (value instanceof Double) {
      Double d = (Double) value;
      promise.resolve(d.doubleValue() * 2);
    } else if (value instanceof String) {
      String s = (String) value;
      promise.resolve(s + s);
    } else if (value instanceof ReadableMap) {
      Map<String, Object> map = ((ReadableMap) value).toHashMap();
      WritableMap toSend = new WritableNativeMap();

      if (map.containsKey("aNumber")) {
        Double d = (Double) map.get("aNumber");
        toSend.putDouble("aNumber", d.doubleValue() * 2);
      } else if (map.containsKey("aString")) {
        String s = (String) map.get("aString");
        toSend.putString("aString", s + s);
      } else {
        promise.reject("Unknown type received");
        return;
      }
      promise.resolve(toSend);
    }
    promise.reject("Received a value that can't be computed");
  }
}
