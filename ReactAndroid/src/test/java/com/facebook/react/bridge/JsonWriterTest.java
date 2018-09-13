/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import java.io.IOException;
import java.io.StringWriter;

import org.junit.Test;

import static org.fest.assertions.api.Assertions.assertThat;

public class JsonWriterTest {
  private final StringWriter mStringWriter;
  private final JsonWriter mWriter;

  public JsonWriterTest() {
    mStringWriter = new StringWriter();
    mWriter = new JsonWriter(mStringWriter);
  }

  @Test
  public void emptyObject() throws IOException {
    mWriter.beginObject();
    mWriter.endObject();
    verify("{}");
  }

  @Test
  public void emptyNestedObject() throws IOException {
    mWriter.beginObject();
    mWriter.beginObject();
    mWriter.endObject();
    mWriter.endObject();
    verify("{{}}");
  }

  @Test
  public void emptyArray() throws IOException {
    mWriter.beginArray();
    mWriter.endArray();
    verify("[]");
  }

  @Test
  public void emptyNestedArray() throws IOException {
    mWriter.beginArray();
    mWriter.beginArray();
    mWriter.endArray();
    mWriter.endArray();
    verify("[[]]");
  }

  @Test
  public void smallObject() throws IOException {
    mWriter.beginObject();
    mWriter.name("hello").value(true);
    mWriter.name("hello_again").value("hi!");
    mWriter.endObject();
    verify("{\"hello\":true,\"hello_again\":\"hi!\"}");
  }

  @Test
  public void smallArray() throws IOException {
    mWriter.beginArray();
    mWriter.value(true);
    mWriter.value(1);
    mWriter.value(1.0);
    mWriter.value("hi!");
    mWriter.endArray();
    verify("[true,1,1.0,\"hi!\"]");
  }

  @Test
  public void string() throws IOException {
    mWriter.beginObject();
    mWriter.name("string").value("hello!");
    mWriter.endObject();
    verify("{\"string\":\"hello!\"}");
  }

  @Test
  public void complexString() throws IOException {
    mWriter.beginObject();
    mWriter.name("string").value("\t\uD83D\uDCA9");
    mWriter.endObject();
    verify("{\"string\":\"\\t\uD83D\uDCA9\"}");
  }

  private void verify(String expected) throws IOException {
    mWriter.close();
    assertThat(mStringWriter.getBuffer().toString()).isEqualTo(expected);
  }
}
