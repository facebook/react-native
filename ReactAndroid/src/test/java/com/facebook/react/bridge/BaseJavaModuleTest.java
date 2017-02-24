/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.util.Map;

import com.facebook.react.bridge.ReadableNativeArray;

import org.junit.Before;
import org.junit.Rule;
import org.junit.runner.RunWith;
import org.junit.Test;
import org.mockito.Mockito;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import com.facebook.soloader.SoLoader;

/**
 * Tests for {@link BaseJavaModule}
 */
@PrepareForTest({ReadableNativeArray.class, SoLoader.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
@RunWith(RobolectricTestRunner.class)
public class BaseJavaModuleTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private Map<String, NativeModule.NativeMethod> mMethods;
  private ReadableNativeArray mArguments;

  @Before
  public void setup() {
    mMethods = new MethodsModule().getMethods();
    PowerMockito.mockStatic(SoLoader.class);
    mArguments = PowerMockito.mock(ReadableNativeArray.class);
  }

  @Test(expected = NativeArgumentsParseException.class)
  public void testCallMethodWithoutEnoughArgs() throws Exception {
    BaseJavaModule.NativeMethod regularMethod = mMethods.get("regularMethod");
    Mockito.stub(mArguments.size()).toReturn(1);
    regularMethod.invoke(null, null, mArguments);
  }

  @Test
  public void testCallMethodWithEnoughArgs() {
    BaseJavaModule.NativeMethod regularMethod = mMethods.get("regularMethod");
    Mockito.stub(mArguments.size()).toReturn(2);
    regularMethod.invoke(null, null, mArguments);
  }

  @Test
  public void testCallAsyncMethodWithEnoughArgs() {
    // Promise block evaluates to 2 args needing to be passed from JS
    BaseJavaModule.NativeMethod asyncMethod = mMethods.get("asyncMethod");
    Mockito.stub(mArguments.size()).toReturn(3);
    asyncMethod.invoke(null, null, mArguments);
  }

  @Test
  public void testCallSyncMethod() {
    BaseJavaModule.NativeMethod syncMethod = mMethods.get("syncMethod");
    Mockito.stub(mArguments.size()).toReturn(2);
    syncMethod.invoke(null, null, mArguments);
  }

  private static class MethodsModule extends BaseJavaModule {
    @Override
    public String getName() {
      return "Methods";
    }

    @ReactMethod
    public void regularMethod(String a, int b) {}

    @ReactMethod
    public void asyncMethod(int a, Promise p) {}

    @ReactMethod(isBlockingSynchronousMethod = true)
    public int syncMethod(int a, int b) {
      return a + b;
    }
  }
}
