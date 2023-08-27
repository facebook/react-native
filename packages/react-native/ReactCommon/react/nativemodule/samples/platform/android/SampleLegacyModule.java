/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.fbreact.specs;

import android.app.Activity;
import android.util.DisplayMetrics;
import android.widget.Toast;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nullable;

@ReactModule(name = SampleLegacyModule.NAME)
public class SampleLegacyModule extends ReactContextBaseJavaModule {

  public static final String NAME = "SampleLegacyModule";

  private static final String TAG = SampleLegacyModule.class.getName();
  private final ReactApplicationContext mContext;
  private Toast mToast;

  public SampleLegacyModule(ReactApplicationContext context) {
    super(context);
    mContext = context;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean getBool(boolean arg) {
    log("getBool", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public double getEnum(double arg) {
    log("getEnum", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public double getDouble(double arg) {
    log("getDouble", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public int getInt(int arg) {
    log("getInt", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public float getFloat(float arg) {
    log("getFloat", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public double getObjectDouble(Double arg) {
    log("getObjectDouble", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public Integer getObjectInteger(Integer arg) {
    log("getObjectInteger", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public Float getObjectFloat(Float arg) {
    log("getObjectFloat", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getString(String arg) {
    log("getString", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public double getRootTag(double arg) {
    log("getRootTag", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod
  public void voidFunc() {
    log("voidFunc", "<void>", "<void>");
    return;
  }

  // This function returns {@link WritableMap} instead of {@link Map} for backward compat with
  // existing native modules that use this Writable* as return types or in events. {@link
  // WritableMap} is modified in the Java side, and read (or consumed) on the C++ side.
  // In the future, all native modules should ideally return an immutable Map
  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap getObject(ReadableMap arg) {
    WritableNativeMap map = new WritableNativeMap();
    map.merge(arg);
    log("getObject", arg, map);
    return map;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap getUnsafeObject(ReadableMap arg) {
    WritableNativeMap map = new WritableNativeMap();
    map.merge(arg);
    log("getUnsafeObject", arg, map);
    return map;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap getValue(double numberArg, String stringArg, ReadableMap mapArg) {
    WritableMap map = new WritableNativeMap();
    map.putDouble("x", numberArg);
    map.putString("y", stringArg);
    WritableMap zMap = new WritableNativeMap();
    zMap.merge(mapArg);
    map.putMap("z", zMap);
    log(
        "getValue",
        MapBuilder.of("1-numberArg", numberArg, "2-stringArg", stringArg, "3-mapArg", mapArg),
        map);
    return map;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod
  public void getValueWithCallback(final Callback callback) {
    String result = "Value From Callback";
    log("Callback", "Return Time", result);
    callback.invoke(result);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableArray getArray(ReadableArray arg) {
    if (arg == null || Arguments.toList(arg) == null) {
      // Returning an empty array, since the super class always returns non-null
      return new WritableNativeArray();
    }
    WritableArray result = Arguments.makeNativeArray(Arguments.toList(arg));
    log("getArray", arg, result);
    return result;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @ReactMethod
  public void getValueWithPromise(boolean error, Promise promise) {
    if (error) {
      promise.reject(
          "code 1",
          "intentional promise rejection",
          new Throwable("promise intentionally rejected"));
    } else {
      promise.resolve("result");
    }
  }

  @Override
  public final @Nullable Map<String, Object> getConstants() {
    Map<String, Object> result = new HashMap<>();
    DisplayMetrics displayMetrics = new DisplayMetrics();
    Activity activity = mContext.getCurrentActivity();
    if (activity != null) {
      result.put("const2", 390);
    }
    result.put("const1", true);
    result.put("const3", "something");
    log("constantsToExport", "", result);
    return result;
  }

  private void log(String method, Object input, Object output) {
    if (mToast != null) {
      mToast.cancel();
    }
    StringBuilder message = new StringBuilder("Method :");
    message
        .append(method)
        .append("\nInputs: ")
        .append(input.toString())
        .append("\nOutputs: ")
        .append(output.toString());
    mToast = Toast.makeText(mContext, message.toString(), Toast.LENGTH_LONG);
    mToast.show();
  }

  public void invalidate() {}

  @Override
  public String getName() {
    return NAME;
  }
}
