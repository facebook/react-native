package com.helloworld.newarchitecture.components;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.soloader.SoLoader;

/**
 * Class responsible to load the custom Fabric Components. This class has native methods and needs a
 * corresponding C++ implementation/header file to work correctly (already placed inside the jni/
 * folder for you).
 *
 * <p>Please note that this class is used ONLY if you opt-in for the New Architecture (see the
 * `newArchEnabled` property). Is ignored otherwise.
 */
@DoNotStrip
public class MainComponentsRegistry {
  static {
    SoLoader.loadLibrary("fabricjni");
  }

  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private native HybridData initHybrid(ComponentFactory componentFactory);

  @DoNotStrip
  private MainComponentsRegistry(ComponentFactory componentFactory) {
    mHybridData = initHybrid(componentFactory);
  }

  @DoNotStrip
  public static MainComponentsRegistry register(ComponentFactory componentFactory) {
    return new MainComponentsRegistry(componentFactory);
  }
}
