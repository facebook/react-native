/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ObjectAlreadyConsumedException;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.appstate.AppStateModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.testing.AssertModule;
import com.facebook.react.testing.FakeWebSocketModule;
import com.facebook.react.testing.ReactIntegrationTestCase;
import com.facebook.react.testing.ReactTestHelper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.view.ReactViewManager;
import java.util.Arrays;
import java.util.List;
import org.junit.Ignore;

/**
 * Test marshalling arguments from Java to JS to appropriate native classes.
 */
@Ignore("Fix prop types and view managers.")
public class CatalystNativeJavaToJSArgumentsTestCase extends ReactIntegrationTestCase {

  private interface TestJavaToJSArgumentsModule extends JavaScriptModule {
    void receiveBasicTypes(String s, double d, boolean b, String nullString);

    void receiveArrayWithBasicTypes(WritableArray array);
    void receiveNestedArray(WritableArray nestedArray);
    void receiveArrayWithMaps(WritableArray arrayWithMaps);

    void receiveMapWithBasicTypes(WritableMap map);
    void receiveNestedMap(WritableMap nestedMap);
    void receiveMapWithArrays(WritableMap mapWithArrays);
    void receiveMapAndArrayWithNullValues(
        WritableMap map,
        WritableArray array);
    void receiveMapWithMultibyteUTF8CharacterString(WritableMap map);
    void receiveArrayWithMultibyteUTF8CharacterString(WritableArray array);
  }

