package com.facebook.react;

import android.app.Service;
import android.content.Intent;
import android.os.Bundle;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.AppRegistry;

import java.util.List;

import javax.annotation.Nullable;

/**
 * Base Service for React Native applications.
 */
public abstract class ReactService extends Service
  implements ReactInstanceManager.ReactInstanceEventListener {


  private @Nullable
  ReactInstanceManager mReactInstanceManager;
  private @Nullable
  ReactContext mReactContext;

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    mReactInstanceManager = createReactInstanceManager();

    if(!mReactInstanceManager.hasStartedCreatingInitialContext()){
      mReactInstanceManager.createReactContextInBackground();
    }

    mReactInstanceManager.addReactInstanceEventListener(this);
    return super.onStartCommand(intent, flags, startId);
  }

  @Override
  public void onDestroy() {
    Assertions.assertNotNull(mReactInstanceManager).destroy();
    super.onDestroy();
  }

  /**
   * Returns the name of the bundle in assets. If this is null, and no file path is specified for
   * the bundle, the app will only work with {@code getUseDeveloperSupport} enabled and will
   * always try to load the JS bundle from the packager server.
   * e.g. "index.android.bundle"
   */
  protected @Nullable
  String getBundleAssetName() {
    return "index.android.bundle";
  };

  /**
   * Returns a custom path of the bundle file. This is used in cases the bundle should be loaded
   * from a custom path. By default it is loaded from Android assets, from a path specified
   * by {@link #getBundleAssetName}.
   * e.g. "file://sdcard/myapp_cache/index.android.bundle"
   */
  protected @Nullable String getJSBundleFile() {
    return null;
  }

  /**
   * Returns the name of the main module. Determines the URL used to fetch the JS bundle
   * from the packager server. It is only used when dev support is enabled.
   * This is the first file to be executed once the {@link ReactInstanceManager} is created.
   * e.g. "index.android"
   */
  protected String getJSMainModuleName() {
    return "index.android";
  }

  /**
   * Returns the launchOptions which will be passed to the {@link ReactInstanceManager}
   * when the application is started. By default, this will return null and an empty
   * object will be passed to your top level component as its initial props.
   * If your React Native application requires props set outside of JS, override
   * this method to return the Android.os.Bundle of your desired initial props.
   */
  protected @Nullable
  Bundle getLaunchOptions() {
    return null;
  }

  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   * e.g. "MoviesApp"
   */
  protected abstract String getMainComponentName();

  /**
   * Returns whether dev mode should be enabled. This enables e.g. the dev menu.
   */
  protected abstract boolean getUseDeveloperSupport();

  /**
   * Returns a list of {@link ReactPackage} used by the app.
   * You'll most likely want to return at least the {@code MainReactPackage}.
   * If your app uses additional views or modules besides the default ones,
   * you'll want to include more packages here.
   */
  protected abstract List<ReactPackage> getPackages();

  /**
   * A subclass may override this method if it needs to use a custom instance.
   */
  protected ReactInstanceManager createReactInstanceManager() {
    ReactInstanceManager.Builder builder = ReactInstanceManager.builder()
      .setApplication(getApplication())
      .setJSMainModuleName(getJSMainModuleName())
      .setUseDeveloperSupport(getUseDeveloperSupport())
      .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

    for (ReactPackage reactPackage : getPackages()) {
      builder.addPackage(reactPackage);
    }

    String jsBundleFile = getJSBundleFile();

    if (jsBundleFile != null) {
      builder.setJSBundleFile(jsBundleFile);
    } else {
      builder.setBundleAssetName(getBundleAssetName());
    }

    return builder.build();
  }

  @Override
  public void onReactContextInitialized(ReactContext context) {
    mReactContext = context;
    WritableNativeMap appParams = new WritableNativeMap();
    @Nullable Bundle launchOptions = getLaunchOptions();
    WritableMap initialProps = launchOptions != null
      ? Arguments.fromBundle(launchOptions)
      : Arguments.createMap();
    appParams.putMap("initialProps", initialProps);
    context.getJSModule(AppRegistry.class).runApplication(getMainComponentName(), appParams);
  }

  /**
   * Shortcut for emitting events to Javascript using the DeviceEventEmitter pattern
   * @param eventName the name of the event
   * @param data any data to include with the event
   */
  public void emit(String eventName, @Nullable Object data){
    Assertions.assertNotNull(mReactContext)
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, data);
  }
}
