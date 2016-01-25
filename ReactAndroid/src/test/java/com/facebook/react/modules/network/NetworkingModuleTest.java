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
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.SimpleArray;
import com.facebook.react.bridge.SimpleMap;
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
        "GET",
        "http://somedomain/foo",
        0,
        SimpleArray.of(),
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
    when(context.getJSModule(any(Class.class))).thenReturn(emitter);

    OkHttpClient httpClient = mock(OkHttpClient.class);
    NetworkingModule networkingModule = new NetworkingModule(context, "", httpClient);

    List<SimpleArray> invalidHeaders = Arrays.asList(SimpleArray.of("foo"));

    mockEvents();

    networkingModule.sendRequest(
        "GET",
        "http://somedoman/foo",
        0,
        SimpleArray.from(invalidHeaders),
        null,
        true,
        0);

    verifyErrorEmit(emitter, 0);
  }

  @Test
  public void testFailPostWithoutContentType() throws Exception {
    RCTDeviceEventEmitter emitter = mock(RCTDeviceEventEmitter.class);
    ReactApplicationContext context = mock(ReactApplicationContext.class);
    when(context.getJSModule(any(Class.class))).thenReturn(emitter);

    OkHttpClient httpClient = mock(OkHttpClient.class);
    NetworkingModule networkingModule = new NetworkingModule(context, "", httpClient);

    SimpleMap body = new SimpleMap();
    body.putString("string", "This is request body");

    mockEvents();

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0,
        SimpleArray.of(),
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
            return new SimpleArray();
          }
        });

    Mockito.when(Arguments.createMap()).thenAnswer(
        new Answer<WritableMap>() {
          @Override
          public WritableMap answer(InvocationOnMock invocation) throws Throwable {
            return new SimpleMap();
          }
        });
  }

  @Test
  public void testSuccessfullPostRequest() throws Exception {
    OkHttpClient httpClient = mock(OkHttpClient.class);
    when(httpClient.newCall(any(Request.class))).thenAnswer(new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            Call callMock = mock(Call.class);
            return callMock;
          }
        });

    NetworkingModule networkingModule = new NetworkingModule(null, "", httpClient);

    SimpleMap body = new SimpleMap();
    body.putString("string", "This is request body");

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0,
        SimpleArray.of(SimpleArray.of("Content-Type", "text/plain")),
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

    List<SimpleArray> headers = Arrays.asList(
        SimpleArray.of("Accept", "text/plain"),
        SimpleArray.of("User-Agent", "React test agent/1.0"));

    networkingModule.sendRequest(
        "GET",
        "http://someurl/baz",
        0,
        SimpleArray.from(headers),
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

    SimpleMap body = new SimpleMap();
    SimpleArray formData = new SimpleArray();
    SimpleMap bodyPart = new SimpleMap();
    bodyPart.putString("string", "value");
    bodyPart.putArray(
        "headers",
        SimpleArray.from(
            Arrays.asList(
                SimpleArray.of("content-disposition", "name"))));
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
        "POST",
        "http://someurl/uploadFoo",
        0,
        new SimpleArray(),
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

    List<SimpleArray> headers = Arrays.asList(
            SimpleArray.of("Accept", "text/plain"),
            SimpleArray.of("User-Agent", "React test agent/1.0"),
            SimpleArray.of("content-type", "multipart/form-data"));

    SimpleMap body = new SimpleMap();
    SimpleArray formData = new SimpleArray();
    SimpleMap bodyPart = new SimpleMap();
    bodyPart.putString("string", "value");
    bodyPart.putArray(
        "headers",
        SimpleArray.from(
            Arrays.asList(
                SimpleArray.of("content-disposition", "name"))));
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
        "POST",
        "http://someurl/uploadFoo",
        0,
        SimpleArray.from(headers),
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

    List<SimpleArray> headers = Arrays.asList(
            SimpleArray.of("content-type", "multipart/form-data"));

    SimpleMap body = new SimpleMap();
    SimpleArray formData = new SimpleArray();
    body.putArray("formData", formData);

    SimpleMap bodyPart = new SimpleMap();
    bodyPart.putString("string", "locale");
    bodyPart.putArray(
        "headers",
        SimpleArray.from(
            Arrays.asList(
                          SimpleArray.of("content-disposition", "user"))));
    formData.pushMap(bodyPart);

    SimpleMap imageBodyPart = new SimpleMap();
    imageBodyPart.putString("uri", "imageUri");
    imageBodyPart.putArray(
        "headers",
        SimpleArray.from(
            Arrays.asList(
                SimpleArray.of("content-type", "image/jpg"),
                SimpleArray.of("content-disposition", "filename=photo.jpg"))));
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
        "POST",
        "http://someurl/uploadFoo",
        0,
        SimpleArray.from(headers),
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
