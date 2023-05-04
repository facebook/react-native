/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless;

import android.content.Context;
import com.facebook.infer.annotation.ThreadSafe;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.fabric.ReactNativeConfig;
import com.facebook.react.turbomodule.core.TurboModuleManager;
import com.facebook.react.turbomodule.core.TurboModuleManagerDelegate;
import java.util.List;

@ThreadSafe
public interface ReactInstanceDelegate {
  String getJSMainModulePath();

  JSBundleLoader getJSBundleLoader(Context context);

  BindingsInstaller getBindingsInstaller();

  TurboModuleManagerDelegate getTurboModuleManagerDelegate(ReactApplicationContext context);

  JSEngineInstance getJSEngineInstance(ReactApplicationContext context);

  void handleInstanceException(Exception e);

  ReactNativeConfig getReactNativeConfig(TurboModuleManager turboModuleManager);

  List<ReactPackage> getReactPackages();
}
