package com.facebook.react.bridge;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.facebook.infer.annotation.Assertions;

public class JSIModuleRegistry {

  private final Map<Class, JSIModule> mModules = new HashMap<>();

  public JSIModuleRegistry() { }

  public <T extends JSIModule> T getModule(Class<T> moduleClass) {
    return (T) Assertions.assertNotNull(mModules.get(moduleClass));
  }

  public void registerModules(List<JSIModuleHolder> jsiModules) {
    for (JSIModuleHolder holder : jsiModules) {
      mModules.put(holder.getJSIModuleClass(), holder.getJSIModule());
    }
  }
}
