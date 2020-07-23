/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.DebugServerException;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Headers;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.Buffer;
import okio.BufferedSource;
import okio.Okio;
import okio.Sink;
import org.json.JSONException;
import org.json.JSONObject;

public class BundleDownloader {
  private static final String TAG = "BundleDownloader";

  // Should be kept in sync with constants in RCTJavaScriptLoader.h
  private static final int FILES_CHANGED_COUNT_NOT_BUILT_BY_BUNDLER = -2;

  private final OkHttpClient mClient;

  private @Nullable Call mDownloadBundleFromURLCall;

  public static class BundleInfo {
    private @Nullable String mUrl;
    private int mFilesChangedCount;

    public static @Nullable BundleInfo fromJSONString(String jsonStr) {
      if (jsonStr == null) {
        return null;
      }

      BundleInfo info = new BundleInfo();

      try {
        JSONObject obj = new JSONObject(jsonStr);
        info.mUrl = obj.getString("url");
        info.mFilesChangedCount = obj.getInt("filesChangedCount");
      } catch (JSONException e) {
        FLog.e(TAG, "Invalid bundle info: ", e);
        return null;
      }

      return info;
    }

    public @Nullable String toJSONString() {
      JSONObject obj = new JSONObject();

      try {
        obj.put("url", mUrl);
        obj.put("filesChangedCount", mFilesChangedCount);
      } catch (JSONException e) {
        FLog.e(TAG, "Can't serialize bundle info: ", e);
        return null;
      }

      return obj.toString();
    }

    public String getUrl() {
      return mUrl != null ? mUrl : "unknown";
    }

    public int getFilesChangedCount() {
      return mFilesChangedCount;
    }
  }

  public BundleDownloader(OkHttpClient client) {
    mClient = client;
  }

  public void downloadBundleFromURL(
      final DevBundleDownloadListener callback,
      final File outputFile,
      final String bundleURL,
      final @Nullable BundleInfo bundleInfo) {
    downloadBundleFromURL(callback, outputFile, bundleURL, bundleInfo, new Request.Builder());
  }

  public void downloadBundleFromURL(
      final DevBundleDownloadListener callback,
      final File outputFile,
      final String bundleURL,
      final @Nullable BundleInfo bundleInfo,
      Request.Builder requestBuilder) {

    final Request request =
        requestBuilder.url(bundleURL).addHeader("Accept", "multipart/mixed").build();
    mDownloadBundleFromURLCall = Assertions.assertNotNull(mClient.newCall(request));
    mDownloadBundleFromURLCall.enqueue(
        new Callback() {
          @Override
          public void onFailure(Call call, IOException e) {
            // ignore callback if call was cancelled
            if (mDownloadBundleFromURLCall == null || mDownloadBundleFromURLCall.isCanceled()) {
              mDownloadBundleFromURLCall = null;
              return;
            }
            mDownloadBundleFromURLCall = null;

            String url = call.request().url().toString();

            callback.onFailure(
                DebugServerException.makeGeneric(
                    url, "Could not connect to development server.", "URL: " + url, e));
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
            try (Response r = response) {
              if (match.find()) {
                processMultipartResponse(url, r, match.group(1), outputFile, bundleInfo, callback);
              } else {
                // In case the server doesn't support multipart/mixed responses, fallback to normal
                // download.
                processBundleResult(
                    url,
                    r.code(),
                    r.headers(),
                    Okio.buffer(r.body().source()),
                    outputFile,
                    bundleInfo,
                    callback);
              }
            }
          }
        });
  }

  private void processMultipartResponse(
      final String url,
      final Response response,
      String boundary,
      final File outputFile,
      @Nullable final BundleInfo bundleInfo,
      final DevBundleDownloadListener callback)
      throws IOException {

    MultipartStreamReader bodyReader =
        new MultipartStreamReader(response.body().source(), boundary);
    boolean completed =
        bodyReader.readAllParts(
            new MultipartStreamReader.ChunkListener() {
              @Override
              public void onChunkComplete(
                  Map<String, String> headers, Buffer body, boolean isLastChunk)
                  throws IOException {
                // This will get executed for every chunk of the multipart response. The last chunk
                // (isLastChunk = true) will be the JS bundle, the other ones will be progress
                // events
                // encoded as JSON.
                if (isLastChunk) {
                  // The http status code for each separate chunk is in the X-Http-Status header.
                  int status = response.code();
                  if (headers.containsKey("X-Http-Status")) {
                    status = Integer.parseInt(headers.get("X-Http-Status"));
                  }
                  processBundleResult(
                      url, status, Headers.of(headers), body, outputFile, bundleInfo, callback);
                } else {
                  if (!headers.containsKey("Content-Type")
                      || !headers.get("Content-Type").equals("application/json")) {
                    return;
                  }

                  try {
                    JSONObject progress = new JSONObject(body.readUtf8());
                    String status =
                        progress.has("status") ? progress.getString("status") : "Bundling";
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

              @Override
              public void onChunkProgress(Map<String, String> headers, long loaded, long total) {
                if ("application/javascript".equals(headers.get("Content-Type"))) {
                  callback.onProgress("Downloading", (int) (loaded / 1024), (int) (total / 1024));
                }
              }
            });
    if (!completed) {
      callback.onFailure(
          new DebugServerException(
              "Error while reading multipart response.\n\nResponse code: "
                  + response.code()
                  + "\n\n"
                  + "URL: "
                  + url.toString()
                  + "\n\n"));
    }
  }

  private void processBundleResult(
      String url,
      int statusCode,
      Headers headers,
      BufferedSource body,
      File outputFile,
      BundleInfo bundleInfo,
      DevBundleDownloadListener callback)
      throws IOException {
    // Check for server errors. If the server error has the expected form, fail with more info.
    if (statusCode != 200) {
      String bodyString = body.readUtf8();
      DebugServerException debugServerException = DebugServerException.parse(url, bodyString);
      if (debugServerException != null) {
        callback.onFailure(debugServerException);
      } else {
        StringBuilder sb = new StringBuilder();
        sb.append("The development server returned response error code: ")
            .append(statusCode)
            .append("\n\n")
            .append("URL: ")
            .append(url)
            .append("\n\n")
            .append("Body:\n")
            .append(bodyString);
        callback.onFailure(new DebugServerException(sb.toString()));
      }
      return;
    }

    if (bundleInfo != null) {
      populateBundleInfo(url, headers, bundleInfo);
    }

    File tmpFile = new File(outputFile.getPath() + ".tmp");

    if (storePlainJSInFile(body, tmpFile)) {
      // If we have received a new bundle from the server, move it to its final destination.
      if (!tmpFile.renameTo(outputFile)) {
        throw new IOException("Couldn't rename " + tmpFile + " to " + outputFile);
      }
    }

    callback.onSuccess();
  }

  private static boolean storePlainJSInFile(BufferedSource body, File outputFile)
      throws IOException {
    Sink output = null;
    try {
      output = Okio.sink(outputFile);
      body.readAll(output);
    } finally {
      if (output != null) {
        output.close();
      }
    }

    return true;
  }

  private static void populateBundleInfo(String url, Headers headers, BundleInfo bundleInfo) {
    bundleInfo.mUrl = url;

    String filesChangedCountStr = headers.get("X-Metro-Files-Changed-Count");
    if (filesChangedCountStr != null) {
      try {
        bundleInfo.mFilesChangedCount = Integer.parseInt(filesChangedCountStr);
      } catch (NumberFormatException e) {
        bundleInfo.mFilesChangedCount = FILES_CHANGED_COUNT_NOT_BUILT_BY_BUNDLER;
      }
    }
  }
}
