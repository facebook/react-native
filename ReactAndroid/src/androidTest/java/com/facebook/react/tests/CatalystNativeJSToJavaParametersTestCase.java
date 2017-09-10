/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.InvalidIteratorException;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NoSuchKeyException;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.UnexpectedNativeTypeException;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.appstate.AppStateModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import com.facebook.react.testing.FakeWebSocketModule;
import com.facebook.react.testing.ReactIntegrationTestCase;
import com.facebook.react.testing.ReactTestHelper;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.view.ReactViewManager;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.Ignore;

/**
 * Integration test to verify passing various types of parameters from JS to Java works
 *
 * TODO: we should run these tests with isBlockingSynchronousMethod = true as well,
 * since they currrently use a completely different codepath
 */
@Ignore("Fix prop types and view managers.")
public class CatalystNativeJSToJavaParametersTestCase extends ReactIntegrationTestCase {

  private interface TestJSToJavaParametersModule extends JavaScriptModule {
    void returnBasicTypes();
    void returnBoxedTypes();
    void returnDynamicTypes();

    void returnArrayWithBasicTypes();
    void returnNestedArray();
    void returnArrayWithMaps();

    void returnMapWithBasicTypes();
    void returnNestedMap();
    void returnMapWithArrays();

    void returnArrayWithStringDoubleIntMapArrayBooleanNull();
    void returnMapWithStringDoubleIntMapArrayBooleanNull();

    void returnMapForMerge1();
    void returnMapForMerge2();

    void returnMapWithMultibyteUTF8CharacterString();
    void returnArrayWithMultibyteUTF8CharacterString();

    void returnArrayWithLargeInts();
    void returnMapWithLargeInts();
  }

