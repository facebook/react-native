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
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.network.OkHttpCallUtil;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Headers;
import okhttp3.Interceptor;
import okhttp3.JavaNetCookieJar;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * Implements the XMLHttpRequest JavaScript interface.
 */
@ReactModule(name = "RCTNetworking", supportsWebWorkers = true)
public final class NetworkingModule extends ReactContextBaseJavaModule {

  private static final String CONTENT_ENCODING_HEADER_NAME = "content-encoding";
  private static final String CONTENT_TYPE_HEADER_NAME = "content-type";
  private static final String REQUEST_BODY_KEY_STRING = "string";
  private static final String REQUEST_BODY_KEY_URI = "uri";
  private static final String REQUEST_BODY_KEY_FORMDATA = "formData";
  private static final String USER_AGENT_HEADER_NAME = "user-agent";
  private static final int CHUNK_TIMEOUT_NS = 100 * 1000000; // 100ms
  private static final int MAX_CHUNK_SIZE_BETWEEN_FLUSHES = 8 * 1024; // 8K

  private final OkHttpClient mClient;
  private final ForwardingCookieHandler mCookieHandler;
  private final @Nullable String mDefaultUserAgent;
  private final CookieJarContainer mCookieJarContainer;
  private final Set<Integer> mRequestIds;
  private boolean mShuttingDown;

  /* package */ NetworkingModule(
      ReactApplicationContext reactContext,
      @Nullable String defaultUserAgent,
      OkHttpClient client,
      @Nullable List<NetworkInterceptorCreator> networkInterceptorCreators) {
    super(reactContext);

    if (networkInterceptorCreators != null) {
      OkHttpClient.Builder clientBuilder = client.newBuilder();
      for (NetworkInterceptorCreator networkInterceptorCreator : networkInterceptorCreators) {
        clientBuilder.addNetworkInterceptor(networkInterceptorCreator.create());
      }
      client = clientBuilder.build();
    }
    mClient = client;
    OkHttpClientProvider.replaceOkHttpClient(client);
    mCookieHandler = new ForwardingCookieHandler(reactContext);
    mCookieJarContainer = (CookieJarContainer) mClient.cookieJar();
    mShuttingDown = false;
    mDefaultUserAgent = defaultUserAgent;
    mRequestIds = new HashSet<>();
  }

  /**
   * @param context the ReactContext of the application
   * @param defaultUserAgent the User-Agent header that will be set for all requests where the
   * caller does not provide one explicitly
   * @param client the {@link OkHttpClient} to be used for networking
   */
  /* package */ NetworkingModule(
    ReactApplicationContext context,
    @Nullable String defaultUserAgent,
    OkHttpClient client) {
    this(context, defaultUserAgent, client, null);
  }

  /**
   * @param context the ReactContext of the application
   */
  public NetworkingModule(final ReactApplicationContext context) {
    this(context, null, OkHttpClientProvider.getOkHttpClient(), null);
  }

  /**
   * @param context the ReactContext of the application
   * @param networkInterceptorCreators list of {@link NetworkInterceptorCreator}'s whose create()
   * methods would be called to attach the interceptors to the client.
   */
  public NetworkingModule(
    ReactApplicationContext context,
    List<NetworkInterceptorCreator> networkInterceptorCreators) {
    this(context, null, OkHttpClientProvider.getOkHttpClient(), networkInterceptorCreators);
  }

  /**
   * @param context the ReactContext of the application
   * @param defaultUserAgent the User-Agent header that will be set for all requests where the
   * caller does not provide one explicitly
   */
  public NetworkingModule(ReactApplicationContext context, String defaultUserAgent) {
    this(context, defaultUserAgent, OkHttpClientProvider.getOkHttpClient(), null);
  }

  @Override
  public void initialize() {
    mCookieJarContainer.setCookieJar(new JavaNetCookieJar(mCookieHandler));
  }

