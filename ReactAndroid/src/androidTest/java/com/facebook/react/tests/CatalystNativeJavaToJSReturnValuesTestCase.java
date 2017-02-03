/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.ArrayList;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.testing.AssertModule;
import com.facebook.react.testing.FakeWebSocketModule;
import com.facebook.react.testing.ReactIntegrationTestCase;
import com.facebook.react.testing.ReactTestHelper;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;

/**
 * Test marshalling return values from Java to JS
 */
public class CatalystNativeJavaToJSReturnValuesTestCase extends ReactIntegrationTestCase {

  private interface TestJavaToJSReturnValuesModule extends JavaScriptModule {
    void callMethod(String methodName, String expectedReturnType, String expectedJSON);
    void triggerException();
  }

  @ReactModule(name = "TestModule")
  private static class TestModule extends BaseJavaModule {
    @Override
    public String getName() {
      return "TestModule";
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    boolean getBoolean() {
      return true;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    Boolean getBoxedBoolean() {
      return Boolean.valueOf(true);
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    int getInt() {
      return 42;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    Integer getBoxedInt() {
      return Integer.valueOf(42);
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    double getDouble() {
      return 3.14159;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    Double getBoxedDouble() {
      return Double.valueOf(3.14159);
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    String getString() {
      return "Hello world!";
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    WritableArray getArray() {
      WritableArray arr = new WritableNativeArray();
      arr.pushString("a");
      arr.pushBoolean(true);
      return arr;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    WritableMap getMap() {
      WritableMap map = new WritableNativeMap();
      map.putBoolean("a", true);
      map.putBoolean("b", false);
      return map;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    boolean triggerException() {
      throw new RuntimeException("Exception triggered");
    }
  }

  private AssertModule mAssertModule;
  private CatalystInstance mInstance;

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    final UIManagerModule mUIManager = new UIManagerModule(
        getContext(),
        new ArrayList<ViewManager>(),
        new UIImplementationProvider(),
        false);

    mAssertModule = new AssertModule();

    mInstance = ReactTestHelper.catalystInstanceBuilder(this)
        .addNativeModule(mAssertModule)
        .addNativeModule(new FakeWebSocketModule())
        .addJSModule(TestJavaToJSReturnValuesModule.class)
        .addNativeModule(mUIManager)
        .addNativeModule(new TestModule())
        .build();
  }

  public void testGetPrimitives() {
    TestJavaToJSReturnValuesModule m = mInstance.getJSModule(TestJavaToJSReturnValuesModule.class);

    // jboolean is actually an unsigned char, so we don't get JS booleans
    m.callMethod("getBoolean", "number", "1");
    m.callMethod("getBoxedBoolean", "number", "1");

    m.callMethod("getInt", "number", "42");
    m.callMethod("getBoxedInt", "number", "42");

    m.callMethod("getDouble", "number", "3.14159");
    m.callMethod("getBoxedDouble", "number", "3.14159");

    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testObjectTypes() {
    TestJavaToJSReturnValuesModule m = mInstance.getJSModule(TestJavaToJSReturnValuesModule.class);

    m.callMethod("getString", "string", "\"Hello world!\"");
    m.callMethod("getArray", "object", "[\"a\",true]");
    m.callMethod("getMap", "object", "{\"b\":false,\"a\":true}");

    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testThrowsException() {
    TestJavaToJSReturnValuesModule m = mInstance.getJSModule(TestJavaToJSReturnValuesModule.class);
    m.triggerException();

    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }
}
