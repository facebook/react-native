/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.devsupport;

import static org.fest.assertions.api.Assertions.assertThat;

import java.io.IOException;
import java.util.Map;
import okio.Buffer;
import okio.ByteString;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class MultipartStreamReaderTest {

  class CallCountTrackingChunkCallback implements MultipartStreamReader.ChunkListener {
    private int mCount = 0;

    @Override
    public void onChunkComplete(Map<String, String> headers, Buffer body, boolean done)
        throws IOException {
      mCount++;
    }

    @Override
    public void onChunkProgress(Map<String, String> headers, long loaded, long total)
        throws IOException {}

    public int getCallCount() {
      return mCount;
    }
  }

  @Test
  public void testSimpleCase() throws IOException {
    ByteString response =
        ByteString.encodeUtf8(
            "preable, should be ignored\r\n"
                + "--sample_boundary\r\n"
                + "Content-Type: application/json; charset=utf-8\r\n"
                + "Content-Length: 2\r\n\r\n"
                + "{}\r\n"
                + "--sample_boundary--\r\n"
                + "epilogue, should be ignored");

    Buffer source = new Buffer();
    source.write(response);

    MultipartStreamReader reader = new MultipartStreamReader(source, "sample_boundary");

    CallCountTrackingChunkCallback callback =
        new CallCountTrackingChunkCallback() {
          @Override
          public void onChunkComplete(Map<String, String> headers, Buffer body, boolean done)
              throws IOException {
            super.onChunkComplete(headers, body, done);

            assertThat(done).isTrue();
            assertThat(headers.get("Content-Type")).isEqualTo("application/json; charset=utf-8");
            assertThat(body.readUtf8()).isEqualTo("{}");
          }
        };
    boolean success = reader.readAllParts(callback);

    assertThat(callback.getCallCount()).isEqualTo(1);
    assertThat(success).isTrue();
  }

  @Test
  public void testMultipleParts() throws IOException {
    ByteString response =
        ByteString.encodeUtf8(
            "preable, should be ignored\r\n"
                + "--sample_boundary\r\n"
                + "1\r\n"
                + "--sample_boundary\r\n"
                + "2\r\n"
                + "--sample_boundary\r\n"
                + "3\r\n"
                + "--sample_boundary--\r\n"
                + "epilogue, should be ignored");

    Buffer source = new Buffer();
    source.write(response);

    MultipartStreamReader reader = new MultipartStreamReader(source, "sample_boundary");

    CallCountTrackingChunkCallback callback =
        new CallCountTrackingChunkCallback() {
          @Override
          public void onChunkComplete(Map<String, String> headers, Buffer body, boolean done)
              throws IOException {
            super.onChunkComplete(headers, body, done);

            assertThat(done).isEqualTo(getCallCount() == 3);
            assertThat(body.readUtf8()).isEqualTo(String.valueOf(getCallCount()));
          }
        };
    boolean success = reader.readAllParts(callback);

    assertThat(callback.getCallCount()).isEqualTo(3);
    assertThat(success).isTrue();
  }

  @Test
  public void testNoDelimiter() throws IOException {
    ByteString response = ByteString.encodeUtf8("Yolo");

    Buffer source = new Buffer();
    source.write(response);

    MultipartStreamReader reader = new MultipartStreamReader(source, "sample_boundary");

    CallCountTrackingChunkCallback callback = new CallCountTrackingChunkCallback();
    boolean success = reader.readAllParts(callback);

    assertThat(callback.getCallCount()).isEqualTo(0);
    assertThat(success).isFalse();
  }

  @Test
  public void testNoCloseDelimiter() throws IOException {
    ByteString response =
        ByteString.encodeUtf8(
            "preable, should be ignored\r\n"
                + "--sample_boundary\r\n"
                + "Content-Type: application/json; charset=utf-8\r\n"
                + "Content-Length: 2\r\n\r\n"
                + "{}\r\n"
                + "--sample_boundary\r\n"
                + "incomplete message...");

    Buffer source = new Buffer();
    source.write(response);

    MultipartStreamReader reader = new MultipartStreamReader(source, "sample_boundary");

    CallCountTrackingChunkCallback callback = new CallCountTrackingChunkCallback();
    boolean success = reader.readAllParts(callback);

    assertThat(callback.getCallCount()).isEqualTo(1);
    assertThat(success).isFalse();
  }
}
