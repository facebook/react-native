package com.helloworld.newarchitecture.modules;

import com.facebook.jni.HybridData;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactPackageTurboModuleManagerDelegate;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.soloader.SoLoader;
import java.util.List;

/**
 * Class responsible to load the TurboModules. This class has native methods and needs a
 * corresponding C++ implementation/header file to work correctly (already placed inside the jni/
 * folder for you).
 *
 * <p>Please note that this class is used ONLY if you opt-in for the New Architecture (see the
 * `newArchEnabled` property). Is ignored otherwise.
 */
public class MainApplicationTurboModuleManagerDelegate
    extends ReactPackageTurboModuleManagerDelegate {

  private static volatile boolean sIsSoLibraryLoaded;

  protected MainApplicationTurboModuleManagerDelegate(
      ReactApplicationContext reactApplicationContext, List<ReactPackage> packages) {
    super(reactApplicationContext, packages);
  }

  protected native HybridData initHybrid();

  native boolean canCreateTurboModule(String moduleName);

  public static class Builder extends ReactPackageTurboModuleManagerDelegate.Builder {
    protected MainApplicationTurboModuleManagerDelegate build(
        ReactApplicationContext context, List<ReactPackage> packages) {
      return new MainApplicationTurboModuleManagerDelegate(context, packages);
    }
  }

  @Override
  protected synchronized void maybeLoadOtherSoLibraries() {
    if (!sIsSoLibraryLoaded) {
      // If you change the name of your application .so file in the Android.mk file,
      // make sure you update the name here as well.
      SoLoader.loadLibrary("helloworld_appmodules");
      sIsSoLibraryLoaded = true;
    }
  }
}
