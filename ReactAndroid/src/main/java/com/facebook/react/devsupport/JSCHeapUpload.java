/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import android.util.Log;
import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import com.facebook.react.packagerconnection.JSPackagerClient;

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
  public static JSCHeapCapture.CaptureCallback captureCallback(
      final String uploadUrl,
      @Nullable final JSPackagerClient.Responder responder) {
    return new JSCHeapCapture.CaptureCallback() {
      @Override
      public void onSuccess(File capture) {
        OkHttpClient.Builder httpClientBuilder = new OkHttpClient.Builder();
        httpClientBuilder.connectTimeout(1, TimeUnit.MINUTES)
          .writeTimeout(5, TimeUnit.MINUTES)
          .readTimeout(5, TimeUnit.MINUTES);
        OkHttpClient httpClient = httpClientBuilder.build();
        RequestBody body = RequestBody.create(MediaType.parse("application/json"), capture);
        Request request = new Request.Builder()
          .url(uploadUrl)
          .method("POST", body)
          .build();
        Call call = httpClient.newCall(request);
        call.enqueue(new Callback() {
          @Override
          public void onFailure(Call call, IOException e) {
            String message = "Upload of heap capture failed: " + e.toString();
            Log.e("JSCHeapCapture", message);
            responder.error(message);
          }

          @Override
          public void onResponse(Call call, Response response) throws IOException {
            if (!response.isSuccessful()) {
              String message = "Upload of heap capture failed with code " + Integer.toString(response.code()) + ": " + response.body().string();
              Log.e("JSCHeapCapture", message);
              responder.error(message);
            }
            responder.respond(response.body().string());
          }
        });
      }

      @Override
      public void onFailure(JSCHeapCapture.CaptureException e) {
        String message = "Heap capture failed: " + e.toString();
        Log.e("JSCHeapCapture", message);
        responder.error(message);
      }
    };
  }
}
