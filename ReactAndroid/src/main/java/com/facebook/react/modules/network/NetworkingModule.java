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
import java.net.CookieHandler;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import com.squareup.okhttp.Headers;
import com.squareup.okhttp.MediaType;
import com.squareup.okhttp.MultipartBuilder;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.RequestBody;
import com.squareup.okhttp.Response;

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

  private final OkHttpClient mClient;
  private final @Nullable String mDefaultUserAgent;
  private boolean mShuttingDown;

  /* package */ NetworkingModule(
      ReactApplicationContext reactContext,
      @Nullable String defaultUserAgent,
      OkHttpClient client) {
    super(reactContext);
    mClient = client;
    mShuttingDown = false;
    mDefaultUserAgent = defaultUserAgent;
  }

  /**
   * @param context the ReactContext of the application
   */
  public NetworkingModule(final ReactApplicationContext context) {
    this(context, null, OkHttpClientProvider.getCookieAwareOkHttpClient(context));
  }

  /**
   * @param context the ReactContext of the application
   * @param defaultUserAgent the User-Agent header that will be set for all requests where the
   * caller does not provide one explicitly
   */
  public NetworkingModule(ReactApplicationContext context, String defaultUserAgent) {
    this(context, defaultUserAgent, OkHttpClientProvider.getCookieAwareOkHttpClient(context));
  }

  public NetworkingModule(ReactApplicationContext reactContext, OkHttpClient client) {
    this(reactContext, null, client);
  }

  @Override
  public String getName() {
    return "RCTNetworking";
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mShuttingDown = true;
    mClient.cancel(null);

    CookieHandler cookieHandler = mClient.getCookieHandler();
    if (cookieHandler instanceof ForwardingCookieHandler) {
      ((ForwardingCookieHandler) cookieHandler).destroy();
    }
  }

  @ReactMethod
  public void sendRequest(
      String method,
      String url,
      int requestId,
      ReadableArray headers,
      ReadableMap data,
      final Callback callback) {
    // We need to call the callback to avoid leaking memory on JS even when input for sending
    // request is erroneous or insufficient. For non-http based failures we use code 0, which is
    // interpreted as a transport error.
    // Callback accepts following arguments: responseCode, headersString, responseBody

    Request.Builder requestBuilder = new Request.Builder().url(url);

    if (requestId != 0) {
      requestBuilder.tag(requestId);
    }

    Headers requestHeaders = extractHeaders(headers, data);
    if (requestHeaders == null) {
      callback.invoke(0, null, "Unrecognized headers format");
      return;
    }
    String contentType = requestHeaders.get(CONTENT_TYPE_HEADER_NAME);
    String contentEncoding = requestHeaders.get(CONTENT_ENCODING_HEADER_NAME);
    requestBuilder.headers(requestHeaders);

    if (data == null) {
      requestBuilder.method(method, null);
    } else if (data.hasKey(REQUEST_BODY_KEY_STRING)) {
      if (contentType == null) {
        callback.invoke(0, null, "Payload is set but no content-type header specified");
        return;
      }
      String body = data.getString(REQUEST_BODY_KEY_STRING);
      MediaType contentMediaType = MediaType.parse(contentType);
      if (RequestBodyUtil.isGzipEncoding(contentEncoding)) {
        RequestBody requestBody = RequestBodyUtil.createGzip(contentMediaType, body);
        if (requestBody == null) {
          callback.invoke(0, null, "Failed to gzip request body");
          return;
        }
        requestBuilder.method(method, requestBody);
      } else {
        requestBuilder.method(method, RequestBody.create(contentMediaType, body));
      }
    } else if (data.hasKey(REQUEST_BODY_KEY_URI)) {
      if (contentType == null) {
        callback.invoke(0, null, "Payload is set but no content-type header specified");
        return;
      }
      String uri = data.getString(REQUEST_BODY_KEY_URI);
      InputStream fileInputStream =
          RequestBodyUtil.getFileInputStream(getReactApplicationContext(), uri);
      if (fileInputStream == null) {
        callback.invoke(0, null, "Could not retrieve file for uri " + uri);
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
      MultipartBuilder multipartBuilder = constructMultipartBody(parts, contentType, callback);
      if (multipartBuilder == null) {
        return;
      }
      requestBuilder.method(method, multipartBuilder.build());
    } else {
      // Nothing in data payload, at least nothing we could understand anyway.
      // Ignore and treat it as if it were null.
      requestBuilder.method(method, null);
    }

    mClient.newCall(requestBuilder.build()).enqueue(
        new com.squareup.okhttp.Callback() {
          @Override
          public void onFailure(Request request, IOException e) {
            if (mShuttingDown) {
              return;
            }
            // We need to call the callback to avoid leaking memory on JS even when input for
            // sending request is erronous or insufficient. For non-http based failures we use
            // code 0, which is interpreted as a transport error
            callback.invoke(0, null, e.getMessage());
          }

          @Override
          public void onResponse(Response response) throws IOException {
            if (mShuttingDown) {
              return;
            }
            String responseBody;
            try {
              responseBody = response.body().string();
            } catch (IOException e) {
              // The stream has been cancelled or closed, nothing we can do
              callback.invoke(0, null, e.getMessage());
              return;
            }

            WritableMap responseHeaders = Arguments.createMap();
            Headers headers = response.headers();
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

            callback.invoke(response.code(), responseHeaders, responseBody);
          }
        });
  }

  @ReactMethod
  public void abortRequest(final int requestId) {
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
  public void clearCookies(com.facebook.react.bridge.Callback callback) {
    CookieHandler cookieHandler = mClient.getCookieHandler();
    if (cookieHandler instanceof ForwardingCookieHandler) {
      ((ForwardingCookieHandler) cookieHandler).clearCookies(callback);
    }
  }

  private @Nullable MultipartBuilder constructMultipartBody(
      ReadableArray body,
      String contentType,
      Callback callback) {
    MultipartBuilder multipartBuilder = new MultipartBuilder();
    multipartBuilder.type(MediaType.parse(contentType));

    for (int i = 0, size = body.size(); i < size; i++) {
      ReadableMap bodyPart = body.getMap(i);

      // Determine part's content type.
      ReadableArray headersArray = bodyPart.getArray("headers");
      Headers headers = extractHeaders(headersArray, null);
      if (headers == null) {
        callback.invoke(0, null, "Missing or invalid header format for FormData part.");
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
          callback.invoke(0, null, "Binary FormData part needs a content-type header.");
          return null;
        }
        String fileContentUriStr = bodyPart.getString(REQUEST_BODY_KEY_URI);
        InputStream fileInputStream =
            RequestBodyUtil.getFileInputStream(getReactApplicationContext(), fileContentUriStr);
        if (fileInputStream == null) {
          callback.invoke(0, null, "Could not retrieve file for uri " + fileContentUriStr);
          return null;
        }
        multipartBuilder.addPart(headers, RequestBodyUtil.create(partContentType, fileInputStream));
      } else {
        callback.invoke(0, null, "Unrecognized FormData part.");
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
}
