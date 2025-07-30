/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorNetworkReporter.h"

#include <jsinspector-modern/network/NetworkReporter.h>

#include <cstddef>
#include <string>
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <unordered_map>
#endif

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react {

namespace {

Headers convertJavaMapToHeaders(
    jni::alias_ref<jni::JMap<jstring, jstring>> headers) {
  Headers responseHeaders;

  for (auto it : *headers) {
    auto key = it.first->toStdString();
    auto value = it.second->toStdString();
    responseHeaders[key] = value;
  }

  return responseHeaders;
}

std::string limitRequestBodySize(std::string requestBody) {
  const size_t maxBodySize = 1024 * 1024; // 1MB
  auto bodyLength = requestBody.size();
  auto bytesToRead = std::min(bodyLength, maxBodySize);

  requestBody.resize(bytesToRead);

  if (bytesToRead < bodyLength) {
    requestBody += "\n... [truncated, showing " + std::to_string(bytesToRead) +
        " of " + std::to_string(bodyLength) + " bytes]";
  }

  return requestBody;
}

} // namespace

#ifdef REACT_NATIVE_DEBUGGER_ENABLED

// Dictionary to buffer incremental response bodies (CDP debugging active only)
static std::unordered_map<int, std::string> responseBuffers;

#endif

/* static */ void InspectorNetworkReporter::reportRequestStart(
    const jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jni::alias_ref<jstring> requestUrl,
    jni::alias_ref<jstring> requestMethod,
    jni::alias_ref<jni::JMap<jstring, jstring>> requestHeaders,
    jni::alias_ref<jstring> requestBody,
    jlong encodedDataLength) {
  RequestInfo requestInfo;
  requestInfo.url = requestUrl->toStdString();
  requestInfo.httpMethod = requestMethod->toStdString();
  requestInfo.headers = convertJavaMapToHeaders(requestHeaders);
  requestInfo.httpBody = limitRequestBodySize(requestBody->toStdString());

  NetworkReporter::getInstance().reportRequestStart(
      std::to_string(requestId), requestInfo, encodedDataLength, std::nullopt);
}

/* static */ void InspectorNetworkReporter::reportConnectionTiming(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jni::alias_ref<jni::JMap<jstring, jstring>> headers) {
  NetworkReporter::getInstance().reportConnectionTiming(
      std::to_string(requestId), convertJavaMapToHeaders(headers));
}

/* static */ void InspectorNetworkReporter::reportResponseStart(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jni::alias_ref<jstring> requestUrl,
    jint responseStatus,
    jni::alias_ref<jni::JMap<jstring, jstring>> responseHeaders,
    jlong encodedDataLength) {
  ResponseInfo responseInfo;
  responseInfo.url = requestUrl->toStdString();
  responseInfo.statusCode = responseStatus;
  responseInfo.headers = convertJavaMapToHeaders(responseHeaders);

  NetworkReporter::getInstance().reportResponseStart(
      std::to_string(requestId),
      responseInfo,
      static_cast<std::int64_t>(encodedDataLength));
}

/* static */ void InspectorNetworkReporter::reportDataReceived(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jint dataLength) {
  NetworkReporter::getInstance().reportDataReceived(
      std::to_string(requestId), dataLength, std::nullopt);
}

/* static */ void InspectorNetworkReporter::reportResponseEnd(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jlong encodedDataLength) {
  NetworkReporter::getInstance().reportResponseEnd(
      std::to_string(requestId), static_cast<std::int64_t>(encodedDataLength));

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Check for buffered response body and flush to NetworkReporter
  auto buffer = responseBuffers[requestId];
  if (!buffer.empty()) {
    NetworkReporter::getInstance().storeResponseBody(
        std::to_string(requestId), buffer, false);
    responseBuffers.erase(requestId);
  }
#endif
}

/* static */ void InspectorNetworkReporter::maybeStoreResponseBody(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jni::alias_ref<jstring> body,
    jboolean base64Encoded) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Process response body and report to NetworkReporter
  auto& networkReporter = NetworkReporter::getInstance();
  if (!networkReporter.isDebuggingEnabled()) {
    return;
  }

  networkReporter.storeResponseBody(
      std::to_string(requestId), body->toStdString(), base64Encoded != 0u);
#endif
}

/* static */ void InspectorNetworkReporter::maybeStoreResponseBodyIncremental(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jni::alias_ref<jstring> data) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Buffer incremental response body contents
  auto& networkReporter = NetworkReporter::getInstance();
  if (!networkReporter.isDebuggingEnabled()) {
    return;
  }

  auto& buffer = responseBuffers[requestId];
  buffer += data->toStdString();
#endif
}

/* static */ void InspectorNetworkReporter::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "reportRequestStart", InspectorNetworkReporter::reportRequestStart),
      makeNativeMethod(
          "reportResponseStart", InspectorNetworkReporter::reportResponseStart),
      makeNativeMethod(
          "reportConnectionTiming",
          InspectorNetworkReporter::reportConnectionTiming),
      makeNativeMethod(
          "reportDataReceived", InspectorNetworkReporter::reportDataReceived),
      makeNativeMethod(
          "reportResponseEnd", InspectorNetworkReporter::reportResponseEnd),
      makeNativeMethod(
          "maybeStoreResponseBody",
          InspectorNetworkReporter::maybeStoreResponseBody),
      makeNativeMethod(
          "maybeStoreResponseBodyIncremental",
          InspectorNetworkReporter::maybeStoreResponseBodyIncremental),
  });
}

} // namespace facebook::react
