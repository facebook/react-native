/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Headers;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

public class InspectorNetworkHelper {
  private static OkHttpClient client;

  private InspectorNetworkHelper() {}

  public static void loadNetworkResource(String url, InspectorNetworkRequestListener listener) {
    if (client == null) {
      client =
          new OkHttpClient.Builder()
              .connectTimeout(10, TimeUnit.SECONDS)
              .writeTimeout(10, TimeUnit.SECONDS)
              .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
              .build();
    }

    Request request;
    try {
      request = new Request.Builder().url(url).build();
    } catch (IllegalArgumentException e) {
      listener.onError("Not a valid URL: " + url);
      return;
    }

    // TODO(T196951523): Assign cancel function to listener
    Call call = client.newCall(request);

    call.enqueue(
        new Callback() {
          @Override
          public void onFailure(Call call, IOException e) {
            if (call.isCanceled()) {
              return;
            }

            listener.onError(e.getMessage());
          }

          @Override
          public void onResponse(Call call, Response response) {
            Headers headers = response.headers();
            HashMap<String, String> headersMap = new HashMap<>();

            for (String name : headers.names()) {
              headersMap.put(name, headers.get(name));
            }

            listener.onHeaders(response.code(), headersMap);

            try (ResponseBody responseBody = response.body()) {
              if (responseBody != null) {
                InputStream inputStream = responseBody.byteStream();
                int chunkSize = 1024;
                byte[] buffer = new byte[chunkSize];
                int bytesRead;

                try {
                  while ((bytesRead = inputStream.read(buffer)) != -1) {
                    String chunk = new String(buffer, 0, bytesRead);
                    listener.onData(chunk);
                  }
                } finally {
                  inputStream.close();
                }
              }

              listener.onCompletion();
            } catch (IOException e) {
              listener.onError(e.getMessage());
            }
          }
        });
  }
}
