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
import java.io.StringWriter;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;

/**
 * Class stores configuration of javascript modules that can be used across the bridge
 */
public class JavaScriptModulesConfig {

  private final List<JavaScriptModuleRegistration> mModules;

  private JavaScriptModulesConfig(List<JavaScriptModuleRegistration> modules) {
    mModules = modules;
  }

  /*package*/ List<JavaScriptModuleRegistration> getModuleDefinitions() {
    return mModules;
  }

  /*package*/ String moduleDescriptions() {
    JsonFactory jsonFactory = new JsonFactory();
    StringWriter writer = new StringWriter();
    try {
      JsonGenerator jg = jsonFactory.createGenerator(writer);
      jg.writeStartObject();
      for (JavaScriptModuleRegistration registration : mModules) {
        jg.writeObjectFieldStart(registration.getName());
        appendJSModuleToJSONObject(jg, registration);
        jg.writeEndObject();
      }
      jg.writeEndObject();
      jg.close();
    } catch (IOException ioe) {
      throw new RuntimeException("Unable to serialize JavaScript module declaration", ioe);
    }
    return writer.getBuffer().toString();
  }

  private void appendJSModuleToJSONObject(
      JsonGenerator jg,
      JavaScriptModuleRegistration registration) throws IOException {
    jg.writeObjectField("moduleID", registration.getModuleId());
    jg.writeObjectFieldStart("methods");
    for (Method method : registration.getMethods()) {
      jg.writeObjectFieldStart(method.getName());
      jg.writeObjectField("methodID", registration.getMethodId(method));
      jg.writeEndObject();
    }
    jg.writeEndObject();
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
