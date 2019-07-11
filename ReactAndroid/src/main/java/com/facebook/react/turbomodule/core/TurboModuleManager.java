/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.turbomodule.core;

import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JSIModule;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.turbomodule.core.interfaces.JSCallInvokerHolder;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.react.turbomodule.core.interfaces.TurboModuleRegistry;
import com.facebook.soloader.SoLoader;
import java.util.*;

/**
 * This is the main class and entry point for TurboModules. Note that this is a hybrid class, and
 * has a C++ counterpart This class installs the JSI bindings. It also implements the method to get
 * a Java module, that the C++ counterpart calls.
 */
public class TurboModuleManager implements JSIModule, TurboModuleRegistry {
  static {
    SoLoader.loadLibrary("turbomodulejsijni");
  }

  private final TurboModuleManagerDelegate mTurbomoduleManagerDelegate;

  private final Map<String, TurboModule> mTurboModules = new HashMap<>();

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  public TurboModuleManager(
      JavaScriptContextHolder jsContext,
      TurboModuleManagerDelegate tmmDelegate,
      JSCallInvokerHolder instanceHolder) {
    mHybridData =
        initHybrid(jsContext.get(), (JSCallInvokerHolderImpl) instanceHolder, tmmDelegate);
    mTurbomoduleManagerDelegate = tmmDelegate;
  }

  @DoNotStrip
  @Nullable
  protected TurboModule getJavaModule(String name) {
    if (!mTurboModules.containsKey(name)) {
      final TurboModule turboModule = mTurbomoduleManagerDelegate.getModule(name);

      if (turboModule != null) {
        /**
         * TurboModuleManager is initialized after ReactApplicationContext has been setup.
         * Therefore, it's safe to call initialize on the TurboModule.
         */
        ((NativeModule) turboModule).initialize();

        mTurboModules.put(name, turboModule);
      }
    }

    return mTurboModules.get(name);
  }

  @Nullable
  public TurboModule getModule(String name) {
    return getJavaModule(name);
  }

  public Collection<TurboModule> getModules() {
    return mTurboModules.values();
  }

  public boolean hasModule(String name) {
    return mTurboModules.containsKey(name);
  }

  private native HybridData initHybrid(
      long jsContext, JSCallInvokerHolderImpl jsQueue, TurboModuleManagerDelegate tmmDelegate);

  private native void installJSIBindings();

  public void installBindings() {
    installJSIBindings();
  }

  @Override
  public void initialize() {}

  @Override
  public void onCatalystInstanceDestroy() {}
}
