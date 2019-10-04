package com.facebook.yoga;

public abstract class YogaConfigFactory {
  public static YogaConfig create() {
    return new YogaConfigJNIFinalizer();
  }
}
