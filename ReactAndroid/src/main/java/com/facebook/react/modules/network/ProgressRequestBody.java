/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import java.io.IOException;
import okhttp3.MediaType;
import okhttp3.RequestBody;
import okio.BufferedSink;
import okio.Buffer;
import okio.Sink;
import okio.ForwardingSink;
import okio.Okio;

public class ProgressRequestBody extends RequestBody {

  private final RequestBody mRequestBody;
  private final ProgressListener mProgressListener;
  private BufferedSink mBufferedSink;

  public ProgressRequestBody(RequestBody requestBody, ProgressListener progressListener) {
      mRequestBody = requestBody;
      mProgressListener = progressListener;
  }

  @Override
  public MediaType contentType() {
      return mRequestBody.contentType();
  }

  @Override
  public long contentLength() throws IOException {
      return mRequestBody.contentLength();
  }

  @Override
  public void writeTo(BufferedSink sink) throws IOException {
      if (mBufferedSink == null) {
          mBufferedSink = Okio.buffer(sink(sink));
      }
      mRequestBody.writeTo(mBufferedSink);
      mBufferedSink.flush();
  }

  private Sink sink(Sink sink) {
      return new ForwardingSink(sink) {
          long bytesWritten = 0L;
          long contentLength = 0L;

          @Override
          public void write(Buffer source, long byteCount) throws IOException {
              super.write(source, byteCount);
              if (contentLength == 0) {
                  contentLength = contentLength();
              }
              bytesWritten += byteCount;
              mProgressListener.onProgress(
                bytesWritten, contentLength, bytesWritten == contentLength);
          }
      };
  }
}
