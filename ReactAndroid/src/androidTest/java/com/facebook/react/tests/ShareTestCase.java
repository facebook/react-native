/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.ArrayList;
import java.util.List;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.support.v4.app.DialogFragment;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.share.ShareModule;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;

/**
 * Test case for {@link ShareModule}.
 */
public class ShareTestCase extends ReactAppInstrumentationTestCase {

  private static interface ShareTestModule extends JavaScriptModule {
    public void showShareDialog(WritableMap content, WritableMap options);
  }

  private static class ShareRecordingModule extends BaseJavaModule {

    private int mShared = 0;
    private int mDismissed = 0;
    private int mErrors = 0;

    @Override
    public String getName() {
      return "ShareRecordingModule";
    }

    @ReactMethod
    public void recordShared() {
      mShared++;
    }

    @ReactMethod
    public void recordDismissed() {
      mDismissed++;
    }

    @ReactMethod
    public void recordError() {
      mErrors++;
    }

    public int getShared() {
      return mShared;
    }

    public int getDismissed() {
      return mDismissed;
    }

    public int getErrors() {
      return mErrors;
    }

  }

  final ShareRecordingModule mRecordingModule = new ShareRecordingModule();

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return super.createReactInstanceSpecForTest()
        .addNativeModule(mRecordingModule)
        .addJSModule(ShareTestModule.class);
  }

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "ShareTestApp";
  }

  private ShareTestModule getTestModule() {
    return getReactContext().getCatalystInstance().getJSModule(ShareTestModule.class);
  }

  private DialogFragment showDialog(WritableMap content, WritableMap options) {
    getTestModule().showShareDialog(content, options);

    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    return (DialogFragment) getActivity().getSupportFragmentManager()
        .findFragmentByTag(ShareModule.FRAGMENT_TAG);
  }

  public void testShowBasicShareDialog() {
    final WritableMap content = new WritableNativeMap();
    content.putString("message", "Hello, ReactNative!");
    final WritableMap options = new WritableNativeMap();

    final DialogFragment fragment = showDialog(content, options);

    assertNotNull(fragment);
  }

  public void testShareCallback() throws Throwable {
    final WritableMap content = new WritableNativeMap();
    content.putString("message", "Hello, ReactNative!");
    final WritableMap options = new WritableNativeMap();

    final DialogFragment fragment = showDialog(content, options);

    /* Block launching activity for next test cases */
    IntentFilter intentFilter = new IntentFilter(Intent.ACTION_SEND);
    intentFilter.addCategory(Intent.CATEGORY_DEFAULT);
    intentFilter.addDataType("text/plain");
    getInstrumentation().addMonitor(intentFilter, null, true);

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ((AlertDialog) fragment.getDialog())
                .getListView().performItemClick(null, 0, 0);
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    assertEquals(0, mRecordingModule.getErrors());
    assertEquals(1, mRecordingModule.getShared());
    assertEquals(0, mRecordingModule.getDismissed());
  }

  public void testDismissCallback() throws Throwable {
    final WritableMap content = new WritableNativeMap();
    content.putString("message", "Hello, ReactNative!");
    final WritableMap options = new WritableNativeMap();

    final DialogFragment fragment = showDialog(content, options);

    assertEquals(0, mRecordingModule.getDismissed());

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            fragment.getDialog().dismiss();
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    assertEquals(0, mRecordingModule.getErrors());
    assertEquals(0, mRecordingModule.getShared());
    assertEquals(1, mRecordingModule.getDismissed());
  }

}