  @Override
  public String getName() {
    return "RCTNetworking";
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mShuttingDown = true;
    cancelAllRequests();

    mCookieHandler.destroy();
    mCookieJarContainer.removeCookieJar();
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
      final String responseType,
      final boolean useIncrementalUpdates,
      int timeout) {
    Request.Builder requestBuilder = new Request.Builder().url(url);

    if (requestId != 0) {
      requestBuilder.tag(requestId);
    }

    final RCTDeviceEventEmitter eventEmitter = getEventEmitter(executorToken);
    OkHttpClient.Builder clientBuilder = mClient.newBuilder();

    // If JS is listening for progress updates, install a ProgressResponseBody that intercepts the
    // response and counts bytes received.
    if (useIncrementalUpdates) {
      clientBuilder.addNetworkInterceptor(new Interceptor() {
        @Override
        public Response intercept(Interceptor.Chain chain) throws IOException {
          Response originalResponse = chain.proceed(chain.request());
          ProgressResponseBody responseBody = new ProgressResponseBody(
            originalResponse.body(),
            new ProgressListener() {
              long last = System.nanoTime();

              @Override
              public void onProgress(long bytesWritten, long contentLength, boolean done) {
                long now = System.nanoTime();
                if (!done && !shouldDispatch(now, last)) {
                  return;
                }
                if (responseType.equals("text")) {
                  // For 'text' responses we continuously send response data with progress info to
                  // JS below, so no need to do anything here.
                  return;
                }
                ResponseUtil.onDataReceivedProgress(
                  eventEmitter,
                  requestId,
                  bytesWritten,
                  contentLength);
                last = now;
              }
            });
          return originalResponse.newBuilder().body(responseBody).build();
        }
      });
    }

    // If the current timeout does not equal the passed in timeout, we need to clone the existing
    // client and set the timeout explicitly on the clone.  This is cheap as everything else is
    // shared under the hood.
    // See https://github.com/square/okhttp/wiki/Recipes#per-call-configuration for more information
    if (timeout != mClient.connectTimeoutMillis()) {
      clientBuilder.readTimeout(timeout, TimeUnit.MILLISECONDS);
    }
    OkHttpClient client = clientBuilder.build();

    Headers requestHeaders = extractHeaders(headers, data);
    if (requestHeaders == null) {
      ResponseUtil.onRequestError(eventEmitter, requestId, "Unrecognized headers format", null);
      return;
    }
    String contentType = requestHeaders.get(CONTENT_TYPE_HEADER_NAME);
    String contentEncoding = requestHeaders.get(CONTENT_ENCODING_HEADER_NAME);
    requestBuilder.headers(requestHeaders);

    if (data == null) {
      requestBuilder.method(method, RequestBodyUtil.getEmptyBody(method));
    } else if (data.hasKey(REQUEST_BODY_KEY_STRING)) {
      if (contentType == null) {
        ResponseUtil.onRequestError(
          eventEmitter,
          requestId,
          "Payload is set but no content-type header specified",
          null);
        return;
      }
      String body = data.getString(REQUEST_BODY_KEY_STRING);
      MediaType contentMediaType = MediaType.parse(contentType);
      if (RequestBodyUtil.isGzipEncoding(contentEncoding)) {
        RequestBody requestBody = RequestBodyUtil.createGzip(contentMediaType, body);
        if (requestBody == null) {
          ResponseUtil.onRequestError(eventEmitter, requestId, "Failed to gzip request body", null);
          return;
        }
        requestBuilder.method(method, requestBody);
      } else {
        requestBuilder.method(method, RequestBody.create(contentMediaType, body));
      }
    } else if (data.hasKey(REQUEST_BODY_KEY_URI)) {
      if (contentType == null) {
        ResponseUtil.onRequestError(
          eventEmitter,
          requestId,
          "Payload is set but no content-type header specified",
          null);
        return;
      }
      String uri = data.getString(REQUEST_BODY_KEY_URI);
      InputStream fileInputStream =
          RequestBodyUtil.getFileInputStream(getReactApplicationContext(), uri);
      if (fileInputStream == null) {
        ResponseUtil.onRequestError(
          eventEmitter,
          requestId,
          "Could not retrieve file for uri " + uri,
          null);
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
      MultipartBody.Builder multipartBuilder =
          constructMultipartBody(executorToken, parts, contentType, requestId);
      if (multipartBuilder == null) {
        return;
      }

      requestBuilder.method(
        method,
        RequestBodyUtil.createProgressRequest(
          multipartBuilder.build(),
          new ProgressListener() {
        long last = System.nanoTime();

        @Override
        public void onProgress(long bytesWritten, long contentLength, boolean done) {
          long now = System.nanoTime();
          if (done || shouldDispatch(now, last)) {
            ResponseUtil.onDataSend(eventEmitter, requestId, bytesWritten, contentLength);
            last = now;
          }
        }
      }));
    } else {
      // Nothing in data payload, at least nothing we could understand anyway.
      requestBuilder.method(method, RequestBodyUtil.getEmptyBody(method));
    }

    addRequest(requestId);
    client.newCall(requestBuilder.build()).enqueue(
        new Callback() {
          @Override
          public void onFailure(Call call, IOException e) {
            if (mShuttingDown) {
              return;
            }
            removeRequest(requestId);
            ResponseUtil.onRequestError(eventEmitter, requestId, e.getMessage(), e);
          }

          @Override
          public void onResponse(Call call, Response response) throws IOException {
            if (mShuttingDown) {
              return;
            }
            removeRequest(requestId);
            // Before we touch the body send headers to JS
            ResponseUtil.onResponseReceived(
              eventEmitter,
              requestId,
              response.code(),
              translateHeaders(response.headers()),
              response.request().url().toString());

            ResponseBody responseBody = response.body();
            try {
              // If JS wants progress updates during the download, and it requested a text response,
              // periodically send response data updates to JS.
              if (useIncrementalUpdates && responseType.equals("text")) {
                readWithProgress(eventEmitter, requestId, responseBody);
                ResponseUtil.onRequestSuccess(eventEmitter, requestId);
                return;
              }

              // Otherwise send the data in one big chunk, in the format that JS requested.
              String responseString = "";
              if (responseType.equals("text")) {
                responseString = responseBody.string();
              } else if (responseType.equals("base64")) {
                responseString = Base64.encodeToString(responseBody.bytes(), Base64.NO_WRAP);
              }
              ResponseUtil.onDataReceived(eventEmitter, requestId, responseString);
              ResponseUtil.onRequestSuccess(eventEmitter, requestId);
            } catch (IOException e) {
              ResponseUtil.onRequestError(eventEmitter, requestId, e.getMessage(), e);
            }
          }
        });
  }

  private void readWithProgress(
      RCTDeviceEventEmitter eventEmitter,
      int requestId,
      ResponseBody responseBody) throws IOException {
    long totalBytesRead = -1;
    long contentLength = -1;
    try {
      ProgressResponseBody progressResponseBody = (ProgressResponseBody) responseBody;
      totalBytesRead = progressResponseBody.totalBytesRead();
      contentLength = progressResponseBody.contentLength();
    } catch (ClassCastException e) {
      // Ignore
    }

    Reader reader = responseBody.charStream();
    try {
      char[] buffer = new char[MAX_CHUNK_SIZE_BETWEEN_FLUSHES];
      int read;
      while ((read = reader.read(buffer)) != -1) {
        ResponseUtil.onIncrementalDataReceived(
          eventEmitter,
          requestId,
          new String(buffer, 0, read),
          totalBytesRead,
          contentLength);
      }
    } finally {
      reader.close();
    }
  }

  private static boolean shouldDispatch(long now, long last) {
    return last + CHUNK_TIMEOUT_NS < now;
  }

  private synchronized void addRequest(int requestId) {
    mRequestIds.add(requestId);
  }

  private synchronized void removeRequest(int requestId) {
    mRequestIds.remove(requestId);
  }

  private synchronized void cancelAllRequests() {
    for (Integer requestId : mRequestIds) {
      cancelRequest(requestId);
    }
    mRequestIds.clear();
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
    cancelRequest(requestId);
    removeRequest(requestId);
  }

  private void cancelRequest(final int requestId) {
    // We have to use AsyncTask since this might trigger a NetworkOnMainThreadException, this is an
    // open issue on OkHttp: https://github.com/square/okhttp/issues/869
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        OkHttpCallUtil.cancelTag(mClient, Integer.valueOf(requestId));
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

  private @Nullable MultipartBody.Builder constructMultipartBody(
      ExecutorToken ExecutorToken,
      ReadableArray body,
      String contentType,
      int requestId) {
    RCTDeviceEventEmitter eventEmitter = getEventEmitter(ExecutorToken);
    MultipartBody.Builder multipartBuilder = new MultipartBody.Builder();
    multipartBuilder.setType(MediaType.parse(contentType));

    for (int i = 0, size = body.size(); i < size; i++) {
      ReadableMap bodyPart = body.getMap(i);

      // Determine part's content type.
      ReadableArray headersArray = bodyPart.getArray("headers");
      Headers headers = extractHeaders(headersArray, null);
      if (headers == null) {
        ResponseUtil.onRequestError(
          eventEmitter,
          requestId,
          "Missing or invalid header format for FormData part.",
          null);
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
          ResponseUtil.onRequestError(
            eventEmitter,
            requestId,
            "Binary FormData part needs a content-type header.",
            null);
          return null;
        }
        String fileContentUriStr = bodyPart.getString(REQUEST_BODY_KEY_URI);
        InputStream fileInputStream =
            RequestBodyUtil.getFileInputStream(getReactApplicationContext(), fileContentUriStr);
        if (fileInputStream == null) {
          ResponseUtil.onRequestError(
            eventEmitter,
            requestId,
            "Could not retrieve file for uri " + fileContentUriStr,
            null);
          return null;
        }
        multipartBuilder.addPart(headers, RequestBodyUtil.create(partContentType, fileInputStream));
      } else {
        ResponseUtil.onRequestError(eventEmitter, requestId, "Unrecognized FormData part.", null);
      }
    }
    return multipartBuilder;
  }

  /**
   * Extracts the headers from the Array. If the format is invalid, this method will return null.
   */
  private @Nullable Headers extractHeaders(
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

  private RCTDeviceEventEmitter getEventEmitter(ExecutorToken ExecutorToken) {
    return getReactApplicationContext()
        .getJSModule(ExecutorToken, RCTDeviceEventEmitter.class);
  }
}
