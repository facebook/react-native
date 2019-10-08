package com.facebook.yoga;

public abstract class YogaConfigFactory {
  public static YogaConfig create() {
    return new YogaConfigJNIFinalizer();
  }

  public static YogaConfig create(boolean useVanillaJNI) {
    return new YogaConfigJNIFinalizer(useVanillaJNI);
  }
}
