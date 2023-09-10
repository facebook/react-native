/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp;

import android.app.Application;
import androidx.annotation.NonNull;
import com.facebook.fbreact.specs.SampleLegacyModule;
import com.facebook.fbreact.specs.SampleTurboModule;
import com.facebook.react.JSEngineResolutionAlgorithm;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.common.assets.ReactFontManager;
import com.facebook.react.common.mapbuffer.ReadableMapBuffer;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.defaults.DefaultComponentsRegistry;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.flipper.ReactNativeFlipper;
import com.facebook.react.interfaces.ReactHost;
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.runtime.ReactHostImpl;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.uiapp.component.MyLegacyViewManager;
import com.facebook.react.uiapp.component.MyNativeViewManager;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.soloader.SoLoader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RNTesterApplication extends Application implements ReactApplication {

  private ReactHostImpl mReactHost;

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public String getJSMainModuleName() {
          return "js/RNTesterApp.android";
        }

        @Override
        public String getBundleAssetName() {
          return "RNTesterApp.android.bundle";
        }

        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        public List<ReactPackage> getPackages() {
          return Arrays.<ReactPackage>asList(
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

                  if (SampleLegacyModule.NAME.equals(name)) {
                    return new SampleLegacyModule(reactContext);
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

                        moduleInfos.put(
                            SampleLegacyModule.NAME,
                            new ReactModuleInfo(
                                SampleLegacyModule.NAME,
                                "SampleLegacyModule",
                                false, // canOverrideExistingModule
                                false, // needsEagerInit
                                true, // hasConstants
                                false, // isCxxModule
                                false // isTurboModule
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

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED_IN_FLAVOR;
        }
      };

  @Override
  public void onCreate() {
    ReactFontManager.getInstance().addCustomFont(this, "Rubik", R.font.rubik);
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load();
    }
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      // TODO: initialize Flipper for Bridgeless
    } else {
      ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }
  }

  @Override
  public ReactNativeHost getReactNativeHost() {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      throw new RuntimeException("Should not use ReactNativeHost when Bridgeless enabled");
    }
    return mReactNativeHost;
  }

  @Override
  @UnstableReactNativeAPI
  public ReactHost getReactHostInterface() {
    if (mReactHost == null) {
      // Create an instance of ReactHost to manager the instance of ReactInstance,
      // which is similar to how we use ReactNativeHost to manager instance of ReactInstanceManager
      RNTesterReactHostDelegate reactHostDelegate =
          new RNTesterReactHostDelegate(getApplicationContext());
      RNTesterReactJsExceptionHandler reactJsExceptionHandler =
          new RNTesterReactJsExceptionHandler();

      ComponentFactory componentFactory = new ComponentFactory();
      DefaultComponentsRegistry.register(componentFactory);
      mReactHost =
          new ReactHostImpl(
              this.getApplicationContext(),
              reactHostDelegate,
              componentFactory,
              true,
              reactJsExceptionHandler,
              true);
      if (BuildConfig.IS_HERMES_ENABLED_IN_FLAVOR) {
        mReactHost.setJSEngineResolutionAlgorithm(JSEngineResolutionAlgorithm.HERMES);
      } else {
        mReactHost.setJSEngineResolutionAlgorithm(JSEngineResolutionAlgorithm.JSC);
      }
      reactHostDelegate.setReactHost(mReactHost);
    }
    return mReactHost;
  }

  @UnstableReactNativeAPI
  public static class RNTesterReactJsExceptionHandler implements ReactJsExceptionHandler {
    public void reportJsException(ReadableMapBuffer errorMap) {}
  }
};
