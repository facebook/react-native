package com.facebook.react.bridge;

/**
 * Holder class used to register {@link JSIModule} into JSI Bridge.
 */
public interface JSIModuleSpec<T extends JSIModule> {

  Class<? extends JSIModule> getJSIModuleClass();

  JSIModuleProvider<T> getJSIModuleProvider();

}
