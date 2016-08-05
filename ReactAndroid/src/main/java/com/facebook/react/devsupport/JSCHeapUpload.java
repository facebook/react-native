/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import android.util.Log;
import java.io.File;
import java.io.IOException;
import java.util.List;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Created by cwdick on 7/22/16.
 */
public class JSCHeapUpload {
  public static JSCHeapCapture.CaptureCallback captureCallback(final String uploadUrl) {
    return new JSCHeapCapture.CaptureCallback() {
      @Override
      public void onComplete(
          List<File> captures,
          List<JSCHeapCapture.CaptureException> failures) {
        for (JSCHeapCapture.CaptureException e : failures) {
          Log.e("JSCHeapCapture", e.getMessage());
        }

        OkHttpClient  httpClient = new OkHttpClient.Builder().build();

        for (File path : captures) {
          RequestBody body = RequestBody.create(MediaType.parse("application/json"), path);
          Request request = new Request.Builder()
            .url(uploadUrl)
            .method("POST", body)
            .build();
          Call call = httpClient.newCall(request);
          call.enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
              Log.e("JSCHeapCapture", "Upload of heap capture failed: " + e.toString());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
              if (!response.isSuccessful()) {
                Log.e("JSCHeapCapture", "Upload of heap capture failed with code: " + Integer.toString(response.code()));
              }
            }
          });
        }
      }
    };
  }
}
