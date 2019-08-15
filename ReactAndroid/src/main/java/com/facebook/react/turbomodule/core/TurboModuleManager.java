/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JSIModule;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.turbomodule.core.interfaces.JSCallInvokerHolder;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.soloader.SoLoader;

/**
* This is the main class and entry point for TurboModules.
* Note that this is a hybrid class, and has a C++ counterpart
* This class installs the JSI bindings. It also implements the method to get a Java module, that the C++ counterpart calls.
*/
public class TurboModuleManager implements JSIModule {
  static {
    SoLoader.loadLibrary("turbomodulejsijni");
  }

  private final ReactApplicationContext mReactApplicationContext;
  private final TurboModuleManagerDelegate mTurbomoduleManagerDelegate;

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  public TurboModuleManager(
      ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext, TurboModuleManagerDelegate tmmDelegate, JSCallInvokerHolder instanceHolder) {
    mReactApplicationContext = reactApplicationContext;
    mHybridData = initHybrid(jsContext.get(), (JSCallInvokerHolderImpl) instanceHolder, tmmDelegate);
    mTurbomoduleManagerDelegate = tmmDelegate;
  }
  @DoNotStrip
  @SuppressWarnings("unused")
  private TurboModule getJavaModule(String name) {
    return mTurbomoduleManagerDelegate.getModule(name);
  }

  private native HybridData initHybrid(long jsContext, JSCallInvokerHolderImpl jsQueue, TurboModuleManagerDelegate tmmDelegate);

  private native void installJSIBindings();

  public void installBindings() {
    installJSIBindings();
  }

  @Override
  public void initialize() {}

  @Override
  public void onCatalystInstanceDestroy() {}

 /** All applications must implement this interface, and provide the Java TurboModule class */
  public interface ModuleProvider {
    TurboModule getModule(String name, ReactApplicationContext reactApplicationContext);
  }
}
