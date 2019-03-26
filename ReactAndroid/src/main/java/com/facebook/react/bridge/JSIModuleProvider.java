package com.facebook.react.bridge;

public interface JSIModuleProvider<T extends JSIModule> {

  T get();

}
