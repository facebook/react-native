package com.helloworld.newarchitecture;

import android.app.Application;
import androidx.annotation.NonNull;
import com.facebook.react.PackageList;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactPackageTurboModuleManagerDelegate;
import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JSIModuleProvider;
import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.fabric.CoreComponentsRegistry;
import com.facebook.react.fabric.EmptyReactNativeConfig;
import com.facebook.react.fabric.FabricJSIModuleProvider;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.helloworld.BuildConfig;
import com.helloworld.newarchitecture.components.MainComponentsRegistry;
import com.helloworld.newarchitecture.modules.MainApplicationTurboModuleManagerDelegate;
import java.util.ArrayList;
import java.util.List;

/**
 * A {@link ReactNativeHost} that helps you load everything needed for the New Architecture, both
 * TurboModule delegates and the Fabric Renderer.
 *
 * <p>Please note that this class is used ONLY if you opt-in for the New Architecture (see the
 * `newArchEnabled` property). Is ignored otherwise.
 */
public class MainApplicationReactNativeHost extends ReactNativeHost {
  public MainApplicationReactNativeHost(Application application) {
    super(application);
  }

  @Override
  public boolean getUseDeveloperSupport() {
    return BuildConfig.DEBUG;
  }

  @Override
  protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // Packages that cannot be autolinked yet can be added manually here, for example:
    //     packages.add(new MyReactNativePackage());
    // TurboModules must also be loaded here providing a valid TurboReactPackage implementation:
    //     packages.add(new TurboReactPackage() { ... });
    // If you have custom Fabric Components, their ViewManagers should also be loaded here
    // inside a ReactPackage.
    return packages;
  }

  @Override
  protected String getJSMainModuleName() {
    return "index";
  }

  @NonNull
  @Override
  protected ReactPackageTurboModuleManagerDelegate.Builder
      getReactPackageTurboModuleManagerDelegateBuilder() {
    // Here we provide the ReactPackageTurboModuleManagerDelegate Builder. This is necessary
    // for the new architecture and to use TurboModules correctly.
    return new MainApplicationTurboModuleManagerDelegate.Builder();
  }

  @Override
  protected JSIModulePackage getJSIModulePackage() {
    return new JSIModulePackage() {
      @Override
      public List<JSIModuleSpec> getJSIModules(
          final ReactApplicationContext reactApplicationContext,
          final JavaScriptContextHolder jsContext) {
        final List<JSIModuleSpec> specs = new ArrayList<>();

        // Here we provide a new JSIModuleSpec that will be responsible of providing the
        // custom Fabric Components.
        specs.add(
            new JSIModuleSpec() {
              @Override
              public JSIModuleType getJSIModuleType() {
                return JSIModuleType.UIManager;
              }

              @Override
              public JSIModuleProvider<UIManager> getJSIModuleProvider() {
                final ComponentFactory componentFactory = new ComponentFactory();
                CoreComponentsRegistry.register(componentFactory);

                // Here we register a Components Registry.
                // The one that is generated with the template contains no components
                // and just provides you the one from React Native core.
                MainComponentsRegistry.register(componentFactory);

                final ReactInstanceManager reactInstanceManager = getReactInstanceManager();

                ViewManagerRegistry viewManagerRegistry =
                    new ViewManagerRegistry(
                        reactInstanceManager.getOrCreateViewManagers(reactApplicationContext));

                return new FabricJSIModuleProvider(
                    reactApplicationContext,
                    componentFactory,
                    new EmptyReactNativeConfig(),
                    viewManagerRegistry);
              }
            });
        return specs;
      }
    };
  }
}
