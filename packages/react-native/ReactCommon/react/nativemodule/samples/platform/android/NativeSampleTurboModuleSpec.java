/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

package com.facebook.fbreact.specs;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.text.NumberFormat;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;

public abstract class NativeSampleTurboModuleSpec extends ReactContextBaseJavaModule
    implements TurboModule {
  public NativeSampleTurboModuleSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  public enum SampleTurboModuleIntEnum {
    A(23),
    B(42);

    static @Nullable SampleTurboModuleIntEnum fromRawValue(int rawValue) {
      switch (String.valueOf(rawValue)) {
        case "23":
          return A;
        case "42":
          return B;
        default:
          return null;
      }
    }

    private final int rawValue;

    SampleTurboModuleIntEnum(int rawValue) {
      this.rawValue = rawValue;
    }

    public int getRawValue() {
      return rawValue;
    }
  }

  public enum SampleTurboModuleDecimalEnum {
    FA(1.23456789e-6),
    FB(4.56);

    static @Nullable SampleTurboModuleDecimalEnum fromRawValue(double rawValue) {
      NumberFormat formatter = NumberFormat.getInstance();
      formatter.setGroupingUsed(false);
      formatter.setMaximumFractionDigits(Integer.MAX_VALUE);
      formatter.setMaximumIntegerDigits(Integer.MAX_VALUE);
      String strRawValue = formatter.format(rawValue);

      switch (strRawValue) {
        case "0.00000123456789":
          return FA;
        case "4.56":
          return FB;
        default:
          return null;
      }
    }

    private final double rawValue;

    SampleTurboModuleDecimalEnum(double rawValue) {
      this.rawValue = rawValue;
    }

    public double getRawValue() {
      return rawValue;
    }
  }

  public enum SampleTurboModuleNoneEnum {
    NA("NA"),
    NB("NB");

    static @Nullable SampleTurboModuleNoneEnum fromRawValue(String rawValue) {
      switch (rawValue) {
        case "NA":
          return NA;
        case "NB":
          return NB;
        default:
          return null;
      }
    }

    private final String rawValue;

    SampleTurboModuleNoneEnum(String rawValue) {
      this.rawValue = rawValue;
    }

    public String getRawValue() {
      return rawValue;
    }
  }

  public enum SampleTurboModuleStrEnum {
    SA("s---a"),
    SB("s---b");

    static @Nullable SampleTurboModuleStrEnum fromRawValue(String rawValue) {
      switch (rawValue) {
        case "s---a":
          return SA;
        case "s---b":
          return SB;
        default:
          return null;
      }
    }

    private final String rawValue;

    SampleTurboModuleStrEnum(String rawValue) {
      this.rawValue = rawValue;
    }

    public String getRawValue() {
      return rawValue;
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract double getNumber(double arg);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract WritableMap getValue(double x, String y, ReadableMap z);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract WritableMap getObject(ReadableMap arg);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract WritableMap getUnsafeObject(ReadableMap arg);

  @ReactMethod
  public abstract void voidFunc();

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract WritableArray getArray(ReadableArray arg);

  @ReactMethod
  public abstract void getValueWithPromise(boolean error, Promise promise);

  @ReactMethod
  public abstract void getValueWithCallback(Callback callback);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract String getString(String arg);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract double getRootTag(double arg);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract boolean getBool(boolean arg);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract int getIntEnum(int intEnum);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract String getStrEnum(String strEnum);

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract int getDecimalEnum(double doubleEnum);

  @ReactMethod()
  public abstract void voidFuncThrows();

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract WritableMap getObjectThrows(ReadableMap arg);

  @ReactMethod()
  public abstract void promiseThrows(Promise promise);

  @ReactMethod()
  public abstract void voidFuncAssert();

  @ReactMethod(isBlockingSynchronousMethod = true)
  public abstract WritableMap getObjectAssert(ReadableMap arg);

  @ReactMethod()
  public abstract void promiseAssert(Promise promise);

  protected abstract Map<String, Object> getTypedExportedConstants();

  @Override
  public final @Nullable Map<String, Object> getConstants() {
    Map<String, Object> constants = getTypedExportedConstants();
    if (ReactBuildConfig.DEBUG || ReactBuildConfig.IS_INTERNAL_BUILD) {
      Set<String> obligatoryFlowConstants =
          new HashSet<>(Arrays.asList("const2", "const1", "const3"));
      Set<String> optionalFlowConstants = new HashSet<>();
      Set<String> undeclaredConstants = new HashSet<>(constants.keySet());
      undeclaredConstants.removeAll(obligatoryFlowConstants);
      undeclaredConstants.removeAll(optionalFlowConstants);
      if (!undeclaredConstants.isEmpty()) {
        throw new IllegalStateException(
            String.format("Native Module Flow doesn't declare constants: %s", undeclaredConstants));
      }
      undeclaredConstants = obligatoryFlowConstants;
      undeclaredConstants.removeAll(constants.keySet());
      if (!undeclaredConstants.isEmpty()) {
        throw new IllegalStateException(
            String.format("Native Module doesn't fill in constants: %s", undeclaredConstants));
      }
    }
    return constants;
  }
}
