/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.SampleTurboModule;
import com.facebook.react.JSEngineResolutionAlgorithm;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactPackageTurboModuleManagerDelegate;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridgeless.BindingsInstaller;
import com.facebook.react.bridgeless.JSCInstance;
import com.facebook.react.bridgeless.JSEngineInstance;
import com.facebook.react.bridgeless.ReactHost;
import com.facebook.react.bridgeless.ReactHostDelegate;
import com.facebook.react.bridgeless.hermes.HermesInstance;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate;
import com.facebook.react.fabric.ReactNativeConfig;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.turbomodule.core.TurboModuleManager;
import com.facebook.react.uiapp.component.MyLegacyViewManager;
import com.facebook.react.uiapp.component.MyNativeViewManager;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@UnstableReactNativeAPI
public class RNTesterReactHostDelegate implements ReactHostDelegate {
  private final Context mContext;
  private @Nullable ReactHost mReactHost;
  private @Nullable List<ReactPackage> mReactPackages;

  RNTesterReactHostDelegate(Context context) {
    this.mContext = context;
  }

  public void setReactHost(ReactHost reactHost) {
    mReactHost = reactHost;
  }

  @Override
  public String getJsMainModulePath() {
    return "js/RNTesterApp.android";
  }

  @Override
  public JSBundleLoader getJSBundleLoader() {
    return JSBundleLoader.createAssetLoader(mContext, "assets://RNTesterApp.android.bundle", true);
  }

  @Override
  public synchronized BindingsInstaller getBindingsInstaller() {
    return null;
  }

  @NonNull
  @Override
  public ReactPackageTurboModuleManagerDelegate.Builder getTurboModuleManagerDelegateBuilder() {
    return new DefaultTurboModuleManagerDelegate.Builder();
  }

  @Override
  public JSEngineInstance getJsEngineInstance() {
    if (mReactHost.getJSEngineResolutionAlgorithm() == JSEngineResolutionAlgorithm.JSC) {
      return new JSCInstance();
    } else {
      return new HermesInstance();
    }
  }

  @Override
  public void handleInstanceException(Exception e) {}

  @Override
  public ReactNativeConfig getReactNativeConfig(TurboModuleManager turboModuleManager) {
    return ReactNativeConfig.DEFAULT_CONFIG;
  }

  @Override
  public List<ReactPackage> getReactPackages() {
    if (mReactPackages == null) {
      mReactPackages =
          Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new TurboReactPackage() {
                public NativeModule getModule(
                    final String name, final ReactApplicationContext reactContext) {
                  if (!ReactFeatureFlags.useTurboModules) {
                    return null;
                  }

                  if (SampleTurboModule.NAME.equals(name)) {
                    return new SampleTurboModule(reactContext);
                  }

                  return null;
                }

                // Note: Specialized annotation processor for @ReactModule isn't configured in OSS
                // yet. For now, hardcode this information, though it's not necessary for most
                // modules.
                public ReactModuleInfoProvider getReactModuleInfoProvider() {
                  return new ReactModuleInfoProvider() {
                    public Map<String, ReactModuleInfo> getReactModuleInfos() {
                      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
                      if (ReactFeatureFlags.useTurboModules) {
                        moduleInfos.put(
                            SampleTurboModule.NAME,
                            new ReactModuleInfo(
                                SampleTurboModule.NAME,
                                "SampleTurboModule",
                                false, // canOverrideExistingModule
                                false, // needsEagerInit
                                true, // hasConstants
                                false, // isCxxModule
                                true // isTurboModule
                                ));
                      }
                      return moduleInfos;
                    }
                  };
                }
              },
              new ReactPackage() {
                @NonNull
                @Override
                public List<NativeModule> createNativeModules(
                    @NonNull ReactApplicationContext reactContext) {
                  return Collections.emptyList();
                }

                @NonNull
                @Override
                public List<ViewManager> createViewManagers(
                    @NonNull ReactApplicationContext reactContext) {
                  List<ViewManager> viewManagers = new ArrayList<>();
                  viewManagers.add(new MyNativeViewManager());
                  viewManagers.add(new MyLegacyViewManager(reactContext));
                  return viewManagers;
                }
              });
    }
    return mReactPackages;
  }
}
