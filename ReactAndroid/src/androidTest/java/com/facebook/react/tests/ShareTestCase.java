/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.tests;

import android.app.Instrumentation.ActivityMonitor;
import android.content.Intent;
import android.content.IntentFilter;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.share.ShareModule;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;

/** Test case for {@link ShareModule}. */
public class ShareTestCase extends ReactAppInstrumentationTestCase {

  private static interface ShareTestModule extends JavaScriptModule {
    public void showShareDialog(WritableMap content, WritableMap options);
  }

  private static class ShareRecordingModule extends BaseJavaModule {

    private int mOpened = 0;
    private int mErrors = 0;

    @Override
    public String getName() {
      return "ShareRecordingModule";
    }

    @ReactMethod
    public void recordOpened() {
      mOpened++;
    }

    @ReactMethod
    public void recordError() {
      mErrors++;
    }

    public int getOpened() {
      return mOpened;
    }

    public int getErrors() {
      return mErrors;
    }
  }

  final ShareRecordingModule mRecordingModule = new ShareRecordingModule();

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return super.createReactInstanceSpecForTest().addNativeModule(mRecordingModule);
  }

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "ShareTestApp";
  }

  private ShareTestModule getTestModule() {
    return getReactContext().getCatalystInstance().getJSModule(ShareTestModule.class);
  }

  public void testShowBasicShareDialog() {
    final WritableMap content = new WritableNativeMap();
    content.putString("message", "Hello, ReactNative!");
    final WritableMap options = new WritableNativeMap();

    IntentFilter intentFilter = new IntentFilter(Intent.ACTION_CHOOSER);
    intentFilter.addCategory(Intent.CATEGORY_DEFAULT);
    ActivityMonitor monitor = getInstrumentation().addMonitor(intentFilter, null, true);

    getTestModule().showShareDialog(content, options);

    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    assertEquals(1, monitor.getHits());
    assertEquals(1, mRecordingModule.getOpened());
    assertEquals(0, mRecordingModule.getErrors());
  }
}
