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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.facebook.react.common.MapBuilder;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import org.junit.Test;
import org.junit.Rule;
import org.junit.runner.RunWith;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

import static org.fest.assertions.api.Assertions.assertThat;

/**
 * Tests for {@link NativeModuleRegistry}.
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class NativeModuleRegistryTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Test
  public void testModuleWithMethods() throws Exception {
    NativeModuleRegistry registry = new NativeModuleRegistry.Builder()
        .add(new MethodsModule())
        .build();

    String json = getModuleDescriptions(registry);
    JsonNode node = parse(json);

    JsonNode module = node.fields().next().getValue();
    assertThat(module).isNotNull();

    JsonNode methods = module.get("methods");
    assertThat(methods).isNotNull();

    ArrayList<String> expected = new ArrayList<String>();
    expected.add("doSomething");
    expected.add("saveData");

    assertMethodsContainExactly(methods, expected);
  }

  @Test
  public void testAsyncMethod() throws Exception {
    NativeModuleRegistry registry = new NativeModuleRegistry.Builder()
        .add(new MethodsModule())
        .build();

    String json = getModuleDescriptions(registry);
    JsonNode node = parse(json);

    JsonNode asyncMethodData = node.get("TestModule").get("methods").get("saveData");
    assertThat(asyncMethodData.get("type")).isEqualTo(new TextNode("remoteAsync"));

    JsonNode regularMethodData = node.get("TestModule").get("methods").get("doSomething");
    assertThat(regularMethodData.get("type")).isNotEqualTo(new TextNode("remoteAsync"));
  }

  @Test
  public void testModuleWithConstants() throws Exception {
    ConstantsModule constantsModule = new ConstantsModule();
    NativeModuleRegistry registry = new NativeModuleRegistry.Builder()
        .add(constantsModule)
        .build();

    String json = getModuleDescriptions(registry);
    JsonNode node = parse(json);

    JsonNode module = node.fields().next().getValue();
    assertThat(module).isNotNull();

    JsonNode methods = module.get("methods");
    assertThat(methods).isNotNull();

    ArrayList<String> expected = new ArrayList<String>();
    expected.add("runDMC");

    assertMethodsContainExactly(methods, expected);

    JsonNode constants = module.get("constants");
    assertThat(constants.get("testInt").asInt()).isEqualTo(3);
    assertThat(constants.get("testDouble").asDouble()).isEqualTo(3.14);
    assertThat(constants.get("testString").asText()).isEqualTo("red panda");

    JsonNode stringMap = constants.get("testStringMap");
    assertThat(stringMap.get("war_room").asText()).isEqualTo("17.1");
    assertThat(stringMap.get("android_corex").asText()).isEqualTo("16.1");

    JsonNode intMap = constants.get("testIntMap");
    assertThat(intMap.get("42").asInt()).isEqualTo(1);
    assertThat(intMap.get("84").asInt()).isEqualTo(2);

    JsonNode stringList = constants.get("testStringList");
    assertThat(stringList.get(0).asText()).isEqualTo("vulpes vulpes");
    assertThat(stringList.get(4).asText()).isEqualTo("vulpes velox");

    JsonNode intList = constants.get("testIntList");
    assertThat(intList.get(0).asInt()).isEqualTo(3);
    assertThat(intList.get(4).asInt()).isEqualTo(5);
  }

  @Test
  public void testModuleWithOnlyConstants() throws Exception {
    OnlyConstantsModule onlyConstantsModule = new OnlyConstantsModule();
    NativeModuleRegistry registry = new NativeModuleRegistry.Builder()
        .add(onlyConstantsModule)
        .build();

    String json = getModuleDescriptions(registry);
    JsonNode node = parse(json);

    JsonNode module = node.fields().next().getValue();
    assertThat(module).isNotNull();

    JsonNode constants = module.get("constants");
    assertThat(constants.get("testInt").asInt()).isEqualTo(4);
  }

  @Test
  public void testModuleWithNestedMapConstants() throws Exception {
    NestedMapConstantsModule nestedMapConstantsModule = new NestedMapConstantsModule();
    NativeModuleRegistry registry = new NativeModuleRegistry.Builder()
        .add(nestedMapConstantsModule)
        .build();

    String json = getModuleDescriptions(registry);
    JsonNode node = parse(json);

    JsonNode module = node.fields().next().getValue();
    assertThat(module).isNotNull();

    JsonNode constants = module.get("constants");
    assertThat(constants).isNotNull();

    JsonNode nestedMapConstant = constants.get("nestedMap");
    assertThat(nestedMapConstant).isNotNull();

    JsonNode firstLevel = nestedMapConstant.get("weNeedToGoDeeper");
    assertThat(firstLevel).isNotNull();

    JsonNode secondLevel = firstLevel.get("evenDeeper");
    assertThat(secondLevel).isNotNull();

    assertThat(secondLevel.get("inception").asBoolean()).isTrue();
  }

  private JsonNode parse(String json) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    return mapper.readTree(json);
  }

  private void assertMethodsContainExactly(JsonNode methodsObject, List<String> methodNames) {
    ArrayList<String> actual = new ArrayList();
    Iterator<Map.Entry<String,JsonNode>> fields = methodsObject.fields();
    while (fields.hasNext()) {
      String name = fields.next().getKey();
      actual.add(name);
    }
    assertThat(actual)
        .hasSize(methodNames.size())
        .containsAll(methodNames);
  }

  private static String getModuleDescriptions(NativeModuleRegistry registry)
      throws IOException {
    JsonFactory jsonFactory = new JsonFactory();
    StringWriter writer = new StringWriter();
    JsonGenerator jg = jsonFactory.createGenerator(writer);
    registry.writeModuleDescriptions(jg);
    jg.close();
    return writer.getBuffer().toString();
  }

  private static class MethodsModule extends BaseJavaModule {

    @Override
    public String getName() {
      return "TestModule";
    }

    public void notACatalystMethod() {
    }

    @ReactMethod
    public void doSomething() {
    }

    @ReactMethod
    public void saveData(Promise promise) {
    }
  }

  private static class ConstantsModule extends BaseJavaModule {

    @Override
    public String getName() {
      return "ConstantsModule";
    }

    @Override
    public Map<String, Object> getConstants() {
      HashMap<String, Object> constants = new HashMap<String, Object>();
      constants.put("testInt", 3);
      constants.put("testDouble", 3.14);
      constants.put("testString", "red panda");
      constants.put(
          "testStringMap",
          MapBuilder.of(
              "war_room",
              "17.1",
              "android_corex",
              "16.1"));
      constants.put(
          "testIntMap",
          MapBuilder.of(
              42,
              1,
              84,
              2));
      constants.put(
          "testStringList",
          Arrays.asList(
              new String[]{
                  "vulpes vulpes",
                  "vulpes cana",
                  "vulpes chama",
                  "vulpes fulfa",
                  "vulpes velox"}));
      constants.put("testIntList", Arrays.asList(3, 1, 4, 1, 5));
      return constants;
    }

    @ReactMethod
    public void runDMC() {
    }
  }

  private static class OnlyConstantsModule extends BaseJavaModule {

    @Override
    public String getName() {
      return "OnlyConstantsModule";
    }

    @Override
    public Map<String, Object> getConstants() {
      return MapBuilder.<String, Object>of("testInt", 4);
    }
  }

  private static class NestedMapConstantsModule extends BaseJavaModule {

    @Override
    public String getName() {
      return "NestedMapConstantsModule";
    }

    @Override
    public Map<String, Object> getConstants() {
      return MapBuilder.<String, Object>of(
          "nestedMap",
          MapBuilder.of(
              "weNeedToGoDeeper",
              MapBuilder.of(
                  "evenDeeper",
                  MapBuilder.of("inception", true))));
    }
  }

}
