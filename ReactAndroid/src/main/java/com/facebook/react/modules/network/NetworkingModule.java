/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import javax.annotation.Nullable;

import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;

import java.util.concurrent.TimeUnit;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.stetho.okhttp.StethoInterceptor;

import com.squareup.okhttp.Callback;
import com.squareup.okhttp.Headers;
import com.squareup.okhttp.MediaType;
import com.squareup.okhttp.MultipartBuilder;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.RequestBody;
import com.squareup.okhttp.Response;
import com.squareup.okhttp.ResponseBody;

import static java.lang.Math.min;

/**
 * Implements the XMLHttpRequest JavaScript interface.
 */
public final class NetworkingModule extends ReactContextBaseJavaModule {

  private static final String CONTENT_ENCODING_HEADER_NAME = "content-encoding";
  private static final String CONTENT_TYPE_HEADER_NAME = "content-type";
  private static final String REQUEST_BODY_KEY_STRING = "string";
  private static final String REQUEST_BODY_KEY_URI = "uri";
  private static final String REQUEST_BODY_KEY_FORMDATA = "formData";
  private static final String USER_AGENT_HEADER_NAME = "user-agent";

  private static final int MIN_BUFFER_SIZE = 8 * 1024; // 8kb
  private static final int MAX_BUFFER_SIZE = 512 * 1024; // 512kb

  private static final int CHUNK_TIMEOUT_NS = 100 * 1000000; // 100ms

  private final OkHttpClient mClient;
  private final ForwardingCookieHandler mCookieHandler;
  private final @Nullable String mDefaultUserAgent;
  private boolean mShuttingDown;

  /* package */ NetworkingModule(
      ReactApplicationContext reactContext,
      @Nullable String defaultUserAgent,
      OkHttpClient client) {
    super(reactContext);
    mClient = client;
    mClient.networkInterceptors().add(new StethoInterceptor());
    mCookieHandler = new ForwardingCookieHandler(reactContext);
    mShuttingDown = false;
    mDefaultUserAgent = defaultUserAgent;
  }

  /**
   * @param context the ReactContext of the application
   */
  public NetworkingModule(final ReactApplicationContext context) {
    this(context, null, OkHttpClientProvider.getOkHttpClient());
  }

  /**
   * @param context the ReactContext of the application
   * @param defaultUserAgent the User-Agent header that will be set for all requests where the
   * caller does not provide one explicitly
   */
  public NetworkingModule(ReactApplicationContext context, String defaultUserAgent) {
    this(context, defaultUserAgent, OkHttpClientProvider.getOkHttpClient());
  }

  public NetworkingModule(ReactApplicationContext reactContext, OkHttpClient client) {
    this(reactContext, null, client);
  }

  @Override
  public void initialize() {
    mClient.setCookieHandler(mCookieHandler);
  }

  @Override
  public String getName() {
    return "RCTNetworking";
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mShuttingDown = true;
    mClient.cancel(null);

    mCookieHandler.destroy();
    mClient.setCookieHandler(null);
  }

