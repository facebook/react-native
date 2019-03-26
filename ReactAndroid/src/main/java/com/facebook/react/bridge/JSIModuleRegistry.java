package com.facebook.react.bridge;

import com.facebook.infer.annotation.Assertions;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class JSIModuleRegistry {

  private final Map<Class, JSIModuleHolder> mModules = new HashMap<>();

  public JSIModuleRegistry() { }

  public <T extends JSIModule> T getModule(Class<T> moduleClass) {
    JSIModuleHolder jsiModuleHolder = mModules.get(moduleClass);
    if (jsiModuleHolder == null) {
      throw new IllegalArgumentException("Unable to find JSIModule for class " + moduleClass);
    }
    return (T) Assertions.assertNotNull(jsiModuleHolder.getJSIModule());
  }

  public void registerModules(List<JSIModuleSpec> jsiModules) {
    for (JSIModuleSpec spec : jsiModules) {
      mModules.put(spec.getJSIModuleClass(), new JSIModuleHolder(spec));
    }
  }

  public void notifyJSInstanceDestroy() {
    for (JSIModuleHolder moduleHolder : mModules.values()) {
      moduleHolder.notifyJSInstanceDestroy();
    }
  }
}
