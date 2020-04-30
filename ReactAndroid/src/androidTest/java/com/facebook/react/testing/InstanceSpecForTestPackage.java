/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.List;

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
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return mSpecForTest.getExtraViewManagers();
  }
}