  private AssertModule mAssertModule;
  private CatalystInstance mInstance;

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(
        new ReactViewManager());
    final UIManagerModule mUIManager =
        new UIManagerModule(getContext(), viewManagers, 0);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mUIManager.onHostResume();
          }
        });
    waitForIdleSync();

    mAssertModule = new AssertModule();

    mInstance = ReactTestHelper.catalystInstanceBuilder(this)
        .addNativeModule(mAssertModule)
        .addNativeModule(new DeviceInfoModule(getContext()))
        .addNativeModule(new AppStateModule(getContext()))
        .addNativeModule(new FakeWebSocketModule())
        .addNativeModule(mUIManager)
        .build();
  }

  public void testBasicTypes() {
    mInstance.getJSModule(TestJavaToJSArgumentsModule.class)
        .receiveBasicTypes("foo", 3.14, true, null);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testArrayWithBasicTypes() {
    WritableNativeArray array = new WritableNativeArray();
    array.pushString("red panda");
    array.pushDouble(1.19);
    array.pushBoolean(true);
    array.pushNull();

    mInstance.getJSModule(TestJavaToJSArgumentsModule.class).receiveArrayWithBasicTypes(array);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testNestedArray() {
    WritableNativeArray level1 = new WritableNativeArray();
    WritableNativeArray level2 = new WritableNativeArray();
    WritableNativeArray level3 = new WritableNativeArray();
    level3.pushString("level3");
    level2.pushString("level2");
    level2.pushArray(level3);
    level1.pushString("level1");
    level1.pushArray(level2);

    mInstance.getJSModule(TestJavaToJSArgumentsModule.class).receiveNestedArray(level1);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testArrayWithMaps() {
    WritableNativeMap m1 = new WritableNativeMap();
    WritableNativeMap m2 = new WritableNativeMap();
    m1.putString("m1k1", "m1v1");
    m1.putString("m1k2", "m1v2");
    m2.putString("m2k1", "m2v1");

    WritableNativeArray array = new WritableNativeArray();
    array.pushMap(m1);
    array.pushMap(m2);
    mInstance.getJSModule(TestJavaToJSArgumentsModule.class).receiveArrayWithMaps(array);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testMapWithBasicTypes() {
    WritableNativeMap map = new WritableNativeMap();
    map.putString("stringKey", "stringValue");
    map.putDouble("doubleKey", 3.14);
    map.putBoolean("booleanKey", true);
    map.putNull("nullKey");

    mInstance.getJSModule(TestJavaToJSArgumentsModule.class).receiveMapWithBasicTypes(map);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testNestedMap() {
    WritableNativeMap map = new WritableNativeMap();
    WritableNativeMap nestedMap = new WritableNativeMap();
    nestedMap.putString("animals", "foxes");
    map.putMap("nestedMap", nestedMap);

    mInstance.getJSModule(TestJavaToJSArgumentsModule.class).receiveNestedMap(map);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testMapWithArrays() {
    WritableNativeMap map = new WritableNativeMap();
    WritableNativeArray a1 = new WritableNativeArray();
    WritableNativeArray a2 = new WritableNativeArray();
    a1.pushDouble(3);
    a1.pushDouble(1);
    a1.pushDouble(4);
    a2.pushDouble(1);
    a2.pushDouble(9);
    map.putArray("array1", a1);
    map.putArray("array2", a2);

    mInstance.getJSModule(TestJavaToJSArgumentsModule.class).receiveMapWithArrays(map);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testMapWithNullStringValue() {
    WritableNativeMap map = new WritableNativeMap();
    map.putString("string", null);
    map.putArray("array", null);
    map.putMap("map", null);

    WritableNativeArray array = new WritableNativeArray();
    array.pushString(null);
    array.pushArray(null);
    array.pushMap(null);

    mInstance.getJSModule(TestJavaToJSArgumentsModule.class)
        .receiveMapAndArrayWithNullValues(map, array);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testStringWithMultibyteUTF8Characters() {
    TestJavaToJSArgumentsModule jsModule = mInstance.getJSModule(TestJavaToJSArgumentsModule.class);

    WritableNativeMap map = new WritableNativeMap();
    map.putString("two-bytes", "\u00A2");
    map.putString("three-bytes", "\u20AC");
    map.putString("four-bytes", "\uD83D\uDE1C");
    map.putString(
        "mixed",
        "\u017C\u00F3\u0142\u0107 g\u0119\u015Bl\u0105 \u6211 \uD83D\uDE0E ja\u017A\u0107");

    jsModule.receiveMapWithMultibyteUTF8CharacterString(map);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();

    WritableArray array = new WritableNativeArray();
    array.pushString("\u00A2");
    array.pushString("\u20AC");
    array.pushString("\uD83D\uDE1C");
    array.pushString(
        "\u017C\u00F3\u0142\u0107 g\u0119\u015Bl\u0105 \u6211 \uD83D\uDE0E ja\u017A\u0107");

    jsModule.receiveArrayWithMultibyteUTF8CharacterString(array);
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testThrowWhenArrayReusedInArray() {
    boolean gotException = false;
    try {
      WritableNativeArray array1 = new WritableNativeArray();
      WritableNativeArray array2 = new WritableNativeArray();
      WritableNativeArray child = new WritableNativeArray();
      array1.pushArray(child);
      array2.pushArray(child);
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);
  }

  public void testThrowWhenArrayReusedInMap() {
    boolean gotException = false;
    try {
      WritableNativeMap map1 = new WritableNativeMap();
      WritableNativeMap map2 = new WritableNativeMap();
      WritableNativeArray child = new WritableNativeArray();
      map1.putArray("child", child);
      map2.putArray("child", child);
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);
  }

  public void testThrowWhenMapReusedInArray() {
    boolean gotException = false;
    try {
      WritableNativeArray array1 = new WritableNativeArray();
      WritableNativeArray array2 = new WritableNativeArray();
      WritableNativeMap child = new WritableNativeMap();
      array1.pushMap(child);
      array2.pushMap(child);
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);
  }

  public void testThrowWhenMapReusedInMap() {
    boolean gotException = false;
    try {
      WritableNativeMap map1 = new WritableNativeMap();
      WritableNativeMap map2 = new WritableNativeMap();
      WritableNativeMap child = new WritableNativeMap();
      map1.putMap("child", child);
      map2.putMap("child", child);
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);
  }

  public void testThrowWhenAddToConsumedArray() {
    WritableNativeArray array = new WritableNativeArray();
    WritableNativeArray parent = new WritableNativeArray();
    parent.pushArray(array);

    boolean gotException = false;
    try {
      array.pushNull();
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      array.pushBoolean(true);
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      array.pushDouble(1);
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      array.pushString("foo");
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      array.pushArray(new WritableNativeArray());
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      array.pushMap(new WritableNativeMap());
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);
  }

  public void testThrowWhenAddToConsumedMap() {
    WritableNativeMap map = new WritableNativeMap();
    WritableNativeArray parent = new WritableNativeArray();
    parent.pushMap(map);

    boolean gotException = false;
    try {
      map.putNull("key");
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      map.putBoolean("key", true);
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      map.putDouble("key", 1);
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      map.putString("key", "foo");
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      map.putArray("key", new WritableNativeArray());
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);

    gotException = false;
    try {
      map.putMap("key", new WritableNativeMap());
    } catch (ObjectAlreadyConsumedException e) {
      gotException = true;
    }
    assertTrue(gotException);
  }
}
