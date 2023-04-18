// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <cstdint>

#include <fb/fbjni.h>
#include <jni.h>

namespace facebook {
namespace react {

struct JJavaTimerManager : jni::JavaClass<JJavaTimerManager> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/modules/core/JavaTimerManager;";

  void createTimer(uint32_t timerID, double duration, bool repeat);

  void deleteTimer(uint32_t timerID);
};

} // namespace react
} // namespace facebook
