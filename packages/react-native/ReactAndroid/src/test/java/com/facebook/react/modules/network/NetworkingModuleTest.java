/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.network.OkHttpCallUtil;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import okhttp3.Call;
import okhttp3.Headers;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okio.Buffer;
import org.junit.After;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.robolectric.RobolectricTestRunner;

/** Tests for {@link NetworkingModule}. */
@RunWith(RobolectricTestRunner.class)
@Ignore("Ignored due to unsupported mocking mechanism with JDK 18")
public class NetworkingModuleTest {
  private NetworkingModule mNetworkingModule;
  private OkHttpClient mHttpClient;
  private ReactApplicationContext mContext;

  private MockedStatic<Arguments> arguments;

  @Before
  public void prepareModules() {
    mHttpClient = mock(OkHttpClient.class);
    when(mHttpClient.cookieJar()).thenReturn(mock(CookieJarContainer.class));
    when(mHttpClient.newCall(any(Request.class)))
        .thenAnswer(
            invocation -> {
              Call callMock = mock(Call.class);
              return callMock;
            });
    OkHttpClient.Builder clientBuilder = mock(OkHttpClient.Builder.class);
    when(clientBuilder.build()).thenReturn(mHttpClient);
    when(mHttpClient.newBuilder()).thenReturn(clientBuilder);

    CatalystInstance reactInstance = mock(CatalystInstance.class);

    mContext = mock(ReactApplicationContext.class);
    when(mContext.getCatalystInstance()).thenReturn(reactInstance);
    when(mContext.hasActiveReactInstance()).thenReturn(true);
    mNetworkingModule = new NetworkingModule(mContext, "", mHttpClient);

    arguments = mockStatic(Arguments.class);
    arguments.when(Arguments::createArray).thenAnswer(invocation -> new JavaOnlyArray());
    arguments.when(Arguments::createMap).thenAnswer(invocation -> new JavaOnlyMap());
  }

  @After
  public void tearDown() {
    arguments.close();
  }

  @Test
  public void testGetWithoutHeaders() throws Exception {
    mNetworkingModule.sendRequest(
        "GET",
        "http://somedomain/foo",
        /* requestId */ 0,
        /* headers */ JavaOnlyArray.of(),
        /* body */ null,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(mHttpClient).newCall(argumentCaptor.capture());
    assertThat(argumentCaptor.getValue().url().toString()).isEqualTo("http://somedomain/foo");
    // We set the User-Agent header by default
    assertThat(argumentCaptor.getValue().headers().size()).isEqualTo(1);
    assertThat(argumentCaptor.getValue().method()).isEqualTo("GET");
  }

  @Test
  public void testFailGetWithInvalidHeadersStruct() throws Exception {
    List<JavaOnlyArray> invalidHeaders = Arrays.asList(JavaOnlyArray.of("foo"));

    mNetworkingModule.sendRequest(
        "GET",
        "http://somedoman/foo",
        /* requestId */ 0,
        /* headers */ JavaOnlyArray.from(invalidHeaders),
        /* body */ null,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    verifyErrorEmit(mContext, 0);
  }

  @Test
  public void testFailPostWithoutContentType() throws Exception {
    JavaOnlyMap body = new JavaOnlyMap();
    body.putString("string", "This is request body");

    mNetworkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0,
        JavaOnlyArray.of(),
        body,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    verifyErrorEmit(mContext, 0);
  }

  @Test
  public void testFailInvalidUrl() throws Exception {
    mNetworkingModule.sendRequest(
        "GET",
        "aaa",
        /* requestId */ 0,
        /* headers */ JavaOnlyArray.of(),
        /* body */ null,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    verifyErrorEmit(mContext, 0);
  }

  private static void verifyErrorEmit(ReactApplicationContext context, int requestId) {
    ArgumentCaptor<WritableArray> captor = ArgumentCaptor.forClass(WritableArray.class);
    verify(context).emitDeviceEvent(eq("didCompleteNetworkResponse"), captor.capture());

    WritableArray array = captor.getValue();
    assertThat(array.getInt(0)).isEqualTo(requestId);
    assertThat(array.getString(1)).isNotNull();
  }

  @Test
  public void testSuccessfulPostRequest() throws Exception {
    JavaOnlyMap body = new JavaOnlyMap();
    body.putString("string", "This is request body");

    mNetworkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "text/plain")),
        body,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(mHttpClient).newCall(argumentCaptor.capture());
    assertThat(argumentCaptor.getValue().url().toString()).isEqualTo("http://somedomain/bar");
    assertThat(argumentCaptor.getValue().headers().size()).isEqualTo(2);
    assertThat(argumentCaptor.getValue().method()).isEqualTo("POST");
    assertThat(argumentCaptor.getValue().body().contentType().type()).isEqualTo("text");
    assertThat(argumentCaptor.getValue().body().contentType().subtype()).isEqualTo("plain");
    Buffer contentBuffer = new Buffer();
    argumentCaptor.getValue().body().writeTo(contentBuffer);
    assertThat(contentBuffer.readUtf8()).isEqualTo("This is request body");
  }

  @Test
  public void testHeaders() throws Exception {
    List<JavaOnlyArray> headers =
        Arrays.asList(
            JavaOnlyArray.of("Accept", "text/plain"),
            JavaOnlyArray.of("User-Agent", "React test agent/1.0"));

    mNetworkingModule.sendRequest(
        "GET",
        "http://someurl/baz",
        0,
        JavaOnlyArray.from(headers),
        null,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);
    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(mHttpClient).newCall(argumentCaptor.capture());
    Headers requestHeaders = argumentCaptor.getValue().headers();
    assertThat(requestHeaders.size()).isEqualTo(2);
    assertThat(requestHeaders.get("Accept")).isEqualTo("text/plain");
    assertThat(requestHeaders.get("User-Agent")).isEqualTo("React test agent/1.0");
  }

  @Test
  public void testPostJsonContentTypeHeader() throws Exception {

    JavaOnlyMap body = new JavaOnlyMap();
    body.putString("string", "{ \"key\": \"value\" }");

    mNetworkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "application/json")),
        body,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(mHttpClient).newCall(argumentCaptor.capture());

