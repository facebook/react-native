/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react {

class InspectorNetworkReporter
    : public jni::HybridClass<InspectorNetworkReporter> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/modules/network/InspectorNetworkReporter;";

  static void reportRequestStart(
      jni::alias_ref<jclass> /*unused*/,
      jint requestId,
      jni::alias_ref<jstring> requestUrl,
      jni::alias_ref<jstring> requestMethod,
      jni::alias_ref<jni::JMap<jstring, jstring>> requestHeaders,
      jni::alias_ref<jstring> requestBody,
      jlong encodedDataLength);

  static void reportConnectionTiming(
      jni::alias_ref<jclass> /*unused*/,
      jint requestId,
      jni::alias_ref<jni::JMap<jstring, jstring>> headers);

  static void reportResponseStart(
      jni::alias_ref<jclass> /*unused*/,
      jint requestId,
      jni::alias_ref<jstring> requestUrl,
      jint responseStatus,
      jni::alias_ref<jni::JMap<jstring, jstring>> responseHeaders,
      jlong encodedDataLength);

  static void reportResponseEnd(
      jni::alias_ref<jclass> /*unused*/,
      jint requestId,
      jlong encodedDataLength);

  static void registerNatives();

 private:
  InspectorNetworkReporter() = delete;
};

} // namespace facebook::react
