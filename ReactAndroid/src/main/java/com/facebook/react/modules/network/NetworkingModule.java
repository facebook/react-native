/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeNetworkingAndroidSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.StandardCharsets;
import com.facebook.react.common.network.OkHttpCallUtil;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.CookieJar;
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
import okio.ByteString;
import okio.GzipSource;
import okio.Okio;

/** Implements the XMLHttpRequest JavaScript interface. */
@ReactModule(name = NativeNetworkingAndroidSpec.NAME)
public final class NetworkingModule extends NativeNetworkingAndroidSpec {

  /**
   * Allows to implement a custom fetching process for specific URIs. It is the handler's job to
   * fetch the URI and return the JS body payload.
   */
  public interface UriHandler {
    /** Returns if the handler should be used for an URI. */
    boolean supports(Uri uri, String responseType);

    /** Fetch the URI and return the JS body payload. */
    WritableMap fetch(Uri uri) throws IOException;
  }

  /** Allows adding custom handling to build the {@link RequestBody} from the JS body payload. */
  public interface RequestBodyHandler {
    /** Returns if the handler should be used for a JS body payload. */
    boolean supports(ReadableMap map);

    /** Returns the {@link RequestBody} for the JS body payload. */
    RequestBody toRequestBody(ReadableMap map, String contentType);
  }

  /** Allows adding custom handling to build the JS body payload from the {@link ResponseBody}. */
  public interface ResponseHandler {
    /** Returns if the handler should be used for a response type. */
    boolean supports(String responseType);

    /** Returns the JS body payload for the {@link ResponseBody}. */
    WritableMap toResponseData(ResponseBody body) throws IOException;
  }

  private static final String TAG = NativeNetworkingAndroidSpec.NAME;
  private static final String CONTENT_ENCODING_HEADER_NAME = "content-encoding";
  private static final String CONTENT_TYPE_HEADER_NAME = "content-type";
  private static final String REQUEST_BODY_KEY_STRING = "string";
  private static final String REQUEST_BODY_KEY_URI = "uri";
  private static final String REQUEST_BODY_KEY_FORMDATA = "formData";
  private static final String REQUEST_BODY_KEY_BASE64 = "base64";
  private static final String USER_AGENT_HEADER_NAME = "user-agent";
  private static final int CHUNK_TIMEOUT_NS = 100 * 1000000; // 100ms
  private static final int MAX_CHUNK_SIZE_BETWEEN_FLUSHES = 8 * 1024; // 8K

  private static @Nullable CustomClientBuilder customClientBuilder = null;

  private final OkHttpClient mClient;
  private final ForwardingCookieHandler mCookieHandler;
  private final @Nullable String mDefaultUserAgent;
  private final CookieJarContainer mCookieJarContainer;
  private final Set<Integer> mRequestIds;
  private final List<RequestBodyHandler> mRequestBodyHandlers = new ArrayList<>();
  private final List<UriHandler> mUriHandlers = new ArrayList<>();
  private final List<ResponseHandler> mResponseHandlers = new ArrayList<>();
  private boolean mShuttingDown;

  public NetworkingModule(
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
    mCookieHandler = new ForwardingCookieHandler(reactContext);
    mCookieJarContainer = (CookieJarContainer) mClient.cookieJar();
    mShuttingDown = false;
    mDefaultUserAgent = defaultUserAgent;
    mRequestIds = new HashSet<>();
  }

  /**
   * @param context the ReactContext of the application
   * @param defaultUserAgent the User-Agent header that will be set for all requests where the
   *     caller does not provide one explicitly
   * @param client the {@link OkHttpClient} to be used for networking
   */
  /* package */ NetworkingModule(
      ReactApplicationContext context, @Nullable String defaultUserAgent, OkHttpClient client) {
    this(context, defaultUserAgent, client, null);
  }

  /** @param context the ReactContext of the application */
  public NetworkingModule(final ReactApplicationContext context) {
    this(context, null, OkHttpClientProvider.createClient(context), null);
  }

