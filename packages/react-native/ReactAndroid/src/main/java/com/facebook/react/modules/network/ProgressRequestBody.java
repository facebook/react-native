/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import java.io.FilterOutputStream;
import java.io.IOException;
import okhttp3.MediaType;
import okhttp3.RequestBody;
import okio.BufferedSink;
import okio.Okio;
import okio.Sink;

class ProgressRequestBody extends RequestBody {

  private final RequestBody mRequestBody;
  private final ProgressListener mProgressListener;
  private long mContentLength = 0L;

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
    if (mContentLength == 0) {
      mContentLength = mRequestBody.contentLength();
    }
    return mContentLength;
  }

  @Override
  public void writeTo(BufferedSink sink) throws IOException {
    // In 99% of cases, this method is called strictly once.
    // The only case when it is called more than once is internal okhttp upload re-try.
    // We need to re-create CountingOutputStream in this case as progress should be re-evaluated.
    BufferedSink sinkWrapper = Okio.buffer(outputStreamSink(sink));

    // contentLength changes for input streams, since we're using inputStream.available(),
    // so get the length before writing to the sink
    contentLength();

    mRequestBody.writeTo(sinkWrapper);
    sinkWrapper.flush();
  }

  private Sink outputStreamSink(BufferedSink sink) {
    return Okio.sink(
        new FilterOutputStream(sink.outputStream()) {
          private long mCount = 0;

          @Override
          public void write(byte[] data, int offset, int byteCount) throws IOException {
            super.write(data, offset, byteCount);
            mCount += byteCount;
            sendProgressUpdate();
          }

          @Override
          public void write(int data) throws IOException {
            super.write(data);
            mCount++;
            sendProgressUpdate();
          }

          private void sendProgressUpdate() throws IOException {
            long bytesWritten = mCount;
            long contentLength = contentLength();
            mProgressListener.onProgress(
                bytesWritten, contentLength, bytesWritten == contentLength);
          }
        });
  }
}
