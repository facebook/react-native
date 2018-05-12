package com.facebook.react.bridge;

import com.facebook.infer.annotation.Assertions;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class JSIModuleRegistry {

  private final List<JSIModuleHolder> mModuleList = new ArrayList<>();
  private final Map<Class, JSIModule> mModules = new HashMap<>();
  private volatile boolean mIsInitialized = false;

  public JSIModuleRegistry() { }

  public <T extends JSIModule> T getModule(Class<T> moduleClass) {
    JSIModule jsiModule = mModules.get(moduleClass);
    if (jsiModule == null) {
      initModules();
    }
    return (T) Assertions.assertNotNull(mModules.get(moduleClass));
  }

  public void registerModules(List<JSIModuleHolder> jsiModules) {
    mModuleList.addAll(jsiModules);
  }

  public synchronized void initModules() {
    if (!mIsInitialized) {
      for (JSIModuleHolder holder : mModuleList) {
        mModules.put(holder.getJSIModuleClass(), holder.getJSIModule());
      }
      mIsInitialized = true;
    }
  }
}
