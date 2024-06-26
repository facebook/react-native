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
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder;
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings;
import java.util.HashMap;
import java.util.Map;

@DoNotStrip
@ReactModule(name = SampleTurboModule.NAME)
public class SampleTurboModule extends NativeSampleTurboModuleSpec
    implements TurboModuleWithJSIBindings {

  public static final String NAME = "SampleTurboModule";

  private static final String TAG = SampleTurboModule.class.getName();
  private final ReactApplicationContext mContext;
  private Toast mToast;

  public SampleTurboModule(ReactApplicationContext context) {
    super(context);
    mContext = context;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @Override
  public boolean getBool(boolean arg) {
    log("getBool", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @Override
  public double getEnum(double arg) {
    log("getEnum", arg, arg);
    return arg;
  }

  @Override
  protected Map<String, Object> getTypedExportedConstants() {
    Map<String, Object> result = new HashMap<>();
    DisplayMetrics displayMetrics = new DisplayMetrics();
    Activity activity = mContext.getCurrentActivity();
    if (activity != null) {
      activity.getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
      result.put("const2", displayMetrics.widthPixels);
    }
    result.put("const1", true);
    result.put("const3", "something");
    log("constantsToExport", "", result);
    return result;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @Override
  public double getNumber(double arg) {
    log("getNumber", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @Override
  public String getString(String arg) {
    log("getString", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @Override
  public double getRootTag(double arg) {
    log("getRootTag", arg, arg);
    return arg;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @Override
  public void voidFunc() {
    log("voidFunc", "<void>", "<void>");
    return;
  }

  // This function returns {@link WritableMap} instead of {@link Map} for backward compat with
  // existing native modules that use this Writable* as return types or in events. {@link
  // WritableMap} is modified in the Java side, and read (or consumed) on the C++ side.
  // In the future, all native modules should ideally return an immutable Map
  @DoNotStrip
  @Override
  @SuppressWarnings("unused")
  public WritableMap getObject(ReadableMap arg) {
    WritableNativeMap map = new WritableNativeMap();
    map.merge(arg);
    log("getObject", arg, map);
    return map;
  }

  @DoNotStrip
  @Override
  @SuppressWarnings("unused")
  public WritableMap getUnsafeObject(ReadableMap arg) {
    WritableNativeMap map = new WritableNativeMap();
    map.merge(arg);
    log("getUnsafeObject", arg, map);
    return map;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @Override
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
  @Override
  public void getValueWithCallback(final Callback callback) {
    String result = "Value From Callback";
    log("Callback", "Return Time", result);
    callback.invoke(result);
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  @Override
  public WritableArray getArray(ReadableArray arg) {
    if (arg == null || Arguments.toList(arg) == null) {
      // Returning an empty array, since the super class always returns non-null
      return new WritableNativeArray();
    }
    WritableArray result = Arguments.makeNativeArray(Arguments.toList(arg));
    log("getArray", arg, result);
    return result;
  }

  @Override
  @DoNotStrip
  @SuppressWarnings("unused")
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
  @DoNotStrip
  @SuppressWarnings("unused")
  public void voidFuncThrows() {
    throw new RuntimeException("Intentional exception from JVM voidFuncThrows");
  }
  ;

  @Override
  @DoNotStrip
  @SuppressWarnings("unused")
  public WritableMap getObjectThrows(ReadableMap arg) {
    throw new RuntimeException(
        "Intentional exception from JVM getObjectThrows with " + arg.toString());
  }
  ;

  @Override
  @DoNotStrip
  @SuppressWarnings("unused")
  public void promiseThrows(Promise promise) {
    throw new RuntimeException("Intentional exception from JVM promiseThrows");
  }
  ;

  @Override
  @DoNotStrip
  @SuppressWarnings("unused")
  public void voidFuncAssert() {
    assert false : "Intentional assert from JVM voidFuncAssert";
  }
  ;

  @Override
  @DoNotStrip
  @SuppressWarnings("unused")
  public WritableMap getObjectAssert(ReadableMap arg) {
    assert false : "Intentional assert from JVM getObjectAssert with " + arg.toString();
    return null;
  }
  ;

  @Override
  @DoNotStrip
  @SuppressWarnings("unused")
  public void promiseAssert(Promise promise) {
    assert false : "Intentional assert from JVM promiseAssert";
  }
  ;

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

  @Override
  @DoNotStrip
  public native BindingsInstallerHolder getBindingsInstaller();
}
