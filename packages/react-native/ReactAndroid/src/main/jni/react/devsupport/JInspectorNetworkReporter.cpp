/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JInspectorNetworkReporter.h"

#include <jsinspector-modern/network/NetworkReporter.h>

#include <cstddef>
#include <string>
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <unordered_map>
#endif

using namespace facebook::jni;

namespace facebook::react::jsinspector_modern {

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

/* static */ jboolean JInspectorNetworkReporter::isDebuggingEnabled(
    jni::alias_ref<jclass> /*unused*/) {
  return NetworkReporter::getInstance().isDebuggingEnabled();
}

/* static */ void JInspectorNetworkReporter::reportRequestStart(
    jni::alias_ref<jclass> /*unused*/,
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

/* static */ void JInspectorNetworkReporter::reportConnectionTiming(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jni::alias_ref<jni::JMap<jstring, jstring>> headers) {
  NetworkReporter::getInstance().reportConnectionTiming(
      std::to_string(requestId), convertJavaMapToHeaders(headers));
}

/* static */ void JInspectorNetworkReporter::reportResponseStart(
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

/* static */ void JInspectorNetworkReporter::reportDataReceivedImpl(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jint dataLength) {
  NetworkReporter::getInstance().reportDataReceived(
      std::to_string(requestId), dataLength, std::nullopt);
}

/* static */ void JInspectorNetworkReporter::reportResponseEnd(
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

/* static */ void JInspectorNetworkReporter::reportRequestFailed(
    jni::alias_ref<jclass> /*unused*/,
    jint requestId,
    jboolean cancelled) {
  NetworkReporter::getInstance().reportRequestFailed(
      std::to_string(requestId), cancelled);
}

/* static */ void JInspectorNetworkReporter::maybeStoreResponseBodyImpl(
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

/* static */ void
JInspectorNetworkReporter::maybeStoreResponseBodyIncrementalImpl(
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

/* static */ void JInspectorNetworkReporter::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "isDebuggingEnabled", JInspectorNetworkReporter::isDebuggingEnabled),
      makeNativeMethod(
          "reportRequestStart", JInspectorNetworkReporter::reportRequestStart),
      makeNativeMethod(
          "reportResponseStart",
          JInspectorNetworkReporter::reportResponseStart),
      makeNativeMethod(
          "reportConnectionTiming",
          JInspectorNetworkReporter::reportConnectionTiming),
      makeNativeMethod(
          "reportDataReceivedImpl",
          JInspectorNetworkReporter::reportDataReceivedImpl),
      makeNativeMethod(
          "reportResponseEnd", JInspectorNetworkReporter::reportResponseEnd),
      makeNativeMethod(
          "reportRequestFailed",
          JInspectorNetworkReporter::reportRequestFailed),
      makeNativeMethod(
          "maybeStoreResponseBodyImpl",
          JInspectorNetworkReporter::maybeStoreResponseBodyImpl),
      makeNativeMethod(
          "maybeStoreResponseBodyIncrementalImpl",
          JInspectorNetworkReporter::maybeStoreResponseBodyIncrementalImpl),
  });
}

} // namespace facebook::react::jsinspector_modern
