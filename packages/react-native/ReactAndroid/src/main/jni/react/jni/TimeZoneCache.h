/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react {

class TimeZoneCache : public jni::HybridClass<TimeZoneCache> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/modules/timezone/TimeZoneModule;";

  static void registerNatives();

  static void resetNativeHermesTimeZoneCache(jni::alias_ref<jclass> /* unused */, jlong jsRuntimePtr);

  ~TimeZoneCache() = default;

  friend HybridBase;
};

} // namespace facebook::react
