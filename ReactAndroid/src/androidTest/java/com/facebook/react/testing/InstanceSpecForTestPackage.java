/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import java.util.List;

import android.view.View;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.ReactPackage;

/**
 * This class wraps {@class ReactInstanceSpecForTest} in {@class ReactPackage} interface.
 * TODO(6788898): Refactor test code to use ReactPackage instead of SpecForTest
 */
public class InstanceSpecForTestPackage implements ReactPackage {

  private final ReactInstanceSpecForTest mSpecForTest;

  public InstanceSpecForTestPackage(ReactInstanceSpecForTest specForTest) {
    mSpecForTest = specForTest;
  }

  @Override
  public List<NativeModule> createNativeModules(
      ReactApplicationContext catalystApplicationContext) {
    return mSpecForTest.getExtraNativeModulesForTest();
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return mSpecForTest.getExtraJSModulesForTest();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return mSpecForTest.getExtraViewManagers();
  }
}