  /**
   * @param context the ReactContext of the application
   * @param networkInterceptorCreators list of {@link NetworkInterceptorCreator}'s whose create()
   *     methods would be called to attach the interceptors to the client.
   */
  public NetworkingModule(
      ReactApplicationContext context, List<NetworkInterceptorCreator> networkInterceptorCreators) {
    this(context, null, OkHttpClientProvider.createClient(context), networkInterceptorCreators);
  }

  /**
   * @param context the ReactContext of the application
   * @param defaultUserAgent the User-Agent header that will be set for all requests where the
   *     caller does not provide one explicitly
   */
  public NetworkingModule(ReactApplicationContext context, String defaultUserAgent) {
    this(context, defaultUserAgent, OkHttpClientProvider.createClient(context), null);
  }

  public static void setCustomClientBuilder(CustomClientBuilder ccb) {
    customClientBuilder = ccb;
  }

  public static interface CustomClientBuilder {
    public void apply(OkHttpClient.Builder builder);
  }

  private static void applyCustomBuilder(OkHttpClient.Builder builder) {
    if (customClientBuilder != null) {
      customClientBuilder.apply(builder);
    }
  }

  @Override
  public void initialize() {
    mCookieJarContainer.setCookieJar(new JavaNetCookieJar(mCookieHandler));
  }

  @Override
  public void invalidate() {
    mShuttingDown = true;
    cancelAllRequests();

    mCookieHandler.destroy();
    mCookieJarContainer.removeCookieJar();

    mRequestBodyHandlers.clear();
    mResponseHandlers.clear();
    mUriHandlers.clear();
  }

  public void addUriHandler(UriHandler handler) {
    mUriHandlers.add(handler);
  }

  public void addRequestBodyHandler(RequestBodyHandler handler) {
    mRequestBodyHandlers.add(handler);
  }

  public void addResponseHandler(ResponseHandler handler) {
    mResponseHandlers.add(handler);
  }

  public void removeUriHandler(UriHandler handler) {
    mUriHandlers.remove(handler);
  }

  public void removeRequestBodyHandler(RequestBodyHandler handler) {
    mRequestBodyHandlers.remove(handler);
  }

  public void removeResponseHandler(ResponseHandler handler) {
    mResponseHandlers.remove(handler);
  }

  @Override
  public void sendRequest(
      String method,
      String url,
      double requestIdAsDouble,
      ReadableArray headers,
      ReadableMap data,
      String responseType,
      boolean useIncrementalUpdates,
      double timeoutAsDouble,
      boolean withCredentials) {
    int requestId = (int) requestIdAsDouble;
    int timeout = (int) timeoutAsDouble;
    try {
      sendRequestInternal(
          method,
          url,
          requestId,
          headers,
          data,
          responseType,
          useIncrementalUpdates,
          timeout,
          withCredentials);
    } catch (Throwable th) {
      FLog.e(TAG, "Failed to send url request: " + url, th);
      final RCTDeviceEventEmitter eventEmitter = getEventEmitter("sendRequest error");
      if (eventEmitter != null) {
        ResponseUtil.onRequestError(eventEmitter, requestId, th.getMessage(), th);
      }
    }
  }

