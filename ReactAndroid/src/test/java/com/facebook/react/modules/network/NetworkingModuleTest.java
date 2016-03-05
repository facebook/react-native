/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import com.squareup.okhttp.Call;
import com.squareup.okhttp.Headers;
import com.squareup.okhttp.MediaType;
import com.squareup.okhttp.MultipartBuilder;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.RequestBody;
import okio.Buffer;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests for {@link NetworkingModule}.
 */
@PrepareForTest({
    Arguments.class,
    Call.class,
    RequestBodyUtil.class,
    MultipartBuilder.class,
    NetworkingModule.class,
    OkHttpClient.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class NetworkingModuleTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Test
  public void testGetWithoutHeaders() throws Exception {
    OkHttpClient httpClient = mock(OkHttpClient.class);
    when(httpClient.newCall(any(Request.class))).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        Call callMock = mock(Call.class);
        return callMock;
      }
    });

    NetworkingModule networkingModule = new NetworkingModule(null, "", httpClient);

    networkingModule.sendRequest(
      mock(ExecutorToken.class),
      "GET",
      "http://somedomain/foo",
      0,
      JavaOnlyArray.of(),
      null,
      true,
      0);

    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(httpClient).newCall(argumentCaptor.capture());
    assertThat(argumentCaptor.getValue().urlString()).isEqualTo("http://somedomain/foo");
    // We set the User-Agent header by default
    assertThat(argumentCaptor.getValue().headers().size()).isEqualTo(1);
    assertThat(argumentCaptor.getValue().method()).isEqualTo("GET");
  }

  @Test
  public void testFailGetWithInvalidHeadersStruct() throws Exception {
    RCTDeviceEventEmitter emitter = mock(RCTDeviceEventEmitter.class);
    ReactApplicationContext context = mock(ReactApplicationContext.class);
    when(context.getJSModule(any(ExecutorToken.class), any(Class.class))).thenReturn(emitter);

    OkHttpClient httpClient = mock(OkHttpClient.class);
    NetworkingModule networkingModule = new NetworkingModule(context, "", httpClient);

    List<JavaOnlyArray> invalidHeaders = Arrays.asList(JavaOnlyArray.of("foo"));

    mockEvents();

    networkingModule.sendRequest(
      mock(ExecutorToken.class),
      "GET",
      "http://somedoman/foo",
      0,
      JavaOnlyArray.from(invalidHeaders),
      null,
      true,
      0);

    verifyErrorEmit(emitter, 0);
  }

  @Test
  public void testFailPostWithoutContentType() throws Exception {
    RCTDeviceEventEmitter emitter = mock(RCTDeviceEventEmitter.class);
    ReactApplicationContext context = mock(ReactApplicationContext.class);
    when(context.getJSModule(any(ExecutorToken.class), any(Class.class))).thenReturn(emitter);

    OkHttpClient httpClient = mock(OkHttpClient.class);
    NetworkingModule networkingModule = new NetworkingModule(context, "", httpClient);

    JavaOnlyMap body = new JavaOnlyMap();
    body.putString("string", "This is request body");

    mockEvents();

    networkingModule.sendRequest(
      mock(ExecutorToken.class),
      "POST",
      "http://somedomain/bar",
      0,
      JavaOnlyArray.of(),
      body,
      true,
      0);

    verifyErrorEmit(emitter, 0);
  }

  private static void verifyErrorEmit(RCTDeviceEventEmitter emitter, int requestId) {
    ArgumentCaptor<WritableArray> captor = ArgumentCaptor.forClass(WritableArray.class);
    verify(emitter).emit(eq("didCompleteNetworkResponse"), captor.capture());

    WritableArray array = captor.getValue();
    assertThat(array.getInt(0)).isEqualTo(requestId);
    assertThat(array.getString(1)).isNotNull();
  }

  private static void mockEvents() {
    PowerMockito.mockStatic(Arguments.class);
    Mockito.when(Arguments.createArray()).thenAnswer(
        new Answer<WritableArray>() {
          @Override
          public WritableArray answer(InvocationOnMock invocation) throws Throwable {
            return new JavaOnlyArray();
          }
        });

    Mockito.when(Arguments.createMap()).thenAnswer(
        new Answer<WritableMap>() {
          @Override
          public WritableMap answer(InvocationOnMock invocation) throws Throwable {
            return new JavaOnlyMap();
          }
        });
  }

  @Test
  public void testSuccessfulPostRequest() throws Exception {
    OkHttpClient httpClient = mock(OkHttpClient.class);
    when(httpClient.newCall(any(Request.class))).thenAnswer(new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            Call callMock = mock(Call.class);
            return callMock;
          }
        });

    NetworkingModule networkingModule = new NetworkingModule(null, "", httpClient);

    JavaOnlyMap body = new JavaOnlyMap();
    body.putString("string", "This is request body");

    networkingModule.sendRequest(
      mock(ExecutorToken.class),
      "POST",
      "http://somedomain/bar",
      0,
      JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "text/plain")),
      body,
      true,
      0);

    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(httpClient).newCall(argumentCaptor.capture());
    assertThat(argumentCaptor.getValue().urlString()).isEqualTo("http://somedomain/bar");
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
    OkHttpClient httpClient = mock(OkHttpClient.class);
    when(httpClient.newCall(any(Request.class))).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        Call callMock = mock(Call.class);
        return callMock;
      }
    });
    NetworkingModule networkingModule = new NetworkingModule(null, "", httpClient);

    List<JavaOnlyArray> headers = Arrays.asList(
        JavaOnlyArray.of("Accept", "text/plain"),
        JavaOnlyArray.of("User-Agent", "React test agent/1.0"));

    networkingModule.sendRequest(
      mock(ExecutorToken.class),
      "GET",
      "http://someurl/baz",
      0,
      JavaOnlyArray.from(headers),
      null,
      true,
      0);
    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(httpClient).newCall(argumentCaptor.capture());
    Headers requestHeaders = argumentCaptor.getValue().headers();
    assertThat(requestHeaders.size()).isEqualTo(2);
    assertThat(requestHeaders.get("Accept")).isEqualTo("text/plain");
    assertThat(requestHeaders.get("User-Agent")).isEqualTo("React test agent/1.0");
  }

  @Test
  public void testMultipartPostRequestSimple() throws Exception {
    PowerMockito.mockStatic(RequestBodyUtil.class);
    when(RequestBodyUtil.getFileInputStream(any(ReactContext.class), any(String.class)))
        .thenReturn(mock(InputStream.class));
    when(RequestBodyUtil.create(any(MediaType.class), any(InputStream.class)))
        .thenReturn(mock(RequestBody.class));

    JavaOnlyMap body = new JavaOnlyMap();
    JavaOnlyArray formData = new JavaOnlyArray();
    JavaOnlyMap bodyPart = new JavaOnlyMap();
    bodyPart.putString("string", "value");
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(
            Arrays.asList(
                JavaOnlyArray.of("content-disposition", "name"))));
    formData.pushMap(bodyPart);
    body.putArray("formData", formData);

    OkHttpClient httpClient = mock(OkHttpClient.class);
    when(httpClient.newCall(any(Request.class))).thenAnswer(
        new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            Call callMock = mock(Call.class);
            return callMock;
          }
        });

    NetworkingModule networkingModule = new NetworkingModule(null, "", httpClient);
    networkingModule.sendRequest(
      mock(ExecutorToken.class),
      "POST",
      "http://someurl/uploadFoo",
      0,
      new JavaOnlyArray(),
      body,
      true,
      0);

    // verify url, method, headers
    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(httpClient).newCall(argumentCaptor.capture());
    assertThat(argumentCaptor.getValue().urlString()).isEqualTo("http://someurl/uploadFoo");
    assertThat(argumentCaptor.getValue().method()).isEqualTo("POST");
    assertThat(argumentCaptor.getValue().body().contentType().type()).
        isEqualTo(MultipartBuilder.FORM.type());
    assertThat(argumentCaptor.getValue().body().contentType().subtype()).
        isEqualTo(MultipartBuilder.FORM.subtype());
    Headers requestHeaders = argumentCaptor.getValue().headers();
    assertThat(requestHeaders.size()).isEqualTo(1);
  }

  @Test
  public void testMultipartPostRequestHeaders() throws Exception {
    PowerMockito.mockStatic(RequestBodyUtil.class);
    when(RequestBodyUtil.getFileInputStream(any(ReactContext.class), any(String.class)))
        .thenReturn(mock(InputStream.class));
    when(RequestBodyUtil.create(any(MediaType.class), any(InputStream.class)))
        .thenReturn(mock(RequestBody.class));

    List<JavaOnlyArray> headers = Arrays.asList(
            JavaOnlyArray.of("Accept", "text/plain"),
            JavaOnlyArray.of("User-Agent", "React test agent/1.0"),
            JavaOnlyArray.of("content-type", "multipart/form-data"));

    JavaOnlyMap body = new JavaOnlyMap();
    JavaOnlyArray formData = new JavaOnlyArray();
    JavaOnlyMap bodyPart = new JavaOnlyMap();
    bodyPart.putString("string", "value");
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(
            Arrays.asList(
                JavaOnlyArray.of("content-disposition", "name"))));
    formData.pushMap(bodyPart);
    body.putArray("formData", formData);

    OkHttpClient httpClient = mock(OkHttpClient.class);
    when(httpClient.newCall(any(Request.class))).thenAnswer(
        new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            Call callMock = mock(Call.class);
            return callMock;
          }
        });

    NetworkingModule networkingModule = new NetworkingModule(null, "", httpClient);
    networkingModule.sendRequest(
      mock(ExecutorToken.class),
      "POST",
      "http://someurl/uploadFoo",
      0,
      JavaOnlyArray.from(headers),
      body,
      true,
      0);

    // verify url, method, headers
    ArgumentCaptor<Request> argumentCaptor = ArgumentCaptor.forClass(Request.class);
    verify(httpClient).newCall(argumentCaptor.capture());
    assertThat(argumentCaptor.getValue().urlString()).isEqualTo("http://someurl/uploadFoo");
    assertThat(argumentCaptor.getValue().method()).isEqualTo("POST");
    assertThat(argumentCaptor.getValue().body().contentType().type()).
        isEqualTo(MultipartBuilder.FORM.type());
    assertThat(argumentCaptor.getValue().body().contentType().subtype()).
        isEqualTo(MultipartBuilder.FORM.subtype());
    Headers requestHeaders = argumentCaptor.getValue().headers();
    assertThat(requestHeaders.size()).isEqualTo(3);
    assertThat(requestHeaders.get("Accept")).isEqualTo("text/plain");
    assertThat(requestHeaders.get("User-Agent")).isEqualTo("React test agent/1.0");
    assertThat(requestHeaders.get("content-type")).isEqualTo("multipart/form-data");
  }

  @Test
  public void testMultipartPostRequestBody() throws Exception {
    InputStream inputStream = mock(InputStream.class);
    PowerMockito.mockStatic(RequestBodyUtil.class);
    when(RequestBodyUtil.getFileInputStream(any(ReactContext.class), any(String.class)))
        .thenReturn(inputStream);
    when(RequestBodyUtil.create(any(MediaType.class), any(InputStream.class))).thenCallRealMethod();
    when(inputStream.available()).thenReturn("imageUri".length());

    final MultipartBuilder multipartBuilder = mock(MultipartBuilder.class);
    PowerMockito.whenNew(MultipartBuilder.class).withNoArguments().thenReturn(multipartBuilder);
    when(multipartBuilder.type(any(MediaType.class))).thenAnswer(
        new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            return multipartBuilder;
          }
        });
    when(multipartBuilder.addPart(any(Headers.class), any(RequestBody.class))).thenAnswer(
        new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            return multipartBuilder;
          }
        });
    when(multipartBuilder.build()).thenAnswer(
        new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            return mock(RequestBody.class);
          }
        });

    List<JavaOnlyArray> headers = Arrays.asList(
            JavaOnlyArray.of("content-type", "multipart/form-data"));

    JavaOnlyMap body = new JavaOnlyMap();
    JavaOnlyArray formData = new JavaOnlyArray();
    body.putArray("formData", formData);

    JavaOnlyMap bodyPart = new JavaOnlyMap();
    bodyPart.putString("string", "locale");
    bodyPart.putArray(
        "headers",
        JavaOnlyArray.from(
            Arrays.asList(
                          JavaOnlyArray.of("content-disposition", "user"))));
    formData.pushMap(bodyPart);

    JavaOnlyMap imageBodyPart = new JavaOnlyMap();
    imageBodyPart.putString("uri", "imageUri");
    imageBodyPart.putArray(
        "headers",
        JavaOnlyArray.from(
            Arrays.asList(
                JavaOnlyArray.of("content-type", "image/jpg"),
                JavaOnlyArray.of("content-disposition", "filename=photo.jpg"))));
    formData.pushMap(imageBodyPart);

    OkHttpClient httpClient = mock(OkHttpClient.class);
    when(httpClient.newCall(any(Request.class))).thenAnswer(
        new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            Call callMock = mock(Call.class);
            return callMock;
          }
        });

    NetworkingModule networkingModule = new NetworkingModule(null, "", httpClient);
    networkingModule.sendRequest(
      mock(ExecutorToken.class),
      "POST",
      "http://someurl/uploadFoo",
      0,
      JavaOnlyArray.from(headers),
      body,
      true,
      0);

    // verify RequestBodyPart for image
    PowerMockito.verifyStatic(times(1));
    RequestBodyUtil.getFileInputStream(any(ReactContext.class), eq("imageUri"));
    PowerMockito.verifyStatic(times(1));
    RequestBodyUtil.create(MediaType.parse("image/jpg"), inputStream);

    // verify body
    verify(multipartBuilder).build();
    verify(multipartBuilder).type(MultipartBuilder.FORM);
    ArgumentCaptor<Headers> headersArgumentCaptor = ArgumentCaptor.forClass(Headers.class);
    ArgumentCaptor<RequestBody> bodyArgumentCaptor = ArgumentCaptor.forClass(RequestBody.class);
    verify(multipartBuilder, times(2)).
        addPart(headersArgumentCaptor.capture(), bodyArgumentCaptor.capture());

    List<Headers> bodyHeaders = headersArgumentCaptor.getAllValues();
    assertThat(bodyHeaders.size()).isEqualTo(2);
    List<RequestBody> bodyRequestBody = bodyArgumentCaptor.getAllValues();
    assertThat(bodyRequestBody.size()).isEqualTo(2);

    assertThat(bodyHeaders.get(0).get("content-disposition")).isEqualTo("user");
    assertThat(bodyRequestBody.get(0).contentType()).isNull();
    assertThat(bodyRequestBody.get(0).contentLength()).isEqualTo("locale".getBytes().length);
    assertThat(bodyHeaders.get(1).get("content-disposition")).isEqualTo("filename=photo.jpg");
    assertThat(bodyRequestBody.get(1).contentType()).isEqualTo(MediaType.parse("image/jpg"));
    assertThat(bodyRequestBody.get(1).contentLength()).isEqualTo("imageUri".getBytes().length);
  }
}
