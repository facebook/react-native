/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import android.util.JsonWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/** Helper for generating JSON for lists and maps. */
public class JsonWriterHelper {
  public static void value(JsonWriter writer, Object value) throws IOException {
    if (value instanceof Map) {
      mapValue(writer, (Map) value);
    } else if (value instanceof List) {
      listValue(writer, (List) value);
    } else if (value instanceof ReadableMap) {
      readableMapValue(writer, (ReadableMap) value);
    } else if (value instanceof ReadableArray) {
      readableArrayValue(writer, (ReadableArray) value);
    } else if (value instanceof Dynamic) {
      dynamicValue(writer, (Dynamic) value);
    } else {
      objectValue(writer, value);
    }
  }

  private static void dynamicValue(JsonWriter writer, Dynamic value) throws IOException {
    switch (value.getType()) {
      case Null:
        writer.nullValue();
        break;
      case Boolean:
        writer.value(value.asBoolean());
        break;
      case Number:
        writer.value(value.asDouble());
        break;
      case String:
        writer.value(value.asString());
        break;
      case Map:
        readableMapValue(writer, value.asMap());
        break;
      case Array:
        readableArrayValue(writer, value.asArray());
        break;
      default:
        throw new IllegalArgumentException("Unknown data type: " + value.getType());
    }
  }

  private static void readableMapValue(JsonWriter writer, ReadableMap value) throws IOException {
    writer.beginObject();
    try {
      ReadableMapKeySetIterator iterator = value.keySetIterator();
      while (iterator.hasNextKey()) {
        String key = iterator.nextKey();
        writer.name(key);
        switch (value.getType(key)) {
          case Null:
            writer.nullValue();
            break;
          case Boolean:
            writer.value(value.getBoolean(key));
            break;
          case Number:
            writer.value(value.getDouble(key));
            break;
          case String:
            writer.value(value.getString(key));
            break;
          case Map:
            readableMapValue(writer, value.getMap(key));
            break;
          case Array:
            readableArrayValue(writer, value.getArray(key));
            break;
          default:
            throw new IllegalArgumentException("Unknown data type: " + value.getType(key));
        }
      }
    } finally {
      writer.endObject();
    }
  }

  public static void readableArrayValue(JsonWriter writer, ReadableArray value) throws IOException {
    writer.beginArray();
    try {
      for (int key = 0; key < value.size(); ++key) {
        switch (value.getType(key)) {
          case Null:
            writer.nullValue();
            break;
          case Boolean:
            writer.value(value.getBoolean(key));
            break;
          case Number:
            writer.value(value.getDouble(key));
            break;
          case String:
            writer.value(value.getString(key));
            break;
          case Map:
            readableMapValue(writer, value.getMap(key));
            break;
          case Array:
            readableArrayValue(writer, value.getArray(key));
            break;
          default:
            throw new IllegalArgumentException("Unknown data type: " + value.getType(key));
        }
      }
    } finally {
      writer.endArray();
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