  @ReactMethod
  /**
   * @param timeout value of 0 results in no timeout
   */
  public void sendRequest(
      final ExecutorToken executorToken,
      String method,
      String url,
      final int requestId,
      ReadableArray headers,
      ReadableMap data,
      final boolean useIncrementalUpdates,
      int timeout) {
    Request.Builder requestBuilder = new Request.Builder().url(url);

    if (requestId != 0) {
      requestBuilder.tag(requestId);
    }

    OkHttpClient client = mClient;
    // If the current timeout does not equal the passed in timeout, we need to clone the existing
    // client and set the timeout explicitly on the clone.  This is cheap as everything else is
    // shared under the hood.
    // See https://github.com/square/okhttp/wiki/Recipes#per-call-configuration for more information
    if (timeout != mClient.getConnectTimeout()) {
      client = mClient.clone();
      client.setReadTimeout(timeout, TimeUnit.MILLISECONDS);
    }

    Headers requestHeaders = extractHeaders(headers, data);
    if (requestHeaders == null) {
      onRequestError(executorToken, requestId, "Unrecognized headers format");
      return;
    }
    String contentType = requestHeaders.get(CONTENT_TYPE_HEADER_NAME);
    String contentEncoding = requestHeaders.get(CONTENT_ENCODING_HEADER_NAME);
    requestBuilder.headers(requestHeaders);

    if (data == null) {
      requestBuilder.method(method, RequestBodyUtil.getEmptyBody(method));
    } else if (data.hasKey(REQUEST_BODY_KEY_STRING)) {
      if (contentType == null) {
        onRequestError(
            executorToken,
            requestId,
            "Payload is set but no content-type header specified");
        return;
      }
      String body = data.getString(REQUEST_BODY_KEY_STRING);
      MediaType contentMediaType = MediaType.parse(contentType);
      if (RequestBodyUtil.isGzipEncoding(contentEncoding)) {
        RequestBody requestBody = RequestBodyUtil.createGzip(contentMediaType, body);
        if (requestBody == null) {
          onRequestError(executorToken, requestId, "Failed to gzip request body");
          return;
        }
        requestBuilder.method(method, requestBody);
      } else {
        requestBuilder.method(method, RequestBody.create(contentMediaType, body));
      }
    } else if (data.hasKey(REQUEST_BODY_KEY_URI)) {
      if (contentType == null) {
        onRequestError(
            executorToken,
            requestId,
            "Payload is set but no content-type header specified");
        return;
      }
      String uri = data.getString(REQUEST_BODY_KEY_URI);
      InputStream fileInputStream =
          RequestBodyUtil.getFileInputStream(getReactApplicationContext(), uri);
      if (fileInputStream == null) {
        onRequestError(executorToken, requestId, "Could not retrieve file for uri " + uri);
        return;
      }
      requestBuilder.method(
          method,
          RequestBodyUtil.create(MediaType.parse(contentType), fileInputStream));
    } else if (data.hasKey(REQUEST_BODY_KEY_FORMDATA)) {
      if (contentType == null) {
        contentType = "multipart/form-data";
      }
      ReadableArray parts = data.getArray(REQUEST_BODY_KEY_FORMDATA);
      MultipartBuilder multipartBuilder =
          constructMultipartBody(executorToken, parts, contentType, requestId);
      if (multipartBuilder == null) {
        return;
      }
      requestBuilder.method(method, multipartBuilder.build());
    } else {
      // Nothing in data payload, at least nothing we could understand anyway.
      requestBuilder.method(method, RequestBodyUtil.getEmptyBody(method));
    }

    client.newCall(requestBuilder.build()).enqueue(
        new Callback() {
          @Override
          public void onFailure(Request request, IOException e) {
            if (mShuttingDown) {
              return;
            }
            onRequestError(executorToken, requestId, e.getMessage());
          }

          @Override
          public void onResponse(Response response) throws IOException {
            if (mShuttingDown) {
              return;
            }

            // Before we touch the body send headers to JS
            onResponseReceived(executorToken, requestId, response);

            ResponseBody responseBody = response.body();
            try {
              if (useIncrementalUpdates) {
                readWithProgress(executorToken, requestId, responseBody);
                onRequestSuccess(executorToken, requestId);
              } else {
                onDataReceived(executorToken, requestId, responseBody.string());
                onRequestSuccess(executorToken, requestId);
              }
            } catch (IOException e) {
              onRequestError(executorToken, requestId, e.getMessage());
            }
          }
        });
  }

  private void readWithProgress(
      ExecutorToken executorToken,
      int requestId,
      ResponseBody responseBody) throws IOException {
    Reader reader = responseBody.charStream();
    try {
      StringBuilder sb = new StringBuilder(getBufferSize(responseBody));
      char[] buffer = new char[MIN_BUFFER_SIZE];
      int read;
      long last = System.nanoTime();
      while ((read = reader.read(buffer)) != -1) {
        sb.append(buffer, 0, read);
        long now = System.nanoTime();
        if (shouldDispatch(now, last)) {
          onDataReceived(executorToken, requestId, sb.toString());
          sb.setLength(0);
          last = now;
        }
      }

      if (sb.length() > 0) {
        onDataReceived(executorToken, requestId, sb.toString());
      }
    } finally {
      reader.close();
    }
  }

  private static boolean shouldDispatch(long now, long last) {
    return last + CHUNK_TIMEOUT_NS < now;
  }

  private static int getBufferSize(ResponseBody responseBody) throws IOException {
    long length = responseBody.contentLength();
    if (length == -1) {
      return MIN_BUFFER_SIZE;
    } else {
      return (int) min(length, MAX_BUFFER_SIZE);
    }
  }

  private void onDataReceived(ExecutorToken ExecutorToken, int requestId, String data) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushString(data);