    // Verify okhttp does not append "charset=utf-8"
    assertThat(argumentCaptor.getValue().body().contentType().toString())
        .isEqualTo("application/json");
  }

  @Test
  public void testRespectsExistingCharacterSet() throws Exception {
    JavaOnlyMap body = new JavaOnlyMap();
    body.putString("string", "Friðjónsson");

    mNetworkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "text/plain; charset=utf-16")),
        body,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(mHttpClient).newCall(argumentCaptor.capture());

    Buffer contentBuffer = new Buffer();
    argumentCaptor.getValue().body().writeTo(contentBuffer);
    assertThat(contentBuffer.readString(StandardCharsets.UTF_16)).isEqualTo("Friðjónsson");
  }

  @Test
  public void testGracefullyRecoversFromInvalidContentType() throws Exception {
    JavaOnlyMap body = new JavaOnlyMap();
    body.putString("string", "test");

    mNetworkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "invalid")),
        body,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(mHttpClient).newCall(argumentCaptor.capture());

    Buffer contentBuffer = new Buffer();
    argumentCaptor.getValue().body().writeTo(contentBuffer);

    assertThat(contentBuffer.readString(StandardCharsets.UTF_8)).isEqualTo("test");
    assertThat(argumentCaptor.getValue().header("Content-Type")).isEqualTo("invalid");
  }

  @Test
  public void testMultipartPostRequestSimple() throws Exception {
    MockedStatic<RequestBodyUtil> requestBodyUtil = mockStatic(RequestBodyUtil.class);
    requestBodyUtil
        .when(() -> RequestBodyUtil.getFileInputStream(any(ReactContext.class), any(String.class)))
        .thenReturn(mock(InputStream.class));
    requestBodyUtil
        .when(() -> RequestBodyUtil.create(any(MediaType.class), any(InputStream.class)))
        .thenReturn(mock(RequestBody.class));
    requestBodyUtil
        .when(
            () ->
                RequestBodyUtil.createProgressRequest(
                    any(RequestBody.class), any(ProgressListener.class)))
        .thenCallRealMethod();

    JavaOnlyMap body = new JavaOnlyMap();
    JavaOnlyArray formData = new JavaOnlyArray();
    JavaOnlyMap bodyPart = new JavaOnlyMap();
    bodyPart.putString("string", "value");
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(Arrays.asList(JavaOnlyArray.of("content-disposition", "name"))));
    formData.pushMap(bodyPart);
    body.putArray("formData", formData);

    mNetworkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0,
        new JavaOnlyArray(),
        body,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    // verify url, method, headers
    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(mHttpClient).newCall(argumentCaptor.capture());
    assertThat(argumentCaptor.getValue().url().toString()).isEqualTo("http://someurl/uploadFoo");
    assertThat(argumentCaptor.getValue().method()).isEqualTo("POST");
    assertThat(argumentCaptor.getValue().body().contentType().type())
        .isEqualTo(MultipartBody.FORM.type());
    assertThat(argumentCaptor.getValue().body().contentType().subtype())
        .isEqualTo(MultipartBody.FORM.subtype());
    Headers requestHeaders = argumentCaptor.getValue().headers();
    assertThat(requestHeaders.size()).isEqualTo(1);

    requestBodyUtil.close();
  }

  @Test
  public void testMultipartPostRequestHeaders() throws Exception {
    MockedStatic<RequestBodyUtil> requestBodyUtil = mockStatic(RequestBodyUtil.class);
    requestBodyUtil
        .when(() -> RequestBodyUtil.getFileInputStream(any(ReactContext.class), any(String.class)))
        .thenReturn(mock(InputStream.class));
    requestBodyUtil
        .when(() -> RequestBodyUtil.create(any(MediaType.class), any(InputStream.class)))
        .thenReturn(mock(RequestBody.class));
    requestBodyUtil
        .when(
            () ->
                RequestBodyUtil.createProgressRequest(
                    any(RequestBody.class), any(ProgressListener.class)))
        .thenCallRealMethod();

    List<JavaOnlyArray> headers =
        Arrays.asList(
            JavaOnlyArray.of("Accept", "text/plain"),
            JavaOnlyArray.of("User-Agent", "React test agent/1.0"),
            JavaOnlyArray.of("content-type", "multipart/form-data"));

    JavaOnlyMap body = new JavaOnlyMap();
    JavaOnlyArray formData = new JavaOnlyArray();
    JavaOnlyMap bodyPart = new JavaOnlyMap();
    bodyPart.putString("string", "value");
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(Arrays.asList(JavaOnlyArray.of("content-disposition", "name"))));
    formData.pushMap(bodyPart);
    body.putArray("formData", formData);

    mNetworkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0,
        JavaOnlyArray.from(headers),
        body,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    // verify url, method, headers
    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(mHttpClient).newCall(argumentCaptor.capture());
    assertThat(argumentCaptor.getValue().url().toString()).isEqualTo("http://someurl/uploadFoo");
    assertThat(argumentCaptor.getValue().method()).isEqualTo("POST");
    assertThat(argumentCaptor.getValue().body().contentType().type())
        .isEqualTo(MultipartBody.FORM.type());
    assertThat(argumentCaptor.getValue().body().contentType().subtype())
        .isEqualTo(MultipartBody.FORM.subtype());
    Headers requestHeaders = argumentCaptor.getValue().headers();
    assertThat(requestHeaders.size()).isEqualTo(3);
    assertThat(requestHeaders.get("Accept")).isEqualTo("text/plain");
    assertThat(requestHeaders.get("User-Agent")).isEqualTo("React test agent/1.0");
    assertThat(requestHeaders.get("content-type")).isEqualTo("multipart/form-data");
  }

  @Test
  public void testMultipartPostRequestBody() throws Exception {
    InputStream inputStream = mock(InputStream.class);

    MockedStatic<RequestBodyUtil> requestBodyUtil = mockStatic(RequestBodyUtil.class);
    requestBodyUtil
        .when(() -> RequestBodyUtil.getFileInputStream(any(ReactContext.class), any(String.class)))
        .thenReturn(mock(InputStream.class));
    requestBodyUtil
        .when(() -> RequestBodyUtil.create(any(MediaType.class), any(InputStream.class)))
        .thenCallRealMethod();
    requestBodyUtil
        .when(
            () ->
                RequestBodyUtil.createProgressRequest(
                    any(RequestBody.class), any(ProgressListener.class)))
        .thenCallRealMethod();

    when(inputStream.available()).thenReturn("imageUri".length());

    final MultipartBody.Builder multipartBuilder = mock(MultipartBody.Builder.class);
    // TODO This PowerMock statement should be migrated to an equivalent for Mockito
    //      once this test is unsuppressed.
    //    whenNew(MultipartBody.Builder.class)
    //        .withNoArguments()
    //        .thenReturn(multipartBuilder);
    when(multipartBuilder.setType(any(MediaType.class)))
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return multipartBuilder;
              }
            });
    when(multipartBuilder.addPart(any(Headers.class), any(RequestBody.class)))
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return multipartBuilder;
              }
            });
    when(multipartBuilder.build())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return mock(MultipartBody.class);
              }
            });

    List<JavaOnlyArray> headers =
        Arrays.asList(JavaOnlyArray.of("content-type", "multipart/form-data"));

    JavaOnlyMap body = new JavaOnlyMap();
    JavaOnlyArray formData = new JavaOnlyArray();
    body.putArray("formData", formData);

    JavaOnlyMap bodyPart = new JavaOnlyMap();
    bodyPart.putString("string", "locale");
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(Arrays.asList(JavaOnlyArray.of("content-disposition", "user"))));
    formData.pushMap(bodyPart);

    JavaOnlyMap imageBodyPart = new JavaOnlyMap();
    imageBodyPart.putString("uri", "imageUri");
    imageBodyPart.putArray(
        "headers",
        JavaOnlyArray.from(
            Arrays.asList(
                JavaOnlyArray.of("content-type", "image/jpg"),
                JavaOnlyArray.of(
                    "content-disposition",
                    "filename=\"测试photo.jpg\"; filename*=utf-8''%E6%B5%8B%E8%AF%95photo.jpg"))));
    formData.pushMap(imageBodyPart);

    mNetworkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0,
        JavaOnlyArray.from(headers),
        body,
        /* responseType */ "text",
        /* useIncrementalUpdates*/ true,
        /* timeout */ 0,
        /* withCredentials */ false);

    // verify RequestBodyPart for image

    // TODO This should be migrated to requestBodyUtil.verify();
    //  PowerMockito.verifyStatic(RequestBodyUtil.class, times(1));
    RequestBodyUtil.getFileInputStream(any(ReactContext.class), eq("imageUri"));
    // TODO This should be migrated to requestBodyUtil.verify();
    //  PowerMockito.verifyStatic(RequestBodyUtil.class, times(1));
    RequestBodyUtil.create(MediaType.parse("image/jpg"), inputStream);

    // verify body
    verify(multipartBuilder).build();
    verify(multipartBuilder).setType(MultipartBody.FORM);
    ArgumentCaptor<Headers> headersArgumentCaptor = ArgumentCaptor.forClass(Headers.class);
    ArgumentCaptor<RequestBody> bodyArgumentCaptor = ArgumentCaptor.forClass(RequestBody.class);
    verify(multipartBuilder, times(2))
        .addPart(headersArgumentCaptor.capture(), bodyArgumentCaptor.capture());

    List<Headers> bodyHeaders = headersArgumentCaptor.getAllValues();
    assertThat(bodyHeaders.size()).isEqualTo(2);
    List<RequestBody> bodyRequestBody = bodyArgumentCaptor.getAllValues();
    assertThat(bodyRequestBody.size()).isEqualTo(2);

    assertThat(bodyHeaders.get(0).get("content-disposition")).isEqualTo("user");
    assertThat(bodyRequestBody.get(0).contentType()).isNull();
    assertThat(bodyRequestBody.get(0).contentLength()).isEqualTo("locale".getBytes().length);
    assertThat(bodyHeaders.get(1).get("content-disposition"))
        .isEqualTo("filename=\"测试photo.jpg\"; filename*=utf-8''%E6%B5%8B%E8%AF%95photo.jpg");
    assertThat(bodyRequestBody.get(1).contentType()).isEqualTo(MediaType.parse("image/jpg"));
    assertThat(bodyRequestBody.get(1).contentLength()).isEqualTo("imageUri".getBytes().length);
  }

  @Test
  public void testCancelAllCallsInvalidate() throws Exception {
    MockedStatic<OkHttpCallUtil> okHttpCallUtil = mockStatic(OkHttpCallUtil.class);
    final int requests = 3;
    final Call[] calls = new Call[requests];
    for (int idx = 0; idx < requests; idx++) {
      calls[idx] = mock(Call.class);
    }

    when(mHttpClient.newCall(any(Request.class)))
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                Request request = (Request) invocation.getArguments()[0];
                return calls[(Integer) request.tag() - 1];
              }
            });
    mNetworkingModule.initialize();

    for (int idx = 0; idx < requests; idx++) {
      mNetworkingModule.sendRequest(
          "GET",
          "http://somedomain/foo",
          idx + 1,
          JavaOnlyArray.of(),
          null,
          /* responseType */ "text",
          /* useIncrementalUpdates*/ true,
          /* timeout */ 0,
          /* withCredentials */ false);
    }
    verify(mHttpClient, times(3)).newCall(any(Request.class));

    mNetworkingModule.invalidate();
    // TODO This should be migrated to okHttpCallUtil.verify();
    //  PowerMockito.verifyStatic(OkHttpCallUtil.class, times(3));
    ArgumentCaptor<OkHttpClient> clientArguments = ArgumentCaptor.forClass(OkHttpClient.class);
    ArgumentCaptor<Integer> requestIdArguments = ArgumentCaptor.forClass(Integer.class);
    OkHttpCallUtil.cancelTag(clientArguments.capture(), requestIdArguments.capture());

    assertThat(requestIdArguments.getAllValues().size()).isEqualTo(requests);
    for (int idx = 0; idx < requests; idx++) {
      assertThat(requestIdArguments.getAllValues().contains(idx + 1)).isTrue();
    }
  }

  @Test
  public void testCancelSomeCallsInvalidate() throws Exception {
    MockedStatic<OkHttpCallUtil> okHttpCallUtil = mockStatic(OkHttpCallUtil.class);
    final int requests = 3;
    final Call[] calls = new Call[requests];
    for (int idx = 0; idx < requests; idx++) {
      calls[idx] = mock(Call.class);
    }

    when(mHttpClient.newCall(any(Request.class)))
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                Request request = (Request) invocation.getArguments()[0];
                return calls[(Integer) request.tag() - 1];
              }
            });

    for (int idx = 0; idx < requests; idx++) {
      mNetworkingModule.sendRequest(
          "GET",
          "http://somedomain/foo",
          idx + 1,
          JavaOnlyArray.of(),
          null,
          /* responseType */ "text",
          /* useIncrementalUpdates*/ true,
          /* timeout */ 0,
          /* withCredentials */ false);
    }
    verify(mHttpClient, times(3)).newCall(any(Request.class));

    mNetworkingModule.abortRequest(requests);
    // TODO This should be migrated to okHttpCallUtil.verify();
    //  PowerMockito.verifyStatic(OkHttpCallUtil.class, times(1));
    ArgumentCaptor<OkHttpClient> clientArguments = ArgumentCaptor.forClass(OkHttpClient.class);
    ArgumentCaptor<Integer> requestIdArguments = ArgumentCaptor.forClass(Integer.class);
    OkHttpCallUtil.cancelTag(clientArguments.capture(), requestIdArguments.capture());
    assertThat(requestIdArguments.getAllValues().size()).isEqualTo(1);
    assertThat(requestIdArguments.getAllValues().get(0)).isEqualTo(requests);

    // verifyStatic actually does not clear all calls so far, so we have to check for all of them.
    // If `cancelTag` would've been called again for the aborted call, we would have had
    // `requests + 1` calls.
    mNetworkingModule.invalidate();
    // TODO This should be migrated to okHttpCallUtil.verify();
    //  PowerMockito.verifyStatic(OkHttpCallUtil.class, times(requests));
    clientArguments = ArgumentCaptor.forClass(OkHttpClient.class);
    requestIdArguments = ArgumentCaptor.forClass(Integer.class);
    OkHttpCallUtil.cancelTag(clientArguments.capture(), requestIdArguments.capture());
    assertThat(requestIdArguments.getAllValues().size()).isEqualTo(requests);
    for (int idx = 0; idx < requests; idx++) {
      assertThat(requestIdArguments.getAllValues().contains(idx + 1)).isTrue();
    }
  }
}
