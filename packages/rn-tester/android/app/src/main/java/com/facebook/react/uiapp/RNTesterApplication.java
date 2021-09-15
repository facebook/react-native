/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp;

import static com.facebook.react.uiapp.BuildConfig.ENABLE_FABRIC;

import android.app.Application;
import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.react.BuildConfig;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JSIModuleProvider;
import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.fabric.CoreComponentsRegistry;
import com.facebook.react.fabric.FabricJSIModuleProvider;
import com.facebook.react.fabric.ReactNativeConfig;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.views.text.ReactFontManager;
import com.facebook.soloader.SoLoader;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class RNTesterApplication extends Application implements ReactApplication {

  static final boolean IS_FABRIC_ENABLED = ENABLE_FABRIC;

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public String getJSMainModuleName() {
          return "packages/rn-tester/js/RNTesterApp.android";
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
          return Arrays.<ReactPackage>asList(new MainReactPackage());
        }

        @Nullable
        @Override
        protected JSIModulePackage getJSIModulePackage() {
          if (!IS_FABRIC_ENABLED) {
            return null;
          }

          return new JSIModulePackage() {
            @Override
            public List<JSIModuleSpec> getJSIModules(
                final ReactApplicationContext reactApplicationContext,
                final JavaScriptContextHolder jsContext) {
              List<JSIModuleSpec> specs = new ArrayList<>();
              specs.add(
                  new JSIModuleSpec() {
                    @Override
                    public JSIModuleType getJSIModuleType() {
                      return JSIModuleType.UIManager;
                    }

                    @Override
                    public JSIModuleProvider<UIManager> getJSIModuleProvider() {
                      ComponentFactory ComponentFactory = new ComponentFactory();
                      CoreComponentsRegistry.register(ComponentFactory);
                      return new FabricJSIModuleProvider(
                          reactApplicationContext,
                          ComponentFactory,
                          // TODO: T71362667 add ReactNativeConfig's support in RNTester
                          new ReactNativeConfig() {
                            @Override
                            public boolean getBool(String s) {
                              return true;
                            }

                            @Override
                            public int getInt64(String s) {
                              return 0;
                            }

                            @Override
                            public String getString(String s) {
                              return "";
                            }

                            @Override
                            public double getDouble(String s) {
                              return 0;
                            }
                          });
                    }
                  });

              return specs;
            }
          };
        }
      };

  @Override
  public void onCreate() {
    ReactFontManager.getInstance().addCustomFont(this, "Rubik", R.font.rubik);
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.facebook.react.uiapp.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
};
