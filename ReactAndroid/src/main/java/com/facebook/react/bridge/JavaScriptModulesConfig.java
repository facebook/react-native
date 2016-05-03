/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

/**
 * Class stores configuration of javascript modules that can be used across the bridge
 */
public class JavaScriptModulesConfig {

  private final List<JavaScriptModuleRegistration> mModules;

  public JavaScriptModulesConfig(List<JavaScriptModuleRegistration> modules) {
    mModules = modules;
  }

  public List<JavaScriptModuleRegistration> getModuleDefinitions() {
    return mModules;
  }

  public void writeModuleDescriptions(JsonWriter writer) throws IOException {
    writer.beginObject();
    for (JavaScriptModuleRegistration registration : mModules) {
      writer.name(registration.getName()).beginObject();
      appendJSModuleToJSONObject(writer, registration);
      writer.endObject();
    }
    writer.endObject();
  }

  private void appendJSModuleToJSONObject(
      JsonWriter writer,
      JavaScriptModuleRegistration registration) throws IOException {
    writer.name("moduleID").value(registration.getModuleId());
    writer.name("methods").beginObject();
    for (Method method : registration.getMethods()) {
      writer.name(method.getName()).beginObject();
      writer.name("methodID").value(registration.getMethodId(method));
      writer.endObject();
    }
    writer.endObject();
    if (registration.getModuleInterface().isAnnotationPresent(SupportsWebWorkers.class)) {
      writer.name("supportsWebWorkers").value(true);
    }
  }

  public static class Builder {

    private int mLastJSModuleId = 0;
    private List<JavaScriptModuleRegistration> mModules =
        new ArrayList<JavaScriptModuleRegistration>();

    public Builder add(Class<? extends JavaScriptModule> moduleInterfaceClass) {
      int moduleId = mLastJSModuleId++;
      mModules.add(new JavaScriptModuleRegistration(moduleId, moduleInterfaceClass));
      return this;
    }

    public JavaScriptModulesConfig build() {
      return new JavaScriptModulesConfig(mModules);
    }
  }
}
