// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.modules.network;

import androidx.annotation.Nullable;
import java.io.IOException;
import okhttp3.MediaType;
import okhttp3.ResponseBody;
import okio.Buffer;
import okio.BufferedSource;
import okio.ForwardingSource;
import okio.Okio;
import okio.Source;

public class ProgressResponseBody extends ResponseBody {

  private final ResponseBody mResponseBody;
  private final ProgressListener mProgressListener;
  private @Nullable BufferedSource mBufferedSource;
  private long mTotalBytesRead;

  public ProgressResponseBody(ResponseBody responseBody, ProgressListener progressListener) {
    this.mResponseBody = responseBody;
    this.mProgressListener = progressListener;
    mTotalBytesRead = 0L;
  }

  @Override
  public MediaType contentType() {
    return mResponseBody.contentType();
  }

  @Override
  public long contentLength() {
    return mResponseBody.contentLength();
  }

  public long totalBytesRead() {
    return mTotalBytesRead;
  }

  @Override
  public BufferedSource source() {
    if (mBufferedSource == null) {
      mBufferedSource = Okio.buffer(source(mResponseBody.source()));
    }
    return mBufferedSource;
  }

  private Source source(Source source) {
    return new ForwardingSource(source) {
      @Override
      public long read(Buffer sink, long byteCount) throws IOException {
        long bytesRead = super.read(sink, byteCount);
        // read() returns the number of bytes read, or -1 if this source is exhausted.
        mTotalBytesRead += bytesRead != -1 ? bytesRead : 0;
        mProgressListener.onProgress(
            mTotalBytesRead, mResponseBody.contentLength(), bytesRead == -1);
        return bytesRead;
      }
    };
  }
}
