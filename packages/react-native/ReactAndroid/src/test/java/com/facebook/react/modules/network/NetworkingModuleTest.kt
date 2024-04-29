/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.network.OkHttpCallUtil
import java.io.InputStream
import java.nio.charset.StandardCharsets
import okhttp3.Call
import okhttp3.Headers
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.MultipartBody.Companion.FORM
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.Buffer
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Ignore
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.eq
import org.mockito.Captor
import org.mockito.MockedStatic
import org.mockito.Mockito.mock
import org.mockito.Mockito.mockStatic
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when` as whenever
import org.robolectric.RobolectricTestRunner

/**
 * Returns Mockito.any() as nullable type to avoid java.lang.IllegalStateException when null is
 * returned.
 */
private fun <T> anyOrNull(type: Class<T>): T = any(type)

/**
 * Returns ArgumentCaptor.capture() as nullable type to avoid java.lang.IllegalStateException when
 * null is returned.
 */
fun <T> capture(argumentCaptor: ArgumentCaptor<T>): T = argumentCaptor.capture()

@RunWith(RobolectricTestRunner::class)
class NetworkingModuleTest {
  private lateinit var networkingModule: NetworkingModule
  private lateinit var httpClient: OkHttpClient
  private lateinit var context: ReactApplicationContext
  private lateinit var arguments: MockedStatic<Arguments>
  private lateinit var requestBodyUtil: MockedStatic<RequestBodyUtil>

  @Captor private lateinit var requestArgumentCaptor: ArgumentCaptor<Request>

  @Before
  fun prepareModules() {
    httpClient = mock(OkHttpClient::class.java)
    whenever(httpClient.cookieJar).thenReturn(mock(CookieJarContainer::class.java))
    whenever(httpClient.newCall(anyOrNull(Request::class.java))).thenAnswer {
      val callMock = mock(Call::class.java)
      callMock
    }

    val clientBuilder = mock(OkHttpClient.Builder::class.java)
    whenever(clientBuilder.build()).thenReturn(httpClient)
    whenever(httpClient.newBuilder()).thenReturn(clientBuilder)

    val reactInstance = mock(CatalystInstance::class.java)

    context = mock(ReactApplicationContext::class.java)
    whenever(context.catalystInstance).thenReturn(reactInstance)
    whenever(context.hasActiveReactInstance()).thenReturn(true)

    networkingModule = NetworkingModule(context, "", httpClient)

    arguments = mockStatic(Arguments::class.java)
    arguments.`when`<WritableArray>(Arguments::createArray).thenAnswer { JavaOnlyArray() }
    arguments.`when`<WritableMap>(Arguments::createMap).thenAnswer { JavaOnlyMap() }

    requestBodyUtil = mockStatic(RequestBodyUtil::class.java)
    requestBodyUtil
        .`when`<InputStream> {
          RequestBodyUtil.getFileInputStream(any(ReactContext::class.java), any(String::class.java))
        }
        .thenReturn(mock(InputStream::class.java))
    requestBodyUtil
        .`when`<RequestBody> {
          RequestBodyUtil.create(any(MediaType::class.java), any(InputStream::class.java))
        }
        .thenReturn(mock(RequestBody::class.java))
    requestBodyUtil
        .`when`<ProgressRequestBody> {
          RequestBodyUtil.createProgressRequest(
              any(RequestBody::class.java), any(ProgressListener::class.java))
        }
        .thenCallRealMethod()

    requestArgumentCaptor = ArgumentCaptor.forClass(Request::class.java)
  }

  @After
  fun tearDown() {
    arguments.close()
    requestBodyUtil.close()
  }

  @Test
  fun testGetWithoutHeaders() {
    networkingModule.sendRequest(
        "GET",
        "http://somedomain/foo",
        0.0, /* requestId */
        JavaOnlyArray.of(), /* headers */
        null, /* body */
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verify(httpClient).newCall(capture(requestArgumentCaptor))
    assertThat(requestArgumentCaptor.value.url.toString()).isEqualTo("http://somedomain/foo")
    // We set the User-Agent header by default
    assertThat(requestArgumentCaptor.value.headers.size).isEqualTo(1)
    assertThat(requestArgumentCaptor.value.method).isEqualTo("GET")
  }

  @Test
  fun testFailGetWithInvalidHeadersStruct() {
    val invalidHeaders = listOf(JavaOnlyArray.of("foo"))

    networkingModule.sendRequest(
        "GET",
        "http://somedoman/foo",
        0.0, /* requestId */
        JavaOnlyArray.from(invalidHeaders), /* headers */
        null, /* body */
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verifyErrorEmit(context, 0)
  }

  @Test
  fun testFailPostWithoutContentType() {
    val body = JavaOnlyMap()
    body.putString("string", "This is request body")

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verifyErrorEmit(context, 0)
  }

  @Test
  fun testFailInvalidUrl() {
    networkingModule.sendRequest(
        "GET",
        "aaa",
        0.0, /* requestId */
        JavaOnlyArray.of(), /* headers */
        null, /* body */
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verifyErrorEmit(context, 0)
  }

  private fun verifyErrorEmit(context: ReactApplicationContext, requestId: Int) {
    val captor = ArgumentCaptor.forClass(WritableArray::class.java)
    verify(context).emitDeviceEvent(eq("didCompleteNetworkResponse"), captor.capture())

    val array = captor.value
    assertThat(array.getInt(0)).isEqualTo(requestId)
    assertThat(array.getString(1)).isNotNull
  }

  @Test
  fun testSuccessfulPostRequest() {
    val body = JavaOnlyMap()
    body.putString("string", "This is request body")

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "text/plain")),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verify(httpClient).newCall(capture(requestArgumentCaptor))
    assertThat(requestArgumentCaptor.value.url.toString()).isEqualTo("http://somedomain/bar")
    assertThat(requestArgumentCaptor.value.headers.size).isEqualTo(2)
    assertThat(requestArgumentCaptor.value.method).isEqualTo("POST")
    assertThat(requestArgumentCaptor.value.body!!.contentType()!!.type).isEqualTo("text")
    assertThat(requestArgumentCaptor.value.body!!.contentType()!!.subtype).isEqualTo("plain")
    val contentBuffer = Buffer()
    requestArgumentCaptor.value.body!!.writeTo(contentBuffer)
    assertThat(contentBuffer.readUtf8()).isEqualTo("This is request body")
  }

  @Test
  fun testHeaders() {
    val headers =
        listOf(
            JavaOnlyArray.of("Accept", "text/plain"),
            JavaOnlyArray.of("User-Agent", "React test agent/1.0"))

    networkingModule.sendRequest(
        "GET",
        "http://someurl/baz",
        0.0,
        JavaOnlyArray.from(headers),
        null,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verify(httpClient).newCall(capture(requestArgumentCaptor))
    val requestHeaders = requestArgumentCaptor.value.headers
    assertThat(requestHeaders.size).isEqualTo(2)
    assertThat(requestHeaders["Accept"]).isEqualTo("text/plain")
    assertThat(requestHeaders["User-Agent"]).isEqualTo("React test agent/1.0")
  }

  @Test
  fun testPostJsonContentTypeHeader() {
    val body = JavaOnlyMap()
    body.putString("string", "{ \"key\": \"value\" }")

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "application/json")),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verify(httpClient).newCall(capture(requestArgumentCaptor))

    // Verify okhttp does not append "charset=utf-8"
    assertThat(requestArgumentCaptor.value.body!!.contentType().toString())
        .isEqualTo("application/json")
  }

  @Test
  fun testRespectsExistingCharacterSet() {
    val testString = "Friðjónsson"

    val body = JavaOnlyMap()
    body.putString("string", testString)

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "text/plain; charset=utf-16")),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verify(httpClient).newCall(capture(requestArgumentCaptor))

    val contentBuffer = Buffer()
    requestArgumentCaptor.value.body!!.writeTo(contentBuffer)
    assertThat(contentBuffer.readString(StandardCharsets.UTF_16)).isEqualTo(testString)
  }

  @Test
  fun testGracefullyRecoversFromInvalidContentType() {
    val body = JavaOnlyMap()
    body.putString("string", "test")

    networkingModule.sendRequest(
        "POST",
        "http://somedomain/bar",
        0.0,
        JavaOnlyArray.of(JavaOnlyArray.of("Content-Type", "invalid")),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    verify(httpClient).newCall(capture(requestArgumentCaptor))

    val contentBuffer = Buffer()
    requestArgumentCaptor.value.body!!.writeTo(contentBuffer)

    assertThat(contentBuffer.readString(StandardCharsets.UTF_8)).isEqualTo("test")
    assertThat(requestArgumentCaptor.value.header("Content-Type")).isEqualTo("invalid")
  }

  @Test
  fun testMultipartPostRequestSimple() {
    val body = JavaOnlyMap()
    val formData = JavaOnlyArray()
    val bodyPart = JavaOnlyMap()
    bodyPart.putString("string", "value")
    bodyPart.putArray(
        "headers", JavaOnlyArray.from(listOf(JavaOnlyArray.of("content-disposition", "name"))))
    formData.pushMap(bodyPart)
    body.putArray("formData", formData)

    networkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0.0,
        JavaOnlyArray(),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    // verify url, method, headers
    verify(httpClient).newCall(capture(requestArgumentCaptor))
    assertThat(requestArgumentCaptor.value.url.toString()).isEqualTo("http://someurl/uploadFoo")
    assertThat(requestArgumentCaptor.value.method).isEqualTo("POST")
    assertThat(requestArgumentCaptor.value.body!!.contentType()!!.type).isEqualTo(FORM.type)
    assertThat(requestArgumentCaptor.value.body!!.contentType()!!.subtype).isEqualTo(FORM.subtype)
    val requestHeaders = requestArgumentCaptor.value.headers
    assertThat(requestHeaders.size).isEqualTo(1)
  }

  @Test
  fun testMultipartPostRequestHeaders() {
    val headers =
        listOf(
            JavaOnlyArray.of("Accept", "text/plain"),
            JavaOnlyArray.of("User-Agent", "React test agent/1.0"),
            JavaOnlyArray.of("content-type", "multipart/form-data"))

    val body = JavaOnlyMap()
    val formData = JavaOnlyArray()
    val bodyPart = JavaOnlyMap()
    bodyPart.putString("string", "value")
    bodyPart.putArray(
        "headers", JavaOnlyArray.from(listOf(JavaOnlyArray.of("content-disposition", "name"))))
    formData.pushMap(bodyPart)
    body.putArray("formData", formData)

    networkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0.0,
        JavaOnlyArray.from(headers),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    // verify url, method, headers
    verify(httpClient).newCall(capture(requestArgumentCaptor))
    assertThat(requestArgumentCaptor.value.url.toString()).isEqualTo("http://someurl/uploadFoo")
    assertThat(requestArgumentCaptor.value.method).isEqualTo("POST")
    assertThat(requestArgumentCaptor.value.body!!.contentType()!!.type).isEqualTo(FORM.type)
    assertThat(requestArgumentCaptor.value.body!!.contentType()!!.subtype).isEqualTo(FORM.subtype)
    val requestHeaders = requestArgumentCaptor.value.headers
    assertThat(requestHeaders.size).isEqualTo(3)
    assertThat(requestHeaders["Accept"]).isEqualTo("text/plain")
    assertThat(requestHeaders["User-Agent"]).isEqualTo("React test agent/1.0")
    assertThat(requestHeaders["content-type"]).isEqualTo("multipart/form-data")
  }

  @Test
  @Ignore("TODO: Fix me (T171890419)")
  fun testMultipartPostRequestBody() {
    val inputStream = mock(InputStream::class.java)
    whenever(inputStream.available()).thenReturn("imageUri".length)

    val multipartBuilder = mock(MultipartBody.Builder::class.java)
    // TODO This PowerMock statement should be migrated to an equivalent for Mockito
    //      once this test is unsuppressed.
    //    whenNew(MultipartBody.Builder.class)
    //        .withNoArguments()
    //        .thenReturn(multipartBuilder);
    whenever(multipartBuilder.setType(anyOrNull(MediaType::class.java))).thenAnswer {
      multipartBuilder
    }
    whenever(multipartBuilder.addPart(any(Headers::class.java), anyOrNull(RequestBody::class.java)))
        .thenAnswer { multipartBuilder }
    whenever(multipartBuilder.build()).thenAnswer { mock(MultipartBody::class.java) }

    val headers = listOf(JavaOnlyArray.of("content-type", "multipart/form-data"))

    val body = JavaOnlyMap()
    val formData = JavaOnlyArray()
    body.putArray("formData", formData)

    val bodyPart = JavaOnlyMap()
    bodyPart.putString("string", "locale")
    bodyPart.putArray(
        "headers", JavaOnlyArray.from(listOf(JavaOnlyArray.of("content-disposition", "user"))))
    formData.pushMap(bodyPart)

    val imageBodyPart = JavaOnlyMap()
    imageBodyPart.putString("uri", "imageUri")
    imageBodyPart.putArray(
        "headers",
        JavaOnlyArray.from(
            listOf(
                JavaOnlyArray.of("content-type", "image/jpg"),
                JavaOnlyArray.of(
                    "content-disposition",
                    "filename=\"测试photo.jpg\"; filename*=utf-8''%E6%B5%8B%E8%AF%95photo.jpg"))))

    formData.pushMap(imageBodyPart)

    networkingModule.sendRequest(
        "POST",
        "http://someurl/uploadFoo",
        0.0,
        JavaOnlyArray.from(headers),
        body,
        "text", /* responseType */
        true, /* useIncrementalUpdates*/
        0.0, /* timeout */
        false /* withCredentials */)

    // verify RequestBodyPart for image

    // TODO This should be migrated to requestBodyUtil.verify();
    //  PowerMockito.verifyStatic(RequestBodyUtil.class, times(1));
    RequestBodyUtil.getFileInputStream(any(ReactContext::class.java), eq("imageUri"))
    // TODO This should be migrated to requestBodyUtil.verify();
    //  PowerMockito.verifyStatic(RequestBodyUtil.class, times(1));
    RequestBodyUtil.create("image/jpg".toMediaTypeOrNull(), inputStream)

    // verify body
    // TODO fix it (now mock is not called)
    verify(multipartBuilder).build()
    verify(multipartBuilder).setType(FORM)
    // TODO fix it (Captors are nulls)
    val headersArgumentCaptor = ArgumentCaptor.forClass(Headers::class.java)
    val bodyArgumentCaptor = ArgumentCaptor.forClass(RequestBody::class.java)
    verify(multipartBuilder, times(2))
        .addPart(capture(headersArgumentCaptor), capture(bodyArgumentCaptor))

    val bodyHeaders = headersArgumentCaptor.allValues
    assertThat(bodyHeaders.size).isEqualTo(2)
    val bodyRequestBody = bodyArgumentCaptor.allValues
    assertThat(bodyRequestBody.size).isEqualTo(2)

    assertThat(bodyHeaders[0]["content-disposition"]).isEqualTo("user")
    assertThat(bodyRequestBody[0].contentType()).isNull()
    assertThat(bodyRequestBody[0].contentLength()).isEqualTo("locale".toByteArray().size.toLong())
    assertThat(bodyHeaders[1]["content-disposition"])
        .isEqualTo("filename=\"测试photo.jpg\"; filename*=utf-8''%E6%B5%8B%E8%AF%95photo.jpg")
    assertThat<MediaType?>(bodyRequestBody[1].contentType())
        .isEqualTo("image/jpg".toMediaTypeOrNull())
    assertThat(bodyRequestBody[1].contentLength()).isEqualTo("imageUri".toByteArray().size.toLong())
  }

  @Test
  @Ignore("TODO: Fix me (T171890419)")
  fun testCancelAllCallsInvalidate() {
    val requests = 3
    val calls = arrayOfNulls<Call>(requests)
    for (idx in 0 until requests) {
      calls[idx] = mock(Call::class.java)
    }

    whenever(httpClient.newCall(anyOrNull(Request::class.java))).thenAnswer { invocation ->
      val request = invocation.arguments[0] as Request
      calls[(request.tag() as Int?)!! - 1]
    }
    networkingModule.initialize()

    for (idx in 0 until requests) {
      networkingModule.sendRequest(
          "GET",
          "http://somedomain/foo",
          (idx + 1).toDouble(),
          JavaOnlyArray.of(),
          null,
          "text", /* responseType */
          true, /* useIncrementalUpdates*/
          0.0, /* timeout */
          false /* withCredentials */)
    }

    verify(httpClient, times(3)).newCall(anyOrNull(Request::class.java))

    networkingModule.invalidate()
    // TODO This should be migrated to okHttpCallUtil.verify();
    //  PowerMockito.verifyStatic(OkHttpCallUtil.class, times(3));
    val clientArguments = ArgumentCaptor.forClass(OkHttpClient::class.java)
    val requestIdArguments = ArgumentCaptor.forClass(Int::class.java)

    OkHttpCallUtil.cancelTag(capture(clientArguments), capture(requestIdArguments))

    assertThat(requestIdArguments.allValues.size).isEqualTo(requests)
    for (idx in 0 until requests) {
      assertThat(requestIdArguments.allValues.contains(idx + 1)).isTrue
    }
  }

  @Test
  @Ignore("TODO: Fix me (T171890419)")
  fun testCancelSomeCallsInvalidate() {
    val requests = 3
    val calls = arrayOfNulls<Call>(requests)
    for (idx in 0 until requests) {
      calls[idx] = mock(Call::class.java)
    }
    whenever(httpClient.newCall(anyOrNull(Request::class.java))).thenAnswer { invocation ->
      val request = invocation.arguments[0] as Request
      calls[(request.tag() as Int?)!! - 1]
    }

    for (idx in 0 until requests) {
      networkingModule.sendRequest(
          "GET",
          "http://somedomain/foo",
          (idx + 1).toDouble(),
          JavaOnlyArray.of(),
          null,
          "text", /* responseType */
          true, /* useIncrementalUpdates*/
          0.0, /* timeout */
          false /* withCredentials */)
    }
    verify(httpClient, times(3)).newCall(anyOrNull(Request::class.java))

    networkingModule.abortRequest(requests.toDouble())
    // TODO This should be migrated to okHttpCallUtil.verify();
    //  PowerMockito.verifyStatic(OkHttpCallUtil.class, times(1));
    var clientArguments = ArgumentCaptor.forClass(OkHttpClient::class.java)
    var requestIdArguments = ArgumentCaptor.forClass(Int::class.java)
    OkHttpCallUtil.cancelTag(clientArguments.capture(), requestIdArguments.capture())
    println(requestIdArguments.allValues)
    assertThat(requestIdArguments.allValues.size).isEqualTo(1)
    assertThat(requestIdArguments.allValues[0]).isEqualTo(requests)

    // verifyStatic actually does not clear all calls so far, so we have to check for all of
    // them.
    // If `cancelTag` would've been called again for the aborted call, we would have had
    // `requests + 1` calls.
    networkingModule.invalidate()
    // TODO This should be migrated to okHttpCallUtil.verify();
    //  PowerMockito.verifyStatic(OkHttpCallUtil.class, times(requests));
    clientArguments = ArgumentCaptor.forClass(OkHttpClient::class.java)
    requestIdArguments = ArgumentCaptor.forClass(Int::class.java)
    OkHttpCallUtil.cancelTag(clientArguments.capture(), requestIdArguments.capture())
    assertThat(requestIdArguments.allValues.size).isEqualTo(requests)
    for (idx in 0 until requests) {
      assertThat(requestIdArguments.allValues.contains(idx + 1)).isTrue
    }
  }
}
