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
import com.squareup.okhttp.MediaType;
import com.squareup.okhttp.RequestBody;
import com.squareup.okhttp.internal.Util;
import okio.BufferedSink;
import okio.Buffer;
import okio.Sink;
import okio.ForwardingSink;
import okio.ByteString;
import okio.Okio;
import okio.Source;



public class ProgressRequestBody extends RequestBody {

  private final RequestBody requestBody;

  private final ProgressRequestListener progressListener;

  private BufferedSink bufferedSink;

  public ProgressRequestBody(RequestBody requestBody, ProgressRequestListener progressListener) {
      this.requestBody = requestBody;
      this.progressListener = progressListener;
  }

  @Override
  public MediaType contentType() {
      return requestBody.contentType();
  }

  @Override
  public long contentLength() throws IOException {
      return requestBody.contentLength();
  }

  @Override
  public void writeTo(BufferedSink sink) throws IOException {
      if (bufferedSink == null) {
          bufferedSink = Okio.buffer(sink(sink));
      }

      requestBody.writeTo(bufferedSink);

      bufferedSink.flush();

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
              progressListener.onRequestProgress(bytesWritten, contentLength, bytesWritten == contentLength);
          }
      };
  }
}
