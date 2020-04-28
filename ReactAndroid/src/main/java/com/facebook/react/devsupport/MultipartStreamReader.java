/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.devsupport;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import okio.Buffer;
import okio.BufferedSource;
import okio.ByteString;

/** Utility class to parse the body of a response of type multipart/mixed. */
public class MultipartStreamReader {
  // Standard line separator for HTTP.
  private static final String CRLF = "\r\n";

  private final BufferedSource mSource;
  private final String mBoundary;
  private long mLastProgressEvent;

  public interface ChunkListener {
    /** Invoked when a chunk of a multipart response is fully downloaded. */
    void onChunkComplete(Map<String, String> headers, Buffer body, boolean isLastChunk)
        throws IOException;

    /** Invoked as bytes of the current chunk are read. */
    void onChunkProgress(Map<String, String> headers, long loaded, long total) throws IOException;
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

  private void emitChunk(Buffer chunk, boolean done, ChunkListener listener) throws IOException {
    ByteString marker = ByteString.encodeUtf8(CRLF + CRLF);
    long indexOfMarker = chunk.indexOf(marker);
    if (indexOfMarker == -1) {
      listener.onChunkComplete(null, chunk, done);
    } else {
      Buffer headers = new Buffer();
      Buffer body = new Buffer();
      chunk.read(headers, indexOfMarker);
      chunk.skip(marker.size());
      chunk.readAll(body);
      listener.onChunkComplete(parseHeaders(headers), body, done);
    }
  }

  private void emitProgress(
      Map<String, String> headers, long contentLength, boolean isFinal, ChunkListener listener)
      throws IOException {
    if (headers == null || listener == null) {
      return;
    }

    long currentTime = System.currentTimeMillis();
    if (currentTime - mLastProgressEvent > 16 || isFinal) {
      mLastProgressEvent = currentTime;
      long headersContentLength =
          headers.get("Content-Length") != null ? Long.parseLong(headers.get("Content-Length")) : 0;
      listener.onChunkProgress(headers, contentLength, headersContentLength);
    }
  }

  /**
   * Reads all parts of the multipart response and execute the listener for each chunk received.
   *
   * @param listener Listener invoked when chunks are received.
   * @return If the read was successful
   */
  public boolean readAllParts(ChunkListener listener) throws IOException {
    ByteString delimiter = ByteString.encodeUtf8(CRLF + "--" + mBoundary + CRLF);
    ByteString closeDelimiter = ByteString.encodeUtf8(CRLF + "--" + mBoundary + "--" + CRLF);
    ByteString headersDelimiter = ByteString.encodeUtf8(CRLF + CRLF);

    int bufferLen = 4 * 1024;
    long chunkStart = 0;
    long bytesSeen = 0;
    Buffer content = new Buffer();
    Map<String, String> currentHeaders = null;
    long currentHeadersLength = 0;

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

        if (currentHeaders == null) {
          long indexOfHeaders = content.indexOf(headersDelimiter, searchStart);
          if (indexOfHeaders >= 0) {
            mSource.read(content, indexOfHeaders);
            Buffer headers = new Buffer();
            content.copyTo(headers, searchStart, indexOfHeaders - searchStart);
            currentHeadersLength = headers.size() + headersDelimiter.size();
            currentHeaders = parseHeaders(headers);
          }
        } else {
          emitProgress(currentHeaders, content.size() - currentHeadersLength, false, listener);
        }

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
        emitProgress(currentHeaders, chunk.size() - currentHeadersLength, true, listener);
        emitChunk(chunk, isCloseDelimiter, listener);
        currentHeaders = null;
        currentHeadersLength = 0;
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