  /** @param timeout value of 0 results in no timeout */
  public void sendRequestInternal(
      String method,
      String url,
      final int requestId,
      ReadableArray headers,
      ReadableMap data,
      final String responseType,
      final boolean useIncrementalUpdates,
      int timeout,
      boolean withCredentials) {
    final RCTDeviceEventEmitter eventEmitter = getEventEmitter("sendRequestInternal");

    try {
      Uri uri = Uri.parse(url);

      // Check if a handler is registered
      for (UriHandler handler : mUriHandlers) {
        if (handler.supports(uri, responseType)) {
          WritableMap res = handler.fetch(uri);
          ResponseUtil.onDataReceived(eventEmitter, requestId, res);
          ResponseUtil.onRequestSuccess(eventEmitter, requestId);
          return;
        }
      }
    } catch (IOException e) {
      ResponseUtil.onRequestError(eventEmitter, requestId, e.getMessage(), e);
      return;
    }

    Request.Builder requestBuilder;
    try {
      requestBuilder = new Request.Builder().url(url);
    } catch (Exception e) {
      ResponseUtil.onRequestError(eventEmitter, requestId, e.getMessage(), null);
      return;
    }

    if (requestId != 0) {
      requestBuilder.tag(requestId);
    }

    OkHttpClient.Builder clientBuilder = mClient.newBuilder();

    applyCustomBuilder(clientBuilder);

    if (!withCredentials) {
      clientBuilder.cookieJar(CookieJar.NO_COOKIES);
    }

    // If JS is listening for progress updates, install a ProgressResponseBody that intercepts the
    // response and counts bytes received.
    if (useIncrementalUpdates) {
      clientBuilder.addNetworkInterceptor(
          new Interceptor() {
            @Override
            public Response intercept(Interceptor.Chain chain) throws IOException {
              Response originalResponse = chain.proceed(chain.request());
              ProgressResponseBody responseBody =
                  new ProgressResponseBody(
                      originalResponse.body(),
                      new ProgressListener() {
                        long last = System.nanoTime();

                        @Override
                        public void onProgress(
                            long bytesWritten, long contentLength, boolean done) {
                          long now = System.nanoTime();
                          if (!done && !shouldDispatch(now, last)) {
                            return;
                          }
                          if (responseType.equals("text")) {
                            // For 'text' responses we continuously send response data with progress
                            // info to
                            // JS below, so no need to do anything here.
                            return;
                          }
                          ResponseUtil.onDataReceivedProgress(
                              eventEmitter, requestId, bytesWritten, contentLength);
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
      clientBuilder.connectTimeout(timeout, TimeUnit.MILLISECONDS);
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

    // Check if a handler is registered
    RequestBodyHandler handler = null;
    if (data != null) {
      for (RequestBodyHandler curHandler : mRequestBodyHandlers) {
        if (curHandler.supports(data)) {
          handler = curHandler;
          break;
        }
      }
    }

    RequestBody requestBody;
    if (data == null
        || method.toLowerCase(Locale.ROOT).equals("get")
        || method.toLowerCase(Locale.ROOT).equals("head")) {
      requestBody = RequestBodyUtil.getEmptyBody(method);
    } else if (handler != null) {
      requestBody = handler.toRequestBody(data, contentType);
    } else if (data.hasKey(REQUEST_BODY_KEY_STRING)) {
      if (contentType == null) {
        ResponseUtil.onRequestError(
            eventEmitter, requestId, "Payload is set but no content-type header specified", null);
        return;
      }
      String body = data.getString(REQUEST_BODY_KEY_STRING);
      MediaType contentMediaType = MediaType.parse(contentType);
      if (RequestBodyUtil.isGzipEncoding(contentEncoding)) {
        requestBody = RequestBodyUtil.createGzip(contentMediaType, body);
        if (requestBody == null) {
          ResponseUtil.onRequestError(eventEmitter, requestId, "Failed to gzip request body", null);
          return;
        }
      } else {
        // Use getBytes() to convert the body into a byte[], preventing okhttp from
        // appending the character set to the Content-Type header when otherwise unspecified
        // https://github.com/facebook/react-native/issues/8237
        Charset charset =
            contentMediaType == null
                ? StandardCharsets.UTF_8
                : contentMediaType.charset(StandardCharsets.UTF_8);
        requestBody = RequestBody.create(contentMediaType, body.getBytes(charset));
      }
    } else if (data.hasKey(REQUEST_BODY_KEY_BASE64)) {
      if (contentType == null) {
        ResponseUtil.onRequestError(
            eventEmitter, requestId, "Payload is set but no content-type header specified", null);
        return;
      }
      String base64String = data.getString(REQUEST_BODY_KEY_BASE64);
      MediaType contentMediaType = MediaType.parse(contentType);
      requestBody = RequestBody.create(contentMediaType, ByteString.decodeBase64(base64String));
    } else if (data.hasKey(REQUEST_BODY_KEY_URI)) {
      if (contentType == null) {
        ResponseUtil.onRequestError(
            eventEmitter, requestId, "Payload is set but no content-type header specified", null);
        return;
      }
      String uri = data.getString(REQUEST_BODY_KEY_URI);
      InputStream fileInputStream =
          RequestBodyUtil.getFileInputStream(getReactApplicationContext(), uri);
      if (fileInputStream == null) {
        ResponseUtil.onRequestError(
            eventEmitter, requestId, "Could not retrieve file for uri " + uri, null);
        return;
      }
      requestBody = RequestBodyUtil.create(MediaType.parse(contentType), fileInputStream);
    } else if (data.hasKey(REQUEST_BODY_KEY_FORMDATA)) {
      if (contentType == null) {
        contentType = "multipart/form-data";
      }
      ReadableArray parts = data.getArray(REQUEST_BODY_KEY_FORMDATA);
      MultipartBody.Builder multipartBuilder =
          constructMultipartBody(parts, contentType, requestId);
      if (multipartBuilder == null) {
        return;
      }
      requestBody = multipartBuilder.build();
    } else {
      // Nothing in data payload, at least nothing we could understand anyway.
      requestBody = RequestBodyUtil.getEmptyBody(method);
    }

    requestBuilder.method(
        method, wrapRequestBodyWithProgressEmitter(requestBody, eventEmitter, requestId));

    addRequest(requestId);
    client
        .newCall(requestBuilder.build())
        .enqueue(
            new Callback() {
              @Override
              public void onFailure(Call call, IOException e) {
                if (mShuttingDown) {
                  return;
                }
                removeRequest(requestId);
                String errorMessage =
                    e.getMessage() != null
                        ? e.getMessage()
                        : "Error while executing request: " + e.getClass().getSimpleName();
                ResponseUtil.onRequestError(eventEmitter, requestId, errorMessage, e);
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

                try {
                  // OkHttp implements something called transparent gzip, which mean that it will
                  // automatically add the Accept-Encoding gzip header and handle decoding
                  // internally.
                  // The issue is that it won't handle decoding if the user provides a
                  // Accept-Encoding
                  // header. This is also undesirable considering that iOS does handle the decoding
                  // even
                  // when the header is provided. To make sure this works in all cases, handle gzip
                  // body
                  // here also. This works fine since OKHttp will remove the Content-Encoding header
                  // if
                  // it used transparent gzip.
                  // See
                  // https://github.com/square/okhttp/blob/5b37cda9e00626f43acf354df145fd452c3031f1/okhttp/src/main/java/okhttp3/internal/http/BridgeInterceptor.java#L76-L111
                  ResponseBody responseBody = response.body();
                  if ("gzip".equalsIgnoreCase(response.header("Content-Encoding"))
                      && responseBody != null) {
                    GzipSource gzipSource = new GzipSource(responseBody.source());
                    String contentType = response.header("Content-Type");
                    responseBody =
                        ResponseBody.create(
                            contentType != null ? MediaType.parse(contentType) : null,
                            -1L,
                            Okio.buffer(gzipSource));
                  }

                  // Check if a handler is registered
                  for (ResponseHandler handler : mResponseHandlers) {
                    if (handler.supports(responseType)) {
                      WritableMap res = handler.toResponseData(responseBody);
                      ResponseUtil.onDataReceived(eventEmitter, requestId, res);
                      ResponseUtil.onRequestSuccess(eventEmitter, requestId);
                      return;
                    }
                  }

                  // If JS wants progress updates during the download, and it requested a text
                  // response,
                  // periodically send response data updates to JS.
                  if (useIncrementalUpdates && responseType.equals("text")) {
                    readWithProgress(eventEmitter, requestId, responseBody);
                    ResponseUtil.onRequestSuccess(eventEmitter, requestId);
                    return;
                  }

                  // Otherwise send the data in one big chunk, in the format that JS requested.
                  String responseString = "";
                  if (responseType.equals("text")) {
                    try {
                      responseString = responseBody.string();
                    } catch (IOException e) {
                      if (response.request().method().equalsIgnoreCase("HEAD")) {
                        // The request is an `HEAD` and the body is empty,
                        // the OkHttp will produce an exception.
                        // Ignore the exception to not invalidate the request in the
                        // Javascript layer.
                        // Introduced to fix issue #7463.
                      } else {
                        ResponseUtil.onRequestError(eventEmitter, requestId, e.getMessage(), e);
                      }
                    }
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

  private RequestBody wrapRequestBodyWithProgressEmitter(
      final RequestBody requestBody,
      final RCTDeviceEventEmitter eventEmitter,
      final int requestId) {
    if (requestBody == null) {
      return null;
    }
    return RequestBodyUtil.createProgressRequest(
        requestBody,
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
        });
  }

  private void readWithProgress(
      RCTDeviceEventEmitter eventEmitter, int requestId, ResponseBody responseBody)
      throws IOException {
    long totalBytesRead = -1;
    long contentLength = -1;
    try {
      ProgressResponseBody progressResponseBody = (ProgressResponseBody) responseBody;
      totalBytesRead = progressResponseBody.totalBytesRead();
      contentLength = progressResponseBody.contentLength();
    } catch (ClassCastException e) {
      // Ignore
    }

    Charset charset =
        responseBody.contentType() == null
            ? StandardCharsets.UTF_8
            : responseBody.contentType().charset(StandardCharsets.UTF_8);

    ProgressiveStringDecoder streamDecoder = new ProgressiveStringDecoder(charset);
    InputStream inputStream = responseBody.byteStream();
    try {
      byte[] buffer = new byte[MAX_CHUNK_SIZE_BETWEEN_FLUSHES];
      int read;
      while ((read = inputStream.read(buffer)) != -1) {
        ResponseUtil.onIncrementalDataReceived(
            eventEmitter,
            requestId,
            streamDecoder.decodeNext(buffer, read),
            totalBytesRead,
            contentLength);
      }
    } finally {
      inputStream.close();
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
    Bundle responseHeaders = new Bundle();
    for (int i = 0; i < headers.size(); i++) {
      String headerName = headers.name(i);
      // multiple values for the same header
      if (responseHeaders.containsKey(headerName)) {
        responseHeaders.putString(
            headerName, responseHeaders.getString(headerName) + ", " + headers.value(i));
      } else {
        responseHeaders.putString(headerName, headers.value(i));
      }
    }
    return Arguments.fromBundle(responseHeaders);
  }

  @Override
  public void abortRequest(double requestIdAsDouble) {
    int requestId = (int) requestIdAsDouble;
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
  public void clearCookies(com.facebook.react.bridge.Callback callback) {
    mCookieHandler.clearCookies(callback);
  }

  @Override
  public void addListener(String eventName) {}

  @Override
  public void removeListeners(double count) {}

  private @Nullable MultipartBody.Builder constructMultipartBody(
      ReadableArray body, String contentType, int requestId) {
    RCTDeviceEventEmitter eventEmitter = getEventEmitter("constructMultipartBody");
    MultipartBody.Builder multipartBuilder = new MultipartBody.Builder();
    multipartBuilder.setType(MediaType.parse(contentType));

    for (int i = 0, size = body.size(); i < size; i++) {
      ReadableMap bodyPart = body.getMap(i);

      // Determine part's content type.
      ReadableArray headersArray = bodyPart.getArray("headers");
      Headers headers = extractHeaders(headersArray, null);
      if (headers == null) {
        ResponseUtil.onRequestError(
            eventEmitter, requestId, "Missing or invalid header format for FormData part.", null);
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
              eventEmitter, requestId, "Binary FormData part needs a content-type header.", null);
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
      @Nullable ReadableArray headersArray, @Nullable ReadableMap requestData) {
    if (headersArray == null) {
      return null;
    }
    Headers.Builder headersBuilder = new Headers.Builder();
    for (int headersIdx = 0, size = headersArray.size(); headersIdx < size; headersIdx++) {
      ReadableArray header = headersArray.getArray(headersIdx);
      if (header == null || header.size() != 2) {
        return null;
      }
      String headerName = HeaderUtil.stripHeaderName(header.getString(0));
      String headerValue = HeaderUtil.stripHeaderValue(header.getString(1));
      if (headerName == null || headerValue == null) {
        return null;
      }
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

  private RCTDeviceEventEmitter getEventEmitter(String reason) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      return getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class);
    }

    return null;
  }
}
