/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <folly/Optional.h>
#include <folly/dynamic.h>
#include <folly/json.h>

#include "NativeCommon.h"
#include "NativeMap.h"
#include "ReadableNativeArray.h"

namespace facebook {
namespace react {

struct WritableNativeMap;

struct ReadableMap : jni::JavaClass<ReadableMap> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/ReadableMap;";
};

void addDynamicToJArray(
    jni::local_ref<jni::JArrayClass<jobject>> jarray,
    jint index,
    const folly::dynamic &dyn);

struct ReadableNativeMap : jni::HybridClass<ReadableNativeMap, NativeMap> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/ReadableNativeMap;";

  jni::local_ref<jni::JArrayClass<jstring>> importKeys();
  jni::local_ref<jni::JArrayClass<jobject>> importValues();
  jni::local_ref<jni::JArrayClass<jobject>> importTypes();
  folly::Optional<folly::dynamic> keys_;
  static jni::local_ref<jhybridobject> createWithContents(folly::dynamic &&map);

  static void mapException(const std::exception &ex);

  static void registerNatives();

  using HybridBase::HybridBase;
  friend HybridBase;
  friend struct WritableNativeMap;
};

} // namespace react
} // namespace facebook