    getEventEmitter(ExecutorToken).emit("didReceiveNetworkData", args);
  }

  private void onRequestError(ExecutorToken ExecutorToken, int requestId, String error) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushString(error);

    getEventEmitter(ExecutorToken).emit("didCompleteNetworkResponse", args);
  }

  private void onRequestSuccess(ExecutorToken ExecutorToken, int requestId) {
    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushNull();

    getEventEmitter(ExecutorToken).emit("didCompleteNetworkResponse", args);
  }

  private void onResponseReceived(
      ExecutorToken ExecutorToken,
      int requestId,
      Response response) {
    WritableMap headers = translateHeaders(response.headers());

    WritableArray args = Arguments.createArray();
    args.pushInt(requestId);
    args.pushInt(response.code());
    args.pushMap(headers);
    args.pushString(response.request().urlString());

    getEventEmitter(ExecutorToken).emit("didReceiveNetworkResponse", args);
  }

  private static WritableMap translateHeaders(Headers headers) {
    WritableMap responseHeaders = Arguments.createMap();
    for (int i = 0; i < headers.size(); i++) {
      String headerName = headers.name(i);
      // multiple values for the same header
      if (responseHeaders.hasKey(headerName)) {
        responseHeaders.putString(
            headerName,
            responseHeaders.getString(headerName) + ", " + headers.value(i));
      } else {
        responseHeaders.putString(headerName, headers.value(i));
      }
    }
    return responseHeaders;
  }

  @ReactMethod
  public void abortRequest(ExecutorToken executorToken, final int requestId) {
    // We have to use AsyncTask since this might trigger a NetworkOnMainThreadException, this is an
    // open issue on OkHttp: https://github.com/square/okhttp/issues/869
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        mClient.cancel(requestId);
      }
    }.execute();
  }

  @ReactMethod
  public void clearCookies(
      ExecutorToken executorToken,
      com.facebook.react.bridge.Callback callback) {
    mCookieHandler.clearCookies(callback);
  }

  @Override
  public boolean supportsWebWorkers() {
    return true;
  }

  private
  @Nullable
  MultipartBuilder constructMultipartBody(
      ExecutorToken ExecutorToken,
      ReadableArray body,
      String contentType,
      int requestId) {
    MultipartBuilder multipartBuilder = new MultipartBuilder();
    multipartBuilder.type(MediaType.parse(contentType));

    for (int i = 0, size = body.size(); i < size; i++) {
      ReadableMap bodyPart = body.getMap(i);

      // Determine part's content type.
      ReadableArray headersArray = bodyPart.getArray("headers");
      Headers headers = extractHeaders(headersArray, null);
      if (headers == null) {
        onRequestError(
            ExecutorToken,
            requestId,
            "Missing or invalid header format for FormData part.");
        return null;
      }
      MediaType partContentType = null;
      String partContentTypeStr = headers.get(CONTENT_TYPE_HEADER_NAME);
      if (partContentTypeStr != null) {
        partContentType = MediaType.parse(partContentTypeStr);
        // Remove the content-type header because MultipartBuilder gets it explicitly as an
        // argument and doesn't expect it in the headers array.
        headers = headers.newBuilder().removeAll(CONTENT_TYPE_HEADER_NAME).build();
      }

      if (bodyPart.hasKey(REQUEST_BODY_KEY_STRING)) {
        String bodyValue = bodyPart.getString(REQUEST_BODY_KEY_STRING);
        multipartBuilder.addPart(headers, RequestBody.create(partContentType, bodyValue));
      } else if (bodyPart.hasKey(REQUEST_BODY_KEY_URI)) {
        if (partContentType == null) {
          onRequestError(
              ExecutorToken,
              requestId,
              "Binary FormData part needs a content-type header.");
          return null;
        }
        String fileContentUriStr = bodyPart.getString(REQUEST_BODY_KEY_URI);
        InputStream fileInputStream =
            RequestBodyUtil.getFileInputStream(getReactApplicationContext(), fileContentUriStr);
        if (fileInputStream == null) {
          onRequestError(
              ExecutorToken,
              requestId,
              "Could not retrieve file for uri " + fileContentUriStr);
          return null;
        }
        multipartBuilder.addPart(headers, RequestBodyUtil.create(partContentType, fileInputStream));
      } else {
        onRequestError(ExecutorToken, requestId, "Unrecognized FormData part.");
      }
    }
    return multipartBuilder;
  }

  /**
   * Extracts the headers from the Array. If the format is invalid, this method will return null.
   */
  private
  @Nullable
  Headers extractHeaders(
      @Nullable ReadableArray headersArray,
      @Nullable ReadableMap requestData) {
    if (headersArray == null) {
      return null;
    }
    Headers.Builder headersBuilder = new Headers.Builder();
    for (int headersIdx = 0, size = headersArray.size(); headersIdx < size; headersIdx++) {
      ReadableArray header = headersArray.getArray(headersIdx);
      if (header == null || header.size() != 2) {
        return null;
      }
      String headerName = header.getString(0);
      String headerValue = header.getString(1);
      headersBuilder.add(headerName, headerValue);
    }
    if (headersBuilder.get(USER_AGENT_HEADER_NAME) == null && mDefaultUserAgent != null) {
      headersBuilder.add(USER_AGENT_HEADER_NAME, mDefaultUserAgent);
    }

    // Sanitize content encoding header, supported only when request specify payload as string
    boolean isGzipSupported = requestData != null && requestData.hasKey(REQUEST_BODY_KEY_STRING);
    if (!isGzipSupported) {
      headersBuilder.removeAll(CONTENT_ENCODING_HEADER_NAME);
    }

    return headersBuilder.build();
  }

  private DeviceEventManagerModule.RCTDeviceEventEmitter getEventEmitter(ExecutorToken ExecutorToken) {
    return getReactApplicationContext()
        .getJSModule(ExecutorToken, DeviceEventManagerModule.RCTDeviceEventEmitter.class);
  }
}
