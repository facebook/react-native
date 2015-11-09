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
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.core.JsonGenerator;

/**
 * Helper for generating JSON for lists and maps.
 */
public class JsonGeneratorHelper {

  /**
   * Like {@link JsonGenerator#writeObjectField(String, Object)} but supports Maps and Lists.
   */
  public static void writeObjectField(JsonGenerator jg, String name, Object object)
      throws IOException {
    if (object instanceof Map) {
      writeMap(jg, name, (Map) object);
    } else if (object instanceof List) {
      writeList(jg, name, (List) object);
    } else {
      jg.writeObjectField(name, object);
    }
  }

  private static void writeMap(JsonGenerator jg, String name, Map map) throws IOException {
    jg.writeObjectFieldStart(name);
    Set<Map.Entry> entries = map.entrySet();
    for (Map.Entry entry : entries) {
      writeObjectField(jg, entry.getKey().toString(), entry.getValue());
    }
    jg.writeEndObject();
  }

  private static void writeList(JsonGenerator jg, String name, List list) throws IOException {
    jg.writeArrayFieldStart(name);
    for (Object item : list) {
      jg.writeObject(item);
    }
    jg.writeEndArray();
  }
}
