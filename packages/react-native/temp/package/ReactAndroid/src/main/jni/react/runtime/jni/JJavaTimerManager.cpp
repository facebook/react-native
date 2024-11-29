/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JJavaTimerManager.h"

#include <fbjni/fbjni.h>
#include <jni.h>

namespace facebook::react {

void JJavaTimerManager::createTimer(
    uint32_t timerID,
    double duration,
    bool repeat) {
  static const auto method =
      javaClassStatic()->getMethod<void(jint, jlong, jboolean)>("createTimer");
  method(self(), timerID, (long)duration, static_cast<unsigned char>(repeat));
}

void JJavaTimerManager::deleteTimer(uint32_t timerID) {
  static const auto method =
      javaClassStatic()->getMethod<void(jint)>("deleteTimer");
  method(self(), timerID);
}

} // namespace facebook::react
