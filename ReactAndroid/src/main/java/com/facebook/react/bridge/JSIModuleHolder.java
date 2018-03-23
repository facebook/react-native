package com.facebook.react.bridge;

/**
 * Holder class used to register {@link JSIModule} into JSI Bridge.
 */
public interface JSIModuleHolder {

  Class<? extends JSIModule> getJSIModuleClass();

  <T extends JSIModule> T getJSIModule();

}
