/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Helper for generating JSON for lists and maps.
 */
class JsonWriterHelper {
  public static void value(JsonWriter writer, Object value) throws IOException {
    if (value instanceof Map) {
      mapValue(writer, (Map) value);
    } else if (value instanceof List) {
      listValue(writer, (List) value);
    } else {
      objectValue(writer, value);
    }
  }

  private static void mapValue(JsonWriter writer, Map<?, ?> map) throws IOException {
    writer.beginObject();
    for (Map.Entry entry : map.entrySet()) {
      writer.name(entry.getKey().toString());
      value(writer, entry.getValue());
    }
    writer.endObject();
  }

  private static void listValue(JsonWriter writer, List<?> list) throws IOException {
    writer.beginArray();
    for (Object item : list) {
      objectValue(writer, item);
    }
    writer.endArray();
  }

  private static void objectValue(JsonWriter writer, Object value) throws IOException {
    if (value == null) {
      writer.nullValue();
    } else if (value instanceof String) {
      writer.value((String) value);
    } else if (value instanceof Number) {
      writer.value((Number) value);
    } else if (value instanceof Boolean) {
      writer.value((Boolean) value);
    } else {
      throw new IllegalArgumentException("Unknown value: " + value);
    }
  }
}
