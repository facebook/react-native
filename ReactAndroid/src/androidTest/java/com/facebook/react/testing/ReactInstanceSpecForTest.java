/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import java.util.ArrayList;
import java.util.List;

import android.annotation.SuppressLint;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.ReactPackage;

/**
 * A spec that allows a test to add additional NativeModules/JS modules to the ReactInstance. This
 * can also be used to stub out existing native modules by adding another module with the same name
 * as a built-in module.
 */
@SuppressLint("JavatestsIncorrectFolder")
public class ReactInstanceSpecForTest {

  private final List<NativeModule> mNativeModules = new ArrayList<>();
  private final List<Class<? extends JavaScriptModule>> mJSModuleSpecs = new ArrayList<>();
  private final List<ViewManager> mViewManagers = new ArrayList<>();
  private ReactPackage mReactPackage = null;

  public ReactInstanceSpecForTest addNativeModule(NativeModule module) {
    mNativeModules.add(module);
    return this;
  }

  public ReactInstanceSpecForTest addJSModule(Class jsClass) {
    mJSModuleSpecs.add(jsClass);
    return this;
  }

  public ReactInstanceSpecForTest setPackage(ReactPackage reactPackage) {
    mReactPackage = reactPackage;
    return this;
  }

  public ReactInstanceSpecForTest addViewManager(ViewManager viewManager) {
    mViewManagers.add(viewManager);
    return this;
  }

  public List<NativeModule> getExtraNativeModulesForTest() {
    return mNativeModules;
  }

  public List<Class<? extends JavaScriptModule>> getExtraJSModulesForTest() {
    return mJSModuleSpecs;
  }

  public ReactPackage getAlternativeReactPackageForTest() {
    return mReactPackage;
  }

  public List<ViewManager> getExtraViewManagers() {
    return mViewManagers;
  }
}
