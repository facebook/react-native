/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.testing;

import android.annotation.SuppressLint;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.annotation.Nullable;

/**
 * A spec that allows a test to add additional NativeModules/JS modules to the ReactInstance. This
 * can also be used to stub out existing native modules by adding another module with the same name
 * as a built-in module.
 */
@SuppressLint("JavatestsIncorrectFolder")
public class ReactInstanceSpecForTest {

  private final List<NativeModule> mNativeModules =
      new ArrayList<NativeModule>(Arrays.asList(new FakeWebSocketModule()));
  private final List<Class<? extends JavaScriptModule>> mJSModuleSpecs = new ArrayList<>();
  private final List<ViewManager> mViewManagers = new ArrayList<>();
  private final ArrayList<ReactPackage> mReactPackages = new ArrayList<>();
  @Nullable private FabricUIManagerFactory mFabricUIManagerFactory = null;
  @Nullable private JavaScriptExecutorFactory mJavaScriptExecutorFactory = null;

  public ReactInstanceSpecForTest addNativeModule(NativeModule module) {
    mNativeModules.add(module);
    return this;
  }

  public ReactInstanceSpecForTest setJavaScriptExecutorFactory(
      JavaScriptExecutorFactory javaScriptExecutorFactory) {
    mJavaScriptExecutorFactory = javaScriptExecutorFactory;
    return this;
  }

  public ReactInstanceSpecForTest setPackage(ReactPackage reactPackage) {
    if (!mReactPackages.isEmpty()) {
      throw new IllegalStateException(
          "setPackage is not allowed after addPackages. " + reactPackage);
    }
    mReactPackages.add(reactPackage);
    return this;
  }

  public ReactInstanceSpecForTest setFabricUIManagerFactory(@Nullable FabricUIManagerFactory fabricUIManagerFactory) {
    mFabricUIManagerFactory = fabricUIManagerFactory;
    return this;
  }

  @Nullable
  public FabricUIManagerFactory getFabricUIManagerFactory() {
    return mFabricUIManagerFactory;
  }

  public ReactInstanceSpecForTest addPackages(List<ReactPackage> reactPackages) {
    mReactPackages.addAll(reactPackages);
    return this;
  }

  public ReactInstanceSpecForTest addViewManager(ViewManager viewManager) {
    mViewManagers.add(viewManager);
    return this;
  }

  public List<NativeModule> getExtraNativeModulesForTest() {
    return mNativeModules;
  }

  public ReactPackage getAlternativeReactPackageForTest() {
    if (mReactPackages.size() > 1) {
      throw new IllegalStateException(
          "Multiple packages were added - use getAlternativeReactPackagesForTest instead.");
    }
    return mReactPackages.get(0);
  }

  @Nullable
  public JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
    return mJavaScriptExecutorFactory;
  }

  public List<ReactPackage> getAlternativeReactPackagesForTest() {
    return mReactPackages;
  }

  public List<ViewManager> getExtraViewManagers() {
    return mViewManagers;
  }
}
