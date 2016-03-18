/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.io.Closeable;
import java.io.IOException;
import java.io.Writer;
import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Simple Json generator that does no validation.
 */
public class JsonWriter implements Closeable {
  private final Writer mWriter;
  private final Deque<Scope> mScopes;

  public JsonWriter(Writer writer) {
    mWriter = writer;
    mScopes = new ArrayDeque<>();
  }

  public JsonWriter beginArray() throws IOException {
    open(Scope.EMPTY_ARRAY, '[');
    return this;
  }

  public JsonWriter endArray() throws IOException {
    close(']');
    return this;
  }

  public JsonWriter beginObject() throws IOException {
    open(Scope.EMPTY_OBJECT, '{');
    return this;
  }

  public JsonWriter endObject() throws IOException {
    close('}');
    return this;
  }

  public JsonWriter name(String name) throws IOException {
    if (name == null) {
      throw new NullPointerException("name can not be null");
    }
    beforeName();
    string(name);
    mWriter.write(':');
    return this;
  }

  public JsonWriter value(String value) throws IOException {
    if (value == null) {
      return nullValue();
    }
    beforeValue();
    string(value);
    return this;
  }

  public JsonWriter nullValue() throws IOException {
    beforeValue();
    mWriter.write("null");
    return this;
  }

  public JsonWriter rawValue(String json) throws IOException {
    beforeValue();
    mWriter.write(json);
    return this;
  }

  public JsonWriter value(boolean value) throws IOException {
    beforeValue();
    mWriter.write(value ? "true" : "false");
    return this;
  }

  public JsonWriter value(double value) throws IOException {
    beforeValue();
    mWriter.append(Double.toString(value));
    return this;
  }

  public JsonWriter value(long value) throws IOException {
    beforeValue();
    mWriter.write(Long.toString(value));
    return this;
  }

  public JsonWriter value(Number value) throws IOException {
    if (value == null) {
      return nullValue();
    }
    beforeValue();
    mWriter.append(value.toString());
    return this;
  }

  @Override
  public void close() throws IOException {
    mWriter.close();
  }

  private void beforeValue() throws IOException {
    Scope scope = mScopes.peek();
    switch (scope) {
      case EMPTY_ARRAY:
        replace(Scope.ARRAY);
        break;
      case EMPTY_OBJECT:
        throw new IllegalArgumentException(Scope.EMPTY_OBJECT.name());
      case ARRAY:
        mWriter.write(',');
        break;
      case OBJECT:
        break;
      default:
        throw new IllegalStateException("Unknown scope: " + scope);
    }
  }

  private void beforeName() throws IOException {
    Scope scope = mScopes.peek();
    switch (scope) {
      case EMPTY_ARRAY:
      case ARRAY:
        throw new IllegalStateException("name not allowed in array");
      case EMPTY_OBJECT:
        replace(Scope.OBJECT);
        break;
      case OBJECT:
        mWriter.write(',');
        break;
      default:
        throw new IllegalStateException("Unknown scope: " + scope);
    }
  }

  private void open(Scope scope, char bracket) throws IOException {
    mScopes.push(scope);
    mWriter.write(bracket);
  }

  private void close(char bracket) throws IOException {
    mScopes.pop();
    mWriter.write(bracket);
  }

  private void string(String string) throws IOException {
    mWriter.write('"');
    for (int i = 0, length = string.length(); i < length; i++) {
      char c = string.charAt(i);
      switch (c) {
        case '\t':
          mWriter.write("\\t");
          break;

        case '\b':
          mWriter.write("\\b");
          break;

        case '\n':
          mWriter.write("\\n");
          break;

        case '\r':
          mWriter.write("\\r");
          break;

        case '\f':
          mWriter.write("\\f");
          break;

        case '"':
        case '\\':
          mWriter.write('\\');
          mWriter.write(c);
          break;

        case '\u2028':
        case '\u2029':
          mWriter.write(String.format("\\u%04x", (int) c));
          break;

        default:
          if (c <= 0x1F) {
            mWriter.write(String.format("\\u%04x", (int) c));
          } else {
            mWriter.write(c);
          }
          break;
      }

    }
    mWriter.write('"');
  }

  private void replace(Scope scope) {
    mScopes.pop();
    mScopes.push(scope);
  }

  private enum Scope {
    EMPTY_OBJECT,
    OBJECT,
    EMPTY_ARRAY,
    ARRAY
  }
}
