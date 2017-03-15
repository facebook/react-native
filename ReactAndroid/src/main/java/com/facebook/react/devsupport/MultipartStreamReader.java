/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import okio.Buffer;
import okio.BufferedSource;
import okio.ByteString;

/**
 * Utility class to parse the body of a response of type multipart/mixed.
 */
public class MultipartStreamReader {
  // Standard line separator for HTTP.
  private static final String CRLF = "\r\n";

  private final BufferedSource mSource;
  private final String mBoundary;

  public interface ChunkCallback {
    void execute(Map<String, String> headers, Buffer body, boolean done) throws IOException;
  }

  public MultipartStreamReader(BufferedSource source, String boundary) {
    mSource = source;
    mBoundary = boundary;
  }

  private Map<String, String> parseHeaders(Buffer data) {
    Map<String, String> headers = new HashMap<>();

    String text = data.readUtf8();
    String[] lines = text.split(CRLF);
    for (String line : lines) {
      int indexOfSeparator = line.indexOf(":");
      if (indexOfSeparator == -1) {
        continue;
      }

      String key = line.substring(0, indexOfSeparator).trim();
      String value = line.substring(indexOfSeparator + 1).trim();
      headers.put(key, value);
    }

    return headers;
  }

  private void emitChunk(Buffer chunk, boolean done, ChunkCallback callback) throws IOException {
    ByteString marker = ByteString.encodeUtf8(CRLF + CRLF);
    long indexOfMarker = chunk.indexOf(marker);
    if (indexOfMarker == -1) {
      callback.execute(null, chunk, done);
    } else {
      Buffer headers = new Buffer();
      Buffer body = new Buffer();
      chunk.read(headers, indexOfMarker);
      chunk.skip(marker.size());
      chunk.readAll(body);
      callback.execute(parseHeaders(headers), body, done);
    }
  }

  /**
   * Reads all parts of the multipart response and execute the callback for each chunk received.
   * @param callback Callback executed when a chunk is received
   * @return If the read was successful
   */
  public boolean readAllParts(ChunkCallback callback) throws IOException {
    ByteString delimiter = ByteString.encodeUtf8(CRLF + "--" + mBoundary + CRLF);
    ByteString closeDelimiter = ByteString.encodeUtf8(CRLF + "--" + mBoundary + "--" + CRLF);

    int bufferLen = 4 * 1024;
    long chunkStart = 0;
    long bytesSeen = 0;
    Buffer content = new Buffer();

    while (true) {
      boolean isCloseDelimiter = false;

      // Search only a subset of chunk that we haven't seen before + few bytes
      // to allow for the edge case when the delimiter is cut by read call.
      long searchStart = Math.max(bytesSeen - closeDelimiter.size(), chunkStart);
      long indexOfDelimiter = content.indexOf(delimiter, searchStart);
      if (indexOfDelimiter == -1) {
        isCloseDelimiter = true;
        indexOfDelimiter = content.indexOf(closeDelimiter, searchStart);
      }

      if (indexOfDelimiter == -1) {
        bytesSeen = content.size();
        long bytesRead = mSource.read(content, bufferLen);
        if (bytesRead <= 0) {
          return false;
        }
        continue;
      }

      long chunkEnd = indexOfDelimiter;
      long length = chunkEnd - chunkStart;

      // Ignore preamble
      if (chunkStart > 0) {
        Buffer chunk = new Buffer();
        content.skip(chunkStart);
        content.read(chunk, length);
        emitChunk(chunk, isCloseDelimiter, callback);
      } else {
        content.skip(chunkEnd);
      }

      if (isCloseDelimiter) {
        return true;
      }

      bytesSeen = chunkStart = delimiter.size();
    }
  }
}
