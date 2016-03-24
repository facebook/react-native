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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import static org.fest.assertions.api.Assertions.assertThat;

public class JavaScriptModuleConfigTest {

  private static interface SomeModule extends JavaScriptModule {
    public void stringMethod(String arg);
    public void intMethod(int arg);
  }

  private static interface OtherModule extends JavaScriptModule {
    public void method(String arg1, int arg2);
  }

  @Test
  public void testModuleWithMethods() throws Exception {
    JavaScriptModulesConfig jsModulesConfig = new JavaScriptModulesConfig.Builder()
        .add(SomeModule.class)
        .build();

    String json = getModuleDescriptions(jsModulesConfig);
    JsonNode node = parse(json);
    assertThat(node).hasSize(1);

    JsonNode module = node.fields().next().getValue();
    assertThat(module).isNotNull();

    JsonNode methods = module.get("methods");
    assertThat(methods)
        .isNotNull()
        .hasSize(2);

    JsonNode intMethodNode = methods.get("intMethod");
    assertThat(intMethodNode).isNotNull();
    assertThat(intMethodNode.get("methodID").asInt()).isEqualTo(0);

    JsonNode stringMethod = methods.get("stringMethod");
    assertThat(stringMethod).isNotNull();
    assertThat(stringMethod.get("methodID").asInt()).isEqualTo(1);
  }

  @Test
  public void testMultipleModules() throws Exception {
    JavaScriptModulesConfig jsModulesConfig = new JavaScriptModulesConfig.Builder()
        .add(OtherModule.class)
        .add(SomeModule.class)
        .build();

    String json = getModuleDescriptions(jsModulesConfig);
    JsonNode node = parse(json);
    assertThat(node).hasSize(2);

    JsonNode someModuleNode = node.get("SomeModule");
    assertThat(someModuleNode).isNotNull();
    int someModuleID = someModuleNode.get("moduleID").asInt();

    JsonNode otherModuleNode = node.get("OtherModule");
    assertThat(otherModuleNode).isNotNull();
    int otherModuleID = otherModuleNode.get("moduleID").asInt();
    assertThat(otherModuleID)
        .isNotEqualTo(someModuleID);
  }

  private static String getModuleDescriptions(JavaScriptModulesConfig jsModulesConfig)
      throws IOException {
    StringWriter stringWriter = new StringWriter();
    JsonWriter writer = new JsonWriter(stringWriter);
    jsModulesConfig.writeModuleDescriptions(writer);
    writer.close();
    return stringWriter.getBuffer().toString();
  }

  private JsonNode parse(String json) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    return mapper.readTree(json);
  }

}
