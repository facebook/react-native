/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.DebugServerException;

import org.json.JSONException;
import org.json.JSONObject;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.Buffer;
import okio.BufferedSource;
import okio.Okio;
import okio.Sink;

public class BundleDownloader {
  public interface DownloadCallback {
    void onSuccess();
    void onProgress(@Nullable String status, @Nullable Integer done, @Nullable Integer total);
    void onFailure(Exception cause);
  }

  private final OkHttpClient mClient;

  private @Nullable Call mDownloadBundleFromURLCall;

  public BundleDownloader(OkHttpClient client) {
    mClient = client;
  }

  public void downloadBundleFromURL(
      final DownloadCallback callback,
      final File outputFile,
      final String bundleURL) {
    final Request request = new Request.Builder()
        .url(bundleURL)
        .addHeader("Accept", "multipart/mixed")
        .build();
    mDownloadBundleFromURLCall = Assertions.assertNotNull(mClient.newCall(request));
    mDownloadBundleFromURLCall.enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        // ignore callback if call was cancelled
        if (mDownloadBundleFromURLCall == null || mDownloadBundleFromURLCall.isCanceled()) {
          mDownloadBundleFromURLCall = null;
          return;
        }
        mDownloadBundleFromURLCall = null;

        callback.onFailure(DebugServerException.makeGeneric(
            "Could not connect to development server.",
            "URL: " + call.request().url().toString(),
            e));
      }

      @Override
      public void onResponse(Call call, final Response response) throws IOException {
        // ignore callback if call was cancelled
        if (mDownloadBundleFromURLCall == null || mDownloadBundleFromURLCall.isCanceled()) {
          mDownloadBundleFromURLCall = null;
          return;
        }
        mDownloadBundleFromURLCall = null;

        final String url = response.request().url().toString();

        // Make sure the result is a multipart response and parse the boundary.
        String contentType = response.header("content-type");
        Pattern regex = Pattern.compile("multipart/mixed;.*boundary=\"([^\"]+)\"");
        Matcher match = regex.matcher(contentType);
        if (match.find()) {
          String boundary = match.group(1);
          MultipartStreamReader bodyReader = new MultipartStreamReader(response.body().source(), boundary);
          boolean completed = bodyReader.readAllParts(new MultipartStreamReader.ChunkCallback() {
            @Override
            public void execute(Map<String, String> headers, Buffer body, boolean finished) throws IOException {
              // This will get executed for every chunk of the multipart response. The last chunk
              // (finished = true) will be the JS bundle, the other ones will be progress events
              // encoded as JSON.
              if (finished) {
                // The http status code for each separate chunk is in the X-Http-Status header.
                int status = response.code();
                if (headers.containsKey("X-Http-Status")) {
                  status = Integer.parseInt(headers.get("X-Http-Status"));
                }
                processBundleResult(url, status, body, outputFile, callback);
              } else {
                if (!headers.containsKey("Content-Type") || !headers.get("Content-Type").equals("application/json")) {
                  return;
                }
                try {
                  JSONObject progress = new JSONObject(body.readUtf8());
                  String status = null;
                  if (progress.has("status")) {
                    status = progress.getString("status");
                  }
                  Integer done = null;
                  if (progress.has("done")) {
                    done = progress.getInt("done");
                  }
                  Integer total = null;
                  if (progress.has("total")) {
                    total = progress.getInt("total");
                  }
                  callback.onProgress(status, done, total);
                } catch (JSONException e) {
                  FLog.e(ReactConstants.TAG, "Error parsing progress JSON. " + e.toString());
                }
              }
            }
          });
          if (!completed) {
            callback.onFailure(new DebugServerException(
                "Error while reading multipart response.\n\nResponse code: " + response.code() + "\n\n" +
                "URL: " + call.request().url().toString() + "\n\n"));
          }
        } else {
          // In case the server doesn't support multipart/mixed responses, fallback to normal download.
          processBundleResult(url, response.code(), Okio.buffer(response.body().source()), outputFile, callback);
        }
      }
    });
  }

  public void cancelDownloadBundleFromURL() {
    if (mDownloadBundleFromURLCall != null) {
      mDownloadBundleFromURLCall.cancel();
      mDownloadBundleFromURLCall = null;
    }
  }

  private void processBundleResult(
      String url,
      int statusCode,
      BufferedSource body,
      File outputFile,
      DownloadCallback callback) throws IOException {
    // Check for server errors. If the server error has the expected form, fail with more info.
    if (statusCode != 200) {
      String bodyString = body.readUtf8();
      DebugServerException debugServerException = DebugServerException.parse(bodyString);
      if (debugServerException != null) {
        callback.onFailure(debugServerException);
      } else {
        StringBuilder sb = new StringBuilder();
        sb.append("The development server returned response error code: ").append(statusCode).append("\n\n")
          .append("URL: ").append(url).append("\n\n")
          .append("Body:\n")
          .append(bodyString);
        callback.onFailure(new DebugServerException(sb.toString()));
      }
      return;
    }

    Sink output = null;
    try {
      output = Okio.sink(outputFile);
      body.readAll(output);
      callback.onSuccess();
    } finally {
      if (output != null) {
        output.close();
      }
    }
  }
}
