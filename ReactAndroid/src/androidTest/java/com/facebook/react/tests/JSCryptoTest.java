/**
 * Copyright (c) 2018-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.appstate.AppStateModule;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.testing.FakeWebSocketModule;
import com.facebook.react.testing.ReactIntegrationTestCase;
import com.facebook.react.testing.ReactTestHelper;
import com.facebook.react.testing.StringRecordingModule;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.view.ReactViewManager;
import java.util.Arrays;
import java.util.List;

/**
 * Test crypto-based functionality of JS VM
 */
public class JSCryptoTest extends ReactIntegrationTestCase {

  private interface TestJSCryptoModule extends JavaScriptModule {
    void getRandomValues();
  }

  StringRecordingModule mStringRecordingModule;

  private CatalystInstance mInstance;

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(
        new ReactViewManager());
    final UIManagerModule mUIManager = new UIManagerModule(
        getContext(),
        viewManagers,
        0);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ReactChoreographer.initialize();
            mUIManager.onHostResume();
          }
        });
    waitForIdleSync();

    mStringRecordingModule = new StringRecordingModule();
    mInstance = ReactTestHelper.catalystInstanceBuilder(this)
        .addNativeModule(mStringRecordingModule)
        .addNativeModule(mUIManager)
        .addNativeModule(new DeviceInfoModule(getContext()))
        .addNativeModule(new AppStateModule(getContext()))
        .addNativeModule(new FakeWebSocketModule())
        .build();
  }

  public void testGetRandomValues() {
    TestJSCryptoModule testModule = mInstance.getJSModule(TestJSCryptoModule.class);
    waitForBridgeAndUIIdle();

    testModule.getRandomValues();
    waitForBridgeAndUIIdle();

    String[] answers = mStringRecordingModule.getCalls().toArray(new String[0]);
    assertEquals("true", answers[0]);
  }
}
