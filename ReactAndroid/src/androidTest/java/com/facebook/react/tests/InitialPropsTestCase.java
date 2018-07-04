/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.os.Bundle;
import android.test.ActivityInstrumentationTestCase2;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.testing.FakeWebSocketModule;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.testing.ReactAppTestActivity;

/**
 * Simple test case for passing initial props to the root React application.
 */
public class InitialPropsTestCase extends
    ActivityInstrumentationTestCase2<ReactAppTestActivity> {

  public static final String DEFAULT_JS_BUNDLE = "AndroidTestBundle.js";

  private static class RecordingModule extends BaseJavaModule {
    private int mCount = 0;
    private ReadableMap mProps;

    @Override
    public String getName() {
      return "InitialPropsRecordingModule";
    }

    @ReactMethod
    public void recordProps(ReadableMap props) {
      mProps = props;
      mCount++;
    }

    public int getCount() {
      return mCount;
    }

    public ReadableMap getProps() {
      return mProps;
    }
  }

  private RecordingModule mRecordingModule;

  public InitialPropsTestCase() {
    super(ReactAppTestActivity.class);
  }

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    mRecordingModule = new RecordingModule();
  }

  public void testInitialProps() throws Throwable {
    final ReactAppTestActivity activity = getActivity();
    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ReactInstanceSpecForTest catalystInstanceSpec = new ReactInstanceSpecForTest();
            catalystInstanceSpec.addNativeModule(new FakeWebSocketModule());
            catalystInstanceSpec.addNativeModule(mRecordingModule);
            Bundle props = new Bundle();
            props.putString("key1", "string");
            props.putInt("key2", 5);
            props.putDouble("key3", 5.5);
            props.putFloat("key4", 5.6f);
            props.putBoolean("key5", true);
            props.putStringArray("key6", new String[]{"one", "two", "three"});
            props.putIntArray("key7", new int[]{1, 2, 3});
            props.putDoubleArray("key8", new double[]{1.5, 2.5, 3.5});
            props.putFloatArray("key9", new float[]{1.6f, 2.6f, 3.6f});
            props.putBooleanArray("key10", new boolean[]{true, false});
            activity.loadApp(
                "InitialPropsTestApp",
                catalystInstanceSpec,
                props,
                DEFAULT_JS_BUNDLE,
                false);
          }
        });
    activity.waitForBridgeAndUIIdle();

    assertEquals(1, mRecordingModule.getCount());
    ReadableMap props = mRecordingModule.getProps();
    assertEquals("string", props.getString("key1"));
    assertEquals(5, props.getInt("key2"));
    assertEquals(5.5, props.getDouble("key3"));
    assertEquals(5.6f, (float) props.getDouble("key4"));
    assertEquals(true, props.getBoolean("key5"));

    ReadableArray stringArray = props.getArray("key6");
    assertEquals("one", stringArray.getString(0));
    assertEquals("two", stringArray.getString(1));
    assertEquals("three", stringArray.getString(2));

    ReadableArray intArray = props.getArray("key7");
    assertEquals(1, intArray.getInt(0));
    assertEquals(2, intArray.getInt(1));
    assertEquals(3, intArray.getInt(2));

    ReadableArray doubleArray = props.getArray("key8");
    assertEquals(1.5, doubleArray.getDouble(0));
    assertEquals(2.5, doubleArray.getDouble(1));
    assertEquals(3.5, doubleArray.getDouble(2));

    ReadableArray floatArray = props.getArray("key9");
    assertEquals(1.6f, (float) floatArray.getDouble(0));
    assertEquals(2.6f, (float) floatArray.getDouble(1));
    assertEquals(3.6f, (float) floatArray.getDouble(2));

    ReadableArray booleanArray = props.getArray("key10");
    assertEquals(true, booleanArray.getBoolean(0));
    assertEquals(false, booleanArray.getBoolean(1));
  }
}