  private RecordingTestModule mRecordingTestModule;
  private CatalystInstance mCatalystInstance;

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(
        new ReactViewManager());
    final UIManagerModule mUIManager =
        new UIManagerModule(getContext(), viewManagers, new UIImplementationProvider(), false, 0);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mUIManager.onHostResume();
          }
        });
    waitForIdleSync();

    mRecordingTestModule = new RecordingTestModule();
    mCatalystInstance = ReactTestHelper.catalystInstanceBuilder(this)
        .addNativeModule(mRecordingTestModule)
        .addNativeModule(new AndroidInfoModule())
        .addNativeModule(new DeviceInfoModule(getContext()))
        .addNativeModule(new AppStateModule(getContext()))
        .addNativeModule(new FakeWebSocketModule())
        .addNativeModule(mUIManager)
        .build();
  }

  public void testBasicTypes() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnBasicTypes();
    waitForBridgeAndUIIdle();

    List<Object[]> basicTypesCalls = mRecordingTestModule.getBasicTypesCalls();
    assertEquals(1, basicTypesCalls.size());

    Object[] args = basicTypesCalls.get(0);
    assertEquals("foo", args[0]);
    assertEquals(3.14, args[1]);
    assertEquals(true, args[2]);
    assertNull(args[3]);
  }

  public void testBoxedTypes() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnBoxedTypes();
    waitForBridgeAndUIIdle();

    List<Object[]> boxedTypesCalls = mRecordingTestModule.getBoxedTypesCalls();
    assertEquals(1, boxedTypesCalls.size());

    Object[] args = boxedTypesCalls.get(0);
    assertEquals(Integer.valueOf(42), args[0]);
    assertEquals(Double.valueOf(3.14), args[1]);
    assertEquals(Boolean.valueOf(true), args[2]);
  }

  public void testDynamicType() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnDynamicTypes();
    waitForBridgeAndUIIdle();

    List<Dynamic> dynamicCalls = mRecordingTestModule.getDynamicCalls();
    assertEquals(2, dynamicCalls.size());

    assertEquals("foo", dynamicCalls.get(0).asString());
    assertEquals(3.14, dynamicCalls.get(1).asDouble());
  }

  public void testArrayWithBasicTypes() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnArrayWithBasicTypes();
    waitForBridgeAndUIIdle();

    List<ReadableArray> calls = mRecordingTestModule.getArrayCalls();
    assertEquals(1, calls.size());
    ReadableArray array = calls.get(0);
    assertNotNull(array);
    assertEquals(5, array.size());
    assertFalse(array.isNull(0));
    assertEquals("foo", array.getString(0));
    assertFalse(array.isNull(1));
    assertEquals(3.14, array.getDouble(1));
    assertFalse(array.isNull(2));
    assertEquals(-111, array.getInt(2));
    assertFalse(array.isNull(3));
    assertTrue(array.getBoolean(3));
    assertTrue(array.isNull(4));
    assertEquals(null, array.getString(4));
    assertEquals(null, array.getMap(4));
    assertEquals(null, array.getArray(4));
  }

  public void testNestedArray() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnNestedArray();
    waitForBridgeAndUIIdle();

    List<ReadableArray> calls = mRecordingTestModule.getArrayCalls();
    assertEquals(1, calls.size());
    ReadableArray array = calls.get(0);
    assertNotNull(array);
    assertEquals(2, array.size());
    assertEquals("we", array.getString(0));

    assertFalse(array.isNull(1));
    ReadableArray subArray = array.getArray(1);
    assertEquals(2, subArray.size());
    assertEquals("have", subArray.getString(0));

    subArray = subArray.getArray(1);
    assertEquals(2, subArray.size());
    assertEquals("to", subArray.getString(0));

    subArray = subArray.getArray(1);
    assertEquals(2, subArray.size());
    assertEquals("go", subArray.getString(0));

    subArray = subArray.getArray(1);
    assertEquals(1, subArray.size());
    assertEquals("deeper", subArray.getString(0));
  }

  public void testArrayWithMaps() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnArrayWithMaps();
    waitForBridgeAndUIIdle();

    List<ReadableArray> calls = mRecordingTestModule.getArrayCalls();
    assertEquals(1, calls.size());
    ReadableArray array = calls.get(0);
    assertEquals(2, array.size());

    assertFalse(array.isNull(0));
    ReadableMap m1 = array.getMap(0);
    ReadableMap m2 = array.getMap(1);

    assertEquals("m1v1", m1.getString("m1k1"));
    assertEquals("m1v2", m1.getString("m1k2"));
    assertEquals("m2v1", m2.getString("m2k1"));
  }

  public void testMapWithBasicTypes() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapWithBasicTypes();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableMap map = calls.get(0);
    assertNotNull(map);

    assertTrue(map.hasKey("stringKey"));
    assertFalse(map.isNull("stringKey"));
    assertEquals("stringValue", map.getString("stringKey"));

    assertTrue(map.hasKey("doubleKey"));
    assertFalse(map.isNull("doubleKey"));
    assertTrue(Math.abs(3.14 - map.getDouble("doubleKey")) < .0001);

    assertTrue(map.hasKey("intKey"));
    assertFalse(map.isNull("intKey"));
    assertEquals(-11, map.getInt("intKey"));

    assertTrue(map.hasKey("booleanKey"));
    assertFalse(map.isNull("booleanKey"));
    assertTrue(map.getBoolean("booleanKey"));

    assertTrue(map.hasKey("nullKey"));
    assertTrue(map.isNull("nullKey"));
    assertNull(map.getString("nullKey"));
    assertNull(map.getMap("nullKey"));
    assertNull(map.getArray("nullKey"));

    assertFalse(map.hasKey("nonExistentKey"));
  }

  public void testNestedMap() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnNestedMap();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableMap map = calls.get(0);
    assertNotNull(map);

    assertTrue(map.hasKey("weHaveToGoDeeper"));
    assertFalse(map.isNull("weHaveToGoDeeper"));
    ReadableMap nestedMap = map.getMap("weHaveToGoDeeper");
    assertTrue(nestedMap.hasKey("inception"));
    assertTrue(nestedMap.getBoolean("inception"));
  }

  public void testMapParameterWithArrays() throws InterruptedException {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapWithArrays();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableMap map = calls.get(0);
    assertNotNull(map);

    ReadableArray arrayParameter;
    assertTrue(map.hasKey("empty"));
    arrayParameter = map.getArray("empty");
    assertNotNull(arrayParameter);
    assertEquals(0, arrayParameter.size());

    assertTrue(map.hasKey("ints"));
    assertFalse(map.isNull("ints"));
    arrayParameter = map.getArray("ints");
    assertNotNull(arrayParameter);
    assertEquals(2, arrayParameter.size());
    assertEquals(43, arrayParameter.getInt(0));
    assertEquals(44, arrayParameter.getInt(1));

    assertTrue(map.hasKey("mixed"));
    arrayParameter = map.getArray("mixed");
    assertNotNull(arrayParameter);
    assertEquals(3, arrayParameter.size());
    assertEquals(77, arrayParameter.getInt(0));
    assertEquals("string", arrayParameter.getString(1));
    ReadableArray nestedArray = arrayParameter.getArray(2);
    assertEquals(2, nestedArray.size());
  }

  public void testMapParameterDump() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapWithBasicTypes();
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnNestedMap();
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapWithArrays();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(3, calls.size());

    // App should not crash while generating debug string representation of arguments
    assertNotNull(calls.get(0).toString());
    assertNotNull(calls.get(1).toString());
    assertNotNull(calls.get(2).toString());
  }

  public void testGetTypeFromArray() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class)
        .returnArrayWithStringDoubleIntMapArrayBooleanNull();
    waitForBridgeAndUIIdle();

    List<ReadableArray> calls = mRecordingTestModule.getArrayCalls();
    assertEquals(1, calls.size());
    ReadableArray array = calls.get(0);

    assertEquals(ReadableType.String, array.getType(0));
    assertEquals(ReadableType.Number, array.getType(1));
    assertEquals(ReadableType.Number, array.getType(2));
    assertEquals(ReadableType.Map, array.getType(3));
    assertEquals(ReadableType.Array, array.getType(4));
    assertEquals(ReadableType.Boolean, array.getType(5));
    assertEquals(ReadableType.Null, array.getType(6));
  }

  public void testGetTypeFromMap() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class)
        .returnMapWithStringDoubleIntMapArrayBooleanNull();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableMap map = calls.get(0);

    assertEquals(ReadableType.String, map.getType("string"));
    assertEquals(ReadableType.Number, map.getType("double"));
    assertEquals(ReadableType.Number, map.getType("int"));
    assertEquals(ReadableType.Map, map.getType("map"));
    assertEquals(ReadableType.Array, map.getType("array"));
    assertEquals(ReadableType.Boolean, map.getType("boolean"));
    assertEquals(ReadableType.Null, map.getType("null"));
  }

  public void testGetWrongTypeFromArray() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class)
        .returnArrayWithStringDoubleIntMapArrayBooleanNull();
    waitForBridgeAndUIIdle();

    List<ReadableArray> calls = mRecordingTestModule.getArrayCalls();
    assertEquals(1, calls.size());
    ReadableArray array = calls.get(0);

    assertUnexpectedTypeExceptionThrown(array, 0, "boolean");
    assertUnexpectedTypeExceptionThrown(array, 1, "string");
    assertUnexpectedTypeExceptionThrown(array, 2, "array");
    assertUnexpectedTypeExceptionThrown(array, 3, "double");
    assertUnexpectedTypeExceptionThrown(array, 4, "map");
    assertUnexpectedTypeExceptionThrown(array, 5, "array");
  }

  public void testGetWrongTypeFromMap() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class)
        .returnMapWithStringDoubleIntMapArrayBooleanNull();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableMap map = calls.get(0);

    assertUnexpectedTypeExceptionThrown(map, "string", "double");
    assertUnexpectedTypeExceptionThrown(map, "double", "map");
    assertUnexpectedTypeExceptionThrown(map, "int", "boolean");
    assertUnexpectedTypeExceptionThrown(map, "map", "array");
    assertUnexpectedTypeExceptionThrown(map, "array", "boolean");
    assertUnexpectedTypeExceptionThrown(map, "boolean", "string");
  }

  public void testArrayOutOfBoundsExceptionThrown() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnArrayWithBasicTypes();
    waitForBridgeAndUIIdle();

    List<ReadableArray> calls = mRecordingTestModule.getArrayCalls();
    assertEquals(1, calls.size());
    ReadableArray array = calls.get(0);
    assertNotNull(array);

    assertArrayOutOfBoundsExceptionThrown(array, -1, "boolean");
    assertArrayOutOfBoundsExceptionThrown(array, -1, "string");
    assertArrayOutOfBoundsExceptionThrown(array, -1, "double");
    assertArrayOutOfBoundsExceptionThrown(array, -1, "int");
    assertArrayOutOfBoundsExceptionThrown(array, -1, "map");
    assertArrayOutOfBoundsExceptionThrown(array, -1, "array");

    assertArrayOutOfBoundsExceptionThrown(array, 10, "boolean");
    assertArrayOutOfBoundsExceptionThrown(array, 10, "string");
    assertArrayOutOfBoundsExceptionThrown(array, 10, "double");
    assertArrayOutOfBoundsExceptionThrown(array, 10, "int");
    assertArrayOutOfBoundsExceptionThrown(array, 10, "map");
    assertArrayOutOfBoundsExceptionThrown(array, 10, "array");
  }

  public void testNoSuchKeyExceptionThrown() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapWithBasicTypes();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableMap map = calls.get(0);
    assertNotNull(map);

    assertNoSuchKeyExceptionThrown(map, "noSuchKey", "double");
    assertNoSuchKeyExceptionThrown(map, "noSuchKey", "int");
    assertNoSuchKeyExceptionThrown(map, "noSuchKey", "map");
    assertNoSuchKeyExceptionThrown(map, "noSuchKey", "array");
    assertNoSuchKeyExceptionThrown(map, "noSuchKey", "boolean");
    assertNoSuchKeyExceptionThrown(map, "noSuchKey", "string");
  }

  public void testIntOutOfRangeThrown() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnArrayWithLargeInts();
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapWithLargeInts();
    waitForBridgeAndUIIdle();

    assertEquals(1, mRecordingTestModule.getArrayCalls().size());
    assertEquals(1, mRecordingTestModule.getMapCalls().size());

    ReadableArray array = mRecordingTestModule.getArrayCalls().get(0);
    assertNotNull(array);

    ReadableMap map = mRecordingTestModule.getMapCalls().get(0);
    assertNotNull(map);

    assertEquals(ReadableType.Number, array.getType(0));
    assertUnexpectedTypeExceptionThrown(array, 0, "int");
    assertEquals(ReadableType.Number, array.getType(1));
    assertUnexpectedTypeExceptionThrown(array, 1, "int");

    assertEquals(ReadableType.Number, map.getType("first"));
    assertUnexpectedTypeExceptionThrown(map, "first", "int");
    assertEquals(ReadableType.Number, map.getType("second"));
    assertUnexpectedTypeExceptionThrown(map, "second", "int");
  }

  public void testMapMerging() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapForMerge1();
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapForMerge2();
    waitForBridgeAndUIIdle();

    List<ReadableMap> maps = mRecordingTestModule.getMapCalls();
    assertEquals(2, maps.size());

    WritableMap dest = new WritableNativeMap();
    dest.merge(maps.get(0));
    dest.merge(maps.get(1));

    assertTrue(dest.hasKey("a"));
    assertTrue(dest.hasKey("b"));
    assertTrue(dest.hasKey("c"));
    assertTrue(dest.hasKey("d"));
    assertTrue(dest.hasKey("e"));
    assertTrue(dest.hasKey("f"));
    assertTrue(dest.hasKey("newkey"));

    assertEquals("overwrite", dest.getString("a"));
    assertEquals(41, dest.getInt("b"));
    assertEquals("string", dest.getString("c"));
    assertEquals(77, dest.getInt("d"));
    assertTrue(dest.isNull("e"));
    assertEquals(3, dest.getArray("f").size());
    assertEquals("newvalue", dest.getString("newkey"));
  }

  public void testMapAccessibleAfterMerge() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapForMerge1();
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapForMerge2();
    waitForBridgeAndUIIdle();

    List<ReadableMap> maps = mRecordingTestModule.getMapCalls();
    assertEquals(2, maps.size());

    WritableMap dest = new WritableNativeMap();
    dest.merge(maps.get(0));
    dest.merge(maps.get(1));

    ReadableMap source = maps.get(1);

    assertTrue(source.hasKey("a"));
    assertTrue(source.hasKey("d"));
    assertTrue(source.hasKey("e"));
    assertTrue(source.hasKey("f"));
    assertTrue(source.hasKey("newkey"));

    assertFalse(source.hasKey("b"));
    assertFalse(source.hasKey("c"));

    assertEquals("overwrite", source.getString("a"));
    assertEquals(77, source.getInt("d"));
    assertTrue(source.isNull("e"));
    assertEquals(3, source.getArray("f").size());
    assertEquals("newvalue", source.getString("newkey"));
  }

  public void testMapIterateOverMapWithBasicTypes() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapWithBasicTypes();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableNativeMap map = (ReadableNativeMap) calls.get(0);
    assertNotNull(map);

    ReadableMapKeySetIterator mapIterator = map.keySetIterator();
    Set<String> keys = new HashSet<String>();
    while (mapIterator.hasNextKey()) {
      keys.add(mapIterator.nextKey());
    }

    Set<String> expectedKeys = new HashSet<String>(
        Arrays.asList("stringKey", "doubleKey", "intKey", "booleanKey", "nullKey"));
    assertEquals(keys, expectedKeys);
  }

  public void testMapIterateOverNestedMaps() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnNestedMap();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableNativeMap map = (ReadableNativeMap) calls.get(0);
    assertNotNull(map);

    ReadableMapKeySetIterator firstLevelIterator = map.keySetIterator();
    String firstLevelKey = firstLevelIterator.nextKey();
    assertEquals(firstLevelKey, "weHaveToGoDeeper");

    ReadableNativeMap secondMap = map.getMap("weHaveToGoDeeper");
    ReadableMapKeySetIterator secondLevelIterator = secondMap.keySetIterator();
    String secondLevelKey = secondLevelIterator.nextKey();
    assertEquals(secondLevelKey, "inception");
    assertTrue(secondMap.getBoolean(secondLevelKey));
  }

  public void testInvalidIteratorExceptionThrown() {
    mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class).returnMapWithBasicTypes();
    waitForBridgeAndUIIdle();

    List<ReadableMap> calls = mRecordingTestModule.getMapCalls();
    assertEquals(1, calls.size());
    ReadableNativeMap map = (ReadableNativeMap) calls.get(0);
    assertNotNull(map);

    ReadableMapKeySetIterator mapIterator = map.keySetIterator();
    while (mapIterator.hasNextKey()) {
      mapIterator.nextKey();
    }
    assertInvalidIteratorExceptionThrown(mapIterator);
  }

  public void testStringWithMultibyteUTF8Characters() {
    TestJSToJavaParametersModule jsModule =
        mCatalystInstance.getJSModule(TestJSToJavaParametersModule.class);
    jsModule.returnMapWithMultibyteUTF8CharacterString();
    jsModule.returnArrayWithMultibyteUTF8CharacterString();
    waitForBridgeAndUIIdle();

    List<ReadableMap> maps = mRecordingTestModule.getMapCalls();
    assertEquals(1, maps.size());

    ReadableMap map = maps.get(0);
    assertEquals("a", map.getString("one-byte"));
    assertEquals("\u00A2", map.getString("two-bytes"));
    assertEquals("\u20AC", map.getString("three-bytes"));
    assertEquals("\uD83D\uDE1C", map.getString("four-bytes"));
    assertEquals(
        "\u017C\u00F3\u0142\u0107 g\u0119\u015Bl\u0105 \u6211 \uD83D\uDE0E ja\u017A\u0107",
        map.getString("mixed"));

    List<ReadableArray> arrays = mRecordingTestModule.getArrayCalls();
    assertEquals(1, arrays.size());

    ReadableArray array = arrays.get(0);
    assertEquals("a", array.getString(0));
    assertEquals("\u00A2", array.getString(1));
    assertEquals("\u20AC", array.getString(2));
    assertEquals("\uD83D\uDE1C", array.getString(3));
    assertEquals(
        "\u017C\u00F3\u0142\u0107 g\u0119\u015Bl\u0105 \u6211 \uD83D\uDE0E ja\u017A\u0107",
        array.getString(4));
  }

  private void assertUnexpectedTypeExceptionThrown(
      ReadableArray array,
      int index,
      String typeToAskFor) {
    boolean gotException = false;
    try {
      arrayGetByType(array, index, typeToAskFor);
    } catch (UnexpectedNativeTypeException expected) {
      gotException = true;
    }

    assertTrue(gotException);
  }

  private void assertUnexpectedTypeExceptionThrown(
      ReadableMap map,
      String key,
      String typeToAskFor) {
    boolean gotException = false;
    try {
      mapGetByType(map, key, typeToAskFor);
    } catch (UnexpectedNativeTypeException expected) {
      gotException = true;
    }

    assertTrue(gotException);
  }

  private void assertArrayOutOfBoundsExceptionThrown(
      ReadableArray array,
      int index,
      String typeToAskFor) {
    boolean gotException = false;
    try {
      arrayGetByType(array, index, typeToAskFor);
    } catch (ArrayIndexOutOfBoundsException expected) {
      gotException = true;
    }

    assertTrue(gotException);
  }

  private void assertNoSuchKeyExceptionThrown(
      ReadableMap map,
      String key,
      String typeToAskFor) {
    boolean gotException = false;
    try {
      mapGetByType(map, key, typeToAskFor);
    } catch (NoSuchKeyException expected) {
      gotException = true;
    }

    assertTrue(gotException);
  }

  private static void assertInvalidIteratorExceptionThrown(
      ReadableMapKeySetIterator iterator) {
    boolean gotException = false;
    try {
      iterator.nextKey();
    } catch (InvalidIteratorException expected) {
      gotException = true;
    }

    assertTrue(gotException);
  }

  private void arrayGetByType(ReadableArray array, int index, String typeToAskFor) {
    if (typeToAskFor.equals("double")) {
      array.getDouble(index);
    } else if (typeToAskFor.equals("int")) {
      array.getInt(index);
    } else if (typeToAskFor.equals("string")) {
      array.getString(index);
    } else if (typeToAskFor.equals("array")) {
      array.getArray(index);
    } else if (typeToAskFor.equals("map")) {
      array.getMap(index);
    } else if (typeToAskFor.equals("boolean")) {
      array.getBoolean(index);
    } else {
      throw new RuntimeException("Unknown type: " + typeToAskFor);
    }
  }

  private void mapGetByType(ReadableMap map, String key, String typeToAskFor) {
    if (typeToAskFor.equals("double")) {
      map.getDouble(key);
    } else if (typeToAskFor.equals("int")) {
      map.getInt(key);
    } else if (typeToAskFor.equals("string")) {
      map.getString(key);
    } else if (typeToAskFor.equals("array")) {
      map.getArray(key);
    } else if (typeToAskFor.equals("map")) {
      map.getMap(key);
    } else if (typeToAskFor.equals("boolean")) {
      map.getBoolean(key);
    } else {
      throw new RuntimeException("Unknown type: " + typeToAskFor);
    }
  }

  private static class RecordingTestModule extends BaseJavaModule {

    private final List<Object[]> mBasicTypesCalls = new ArrayList<Object[]>();
    private final List<Object[]> mBoxedTypesCalls = new ArrayList<Object[]>();
    private final List<ReadableArray> mArrayCalls = new ArrayList<ReadableArray>();
    private final List<ReadableMap> mMapCalls = new ArrayList<ReadableMap>();
    private final List<Dynamic> mDynamicCalls = new ArrayList<Dynamic>();

    @Override
    public String getName() {
      return "Recording";
    }

    @ReactMethod
    public void receiveBasicTypes(String s, double d, boolean b, String nullableString) {
      mBasicTypesCalls.add(new Object[]{s, d, b, nullableString});
    }

    @ReactMethod
    public void receiveBoxedTypes(Integer i, Double d, Boolean b) {
      mBoxedTypesCalls.add(new Object[]{i, d, b});
    }

    @ReactMethod
    public void receiveArray(ReadableArray array) {
      mArrayCalls.add(array);
    }

    @ReactMethod
    public void receiveMap(ReadableMap map) {
      mMapCalls.add(map);
    }

    @ReactMethod
    public void receiveDynamic(Dynamic dynamic) {
      mDynamicCalls.add(dynamic);
    }

    public List<Object[]> getBasicTypesCalls() {
      return mBasicTypesCalls;
    }

    public List<Object[]> getBoxedTypesCalls() {
      return mBoxedTypesCalls;
    }

    public List<ReadableArray> getArrayCalls() {
      return mArrayCalls;
    }

    public List<ReadableMap> getMapCalls() {
      return mMapCalls;
    }

    public List<Dynamic> getDynamicCalls() {
      return mDynamicCalls;
    }
  }
}
